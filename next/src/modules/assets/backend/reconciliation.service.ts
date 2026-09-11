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
 * outside the domain layer, and
 * docs/architecture/workflows/internal-jobs.md for the invocation
 * convention. This service has no idea Vercel, a cron, or an HTTP request
 * even exist — scheduling is deliberately kept out of this file.
 */

import prisma from "@/lib/prisma";
import type { AssetCategory } from "@/generated/prisma";

import { AssetRepository } from "./repository";
import { AssetReferenceChecker } from "./reference-checker";
import { UploadIntentRepository } from "./upload-intent.repository";
import { getStorageProvider } from "./storage";
import { ProviderObjectNotFoundError } from "./errors";

/**
 * Not decided anywhere in the architecture docs (marked TBD in
 * lifecycle.md/security.md). A conservative V1 default, isolated here so it
 * can change without touching the sweep logic.
 */
const DETACHED_CLEANUP_GRACE_PERIOD_MS = 24 * 60 * 60 * 1_000;

/**
 * Same conservative-default status as the grace period above — how long an
 * ACTIVE Asset is left alone before it becomes eligible to be checked for
 * references at all. Deliberately not the instant it's created: a
 * just-finalized upload may simply not have been attached to its target
 * entity yet (that's a separate request), and this sweep must not race that.
 */
const UNREFERENCED_ACTIVE_GRACE_PERIOD_MS = 24 * 60 * 60 * 1_000;

const SWEEP_BATCH_SIZE = 50;

/**
 * Caps how many batches of `SWEEP_BATCH_SIZE` a single sweep call will walk
 * before returning, so one invocation (in particular one HTTP request to
 * the internal route) stays bounded regardless of backlog size — each
 * batch does real provider network calls, which an unbounded loop (unlike
 * a pure-DB loop) could turn into an unpredictably long-running request. A
 * backlog larger than `MAX_BATCHES_PER_SWEEP * SWEEP_BATCH_SIZE` drains
 * across multiple scheduled invocations instead of one.
 */
const MAX_BATCHES_PER_SWEEP = 5;

export interface ReconciliationSummary {
  detachedProcessed: number;
  detachedDeleted: number;
  staleDeletingProcessed: number;
  staleDeletingDeleted: number;
  unreferencedActiveProcessed: number;
  unreferencedActiveDetached: number;
  abandonedIntentsProcessed: number;
  abandonedIntentsDeferred: number;
}

export class AssetReconciliationService {
  private readonly assetRepository = new AssetRepository();

  private readonly uploadIntentRepository = new UploadIntentRepository();

  /**
   * DETACHED, past its grace period -> DELETING -> (on success) DELETED.
   * A failed provider deletion leaves the Asset in DELETING for the next
   * sweep to retry — it never falls back to DETACHED. Walks up to
   * `MAX_BATCHES_PER_SWEEP` batches so a backlog above one batch still
   * drains within a single call.
   */
  async sweepDetached(): Promise<{ processed: number; deleted: number }> {
    const cutoff = new Date(Date.now() - DETACHED_CLEANUP_GRACE_PERIOD_MS);

    let processed = 0;
    let deleted = 0;

    for (let batch = 0; batch < MAX_BATCHES_PER_SWEEP; batch++) {
      const candidates = await this.assetRepository.findDetachedBefore(
        cutoff,
        SWEEP_BATCH_SIZE,
      );

      if (candidates.length === 0) {
        break;
      }

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

      processed += candidates.length;

      if (candidates.length < SWEEP_BATCH_SIZE) {
        break;
      }
    }

    return { processed, deleted };
  }

  /**
   * Retries physical deletion for Assets still stuck in DELETING. Every
   * DELETING row is eligible immediately (no additional staleness window
   * beyond already being in this status) — re-attempting an already-stuck
   * row every run is intentional retry behavior, not wasted work.
   */
  async sweepStaleDeleting(): Promise<{ processed: number; deleted: number }> {
    let processed = 0;
    let deleted = 0;

    for (let batch = 0; batch < MAX_BATCHES_PER_SWEEP; batch++) {
      const candidates = await this.assetRepository.findStaleDeleting(
        SWEEP_BATCH_SIZE,
      );

      if (candidates.length === 0) {
        break;
      }

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

      processed += candidates.length;

      if (candidates.length < SWEEP_BATCH_SIZE) {
        break;
      }
    }

    return { processed, deleted };
  }

  /**
   * ACTIVE Assets past the grace period that no domain relation actually
   * references — the safety net for an Asset that was successfully
   * finalized but never attached anywhere (e.g. the attach request was
   * abandoned, or the consuming domain never got wired up to write its
   * `...AssetId` FK — see docs/architecture/domain/assets/lifecycle.md).
   * Detaches (never deletes outright) exactly the same way
   * `AssetService.detachIfUnreferenced` does, so a detected orphan then
   * flows through the ordinary DETACHED -> DELETING -> DELETED pipeline
   * unchanged.
   *
   * Cursor-paginated (see `AssetRepository.findActiveBefore`) rather than
   * re-querying the same page: a still-referenced row never leaves this
   * candidate set on its own, so without a cursor a batch of
   * mostly-referenced rows would starve progress through the rest of the
   * table.
   */
  async sweepUnreferencedActive(): Promise<{
    processed: number;
    detached: number;
  }> {
    const cutoff = new Date(Date.now() - UNREFERENCED_ACTIVE_GRACE_PERIOD_MS);

    let processed = 0;
    let detached = 0;
    let cursor: string | null = null;

    for (let batch = 0; batch < MAX_BATCHES_PER_SWEEP; batch++) {
      const candidates = await this.assetRepository.findActiveBefore(
        cutoff,
        SWEEP_BATCH_SIZE,
        cursor,
      );

      if (candidates.length === 0) {
        break;
      }

      for (const asset of candidates) {
        const remaining = await AssetReferenceChecker.countReferences(
          prisma,
          asset.id,
        );

        if (remaining === 0) {
          await this.assetRepository.markDetached(asset.id);
          detached += 1;
        }
      }

      processed += candidates.length;
      cursor = candidates[candidates.length - 1].id;

      if (candidates.length < SWEEP_BATCH_SIZE) {
        break;
      }
    }

    return { processed, detached };
  }

  /**
   * Expires abandoned UploadIntents and best-effort cleans up any provider
   * object they may have produced without ever being finalized — the
   * "storage succeeded, Asset never got created" orphan case. See
   * docs/architecture/domain/assets/security.md#orphan-and-cleanup-architecture.
   *
   * An intent is only marked EXPIRED once the provider has either confirmed
   * there is nothing to clean up (`ProviderObjectNotFoundError` — the
   * common case) or an orphan was found and a deletion attempt was made. A
   * genuinely transient/ambiguous provider failure while confirming leaves
   * the intent PENDING (it stays past its own `expiresAt`, so the next
   * sweep's `findExpiredPending` picks it up again) rather than being
   * marked EXPIRED and forfeiting the only chance to ever reconcile a real
   * orphan.
   */
  async sweepAbandonedIntents(): Promise<{
    processed: number;
    deferred: number;
  }> {
    const expired = await this.uploadIntentRepository.findExpiredPending(
      SWEEP_BATCH_SIZE,
    );

    let deferred = 0;

    for (const intent of expired) {
      let shouldMarkExpired = true;

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
      } catch (error) {
        if (error instanceof ProviderObjectNotFoundError) {
          // No provider object was ever produced for this intent — the
          // common case for an abandoned upload, and nothing to reconcile.
        } else {
          // Could not determine whether an orphan exists. Defer — do not
          // treat "we couldn't check" as "there is nothing to clean up".
          shouldMarkExpired = false;
          deferred += 1;
        }
      }

      if (shouldMarkExpired) {
        await this.uploadIntentRepository.markExpired(intent.id);
      }
    }

    return { processed: expired.length, deferred };
  }

  async runAll(): Promise<ReconciliationSummary> {
    const detached = await this.sweepDetached();
    const staleDeleting = await this.sweepStaleDeleting();
    const unreferencedActive = await this.sweepUnreferencedActive();
    const abandonedIntents = await this.sweepAbandonedIntents();

    return {
      detachedProcessed: detached.processed,
      detachedDeleted: detached.deleted,
      staleDeletingProcessed: staleDeleting.processed,
      staleDeletingDeleted: staleDeleting.deleted,
      unreferencedActiveProcessed: unreferencedActive.processed,
      unreferencedActiveDetached: unreferencedActive.detached,
      abandonedIntentsProcessed: abandonedIntents.processed,
      abandonedIntentsDeferred: abandonedIntents.deferred,
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
