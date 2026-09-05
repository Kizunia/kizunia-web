/**
 * AssetReconciliationService
 *
 * Handles the cases the normal request/response flow cannot: abandoned
 * UploadIntents, detached Assets waiting for physical deletion, DELETING
 * Assets whose last deletion attempt failed, and provider objects left
 * behind by an intent that never finalized. See
 * docs/architecture/domain/assets/lifecycle.md and security.md.
 *
 * There is no background job/queue infrastructure in this repository.
 * These methods are plain, callable functions — see
 * app/api/v1/internal/assets/reconcile/route.ts for how they're invoked from
 * outside the domain layer. Scheduling (cron, platform scheduler, etc.) is
 * deliberately kept out of this file.
 */

import type { AssetCategory } from "@/generated/prisma";

import { AssetRepository } from "./repository";
import { UploadIntentRepository } from "./upload-intent.repository";
import { getStorageProvider } from "./storage";

/**
 * Not decided anywhere in the architecture docs (marked TBD in
 * lifecycle.md/security.md). A conservative V1 default, isolated here so it
 * can change without touching the sweep logic.
 */
const DETACHED_CLEANUP_GRACE_PERIOD_MS = 24 * 60 * 60 * 1_000;

const SWEEP_BATCH_SIZE = 50;

export interface ReconciliationSummary {
  detachedProcessed: number;
  detachedDeleted: number;
  staleDeletingProcessed: number;
  staleDeletingDeleted: number;
  abandonedIntentsProcessed: number;
}

export class AssetReconciliationService {
  private readonly assetRepository = new AssetRepository();

  private readonly uploadIntentRepository = new UploadIntentRepository();

  /**
   * DETACHED, past its grace period -> DELETING -> (on success) DELETED.
   * A failed provider deletion leaves the Asset in DELETING for the next
   * sweep to retry — it never falls back to DETACHED.
   */
  async sweepDetached(): Promise<{ processed: number; deleted: number }> {
    const cutoff = new Date(Date.now() - DETACHED_CLEANUP_GRACE_PERIOD_MS);

    const candidates = await this.assetRepository.findDetachedBefore(
      cutoff,
      SWEEP_BATCH_SIZE,
    );

    let deleted = 0;

    for (const asset of candidates) {
      await this.assetRepository.markDeleting(asset.id);

      const succeeded = await this.attemptProviderDeletion(
        asset.publicId,
        asset.category,
      );

      if (succeeded) {
        await this.assetRepository.markDeleted(asset.id);
        deleted += 1;
      }
      // On failure: stays DELETING. Never reverts to DETACHED.
    }

    return { processed: candidates.length, deleted };
  }

  /** Retries physical deletion for Assets still stuck in DELETING. */
  async sweepStaleDeleting(): Promise<{ processed: number; deleted: number }> {
    const candidates = await this.assetRepository.findStaleDeleting(
      SWEEP_BATCH_SIZE,
    );

    let deleted = 0;

    for (const asset of candidates) {
      const succeeded = await this.attemptProviderDeletion(
        asset.publicId,
        asset.category,
      );

      if (succeeded) {
        await this.assetRepository.markDeleted(asset.id);
        deleted += 1;
      }
    }

    return { processed: candidates.length, deleted };
  }

  /**
   * Expires abandoned UploadIntents and best-effort cleans up any provider
   * object they may have produced without ever being finalized — the
   * "storage succeeded, Asset never got created" orphan case. See
   * docs/architecture/domain/assets/security.md#orphan-and-cleanup-architecture.
   */
  async sweepAbandonedIntents(): Promise<{ processed: number }> {
    const expired = await this.uploadIntentRepository.findExpiredPending(
      SWEEP_BATCH_SIZE,
    );

    for (const intent of expired) {
      // The correlation id is not itself the provider's object id (the
      // provider derives that from it), so the orphan has to be resolved
      // through the provider before it can be deleted. A confirm that
      // throws means no object was ever produced for this intent — the
      // common case for an abandoned upload, and nothing to clean up.
      try {
        const orphan = await getStorageProvider().confirmUpload({
          correlationId: intent.providerCorrelationId,
          category: intent.category,
          declaredMimeType: intent.declaredMimeType,
        });

        await this.attemptProviderDeletion(
          orphan.providerObjectId,
          intent.category,
        );
      } catch {
        // No provider object for this intent. Nothing to reconcile.
      }

      await this.uploadIntentRepository.markExpired(intent.id);
    }

    return { processed: expired.length };
  }

  async runAll(): Promise<ReconciliationSummary> {
    const detached = await this.sweepDetached();
    const staleDeleting = await this.sweepStaleDeleting();
    const abandonedIntents = await this.sweepAbandonedIntents();

    return {
      detachedProcessed: detached.processed,
      detachedDeleted: detached.deleted,
      staleDeletingProcessed: staleDeleting.processed,
      staleDeletingDeleted: staleDeleting.deleted,
      abandonedIntentsProcessed: abandonedIntents.processed,
    };
  }

  private async attemptProviderDeletion(
    providerObjectId: string,
    category: AssetCategory,
  ): Promise<boolean> {
    try {
      await getStorageProvider().deleteObject(providerObjectId, category);
      return true;
    } catch {
      return false;
    }
  }
}

export const assetReconciliationService = new AssetReconciliationService();
