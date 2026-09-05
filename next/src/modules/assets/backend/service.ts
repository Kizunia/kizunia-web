/**
 * Assets Module - Service
 *
 * Owns Asset business operations: finalizing an upload into an ACTIVE Asset,
 * and the lifecycle transitions that follow (detach/deleting/deleted). See
 * docs/architecture/domain/assets/lifecycle.md.
 */

import { AssetCategory, AssetProvider, Prisma } from "@/generated/prisma";

import { AssetMapper } from "../mapper/asset.mapper";
import type { AssetDTO } from "../dto/asset.dto";
import { AssetReferenceChecker } from "./reference-checker";
import { AssetRepository } from "./repository";
import type { StorageConfirmedObject } from "./storage/storage-provider";

const assetMapper = new AssetMapper();

export class AssetService {
  private readonly repository = new AssetRepository();

  /**
   * Creates the Asset directly in ACTIVE from an authoritative,
   * provider-confirmed result. There is no intermediate Asset row for an
   * upload in progress — see lifecycle.md.
   */
  async finalize({
    tx,
    confirmed,
    category,
    uploadedById,
  }: {
    tx: Prisma.TransactionClient;
    confirmed: StorageConfirmedObject;
    category: AssetCategory;
    uploadedById: string;
  }): Promise<AssetDTO> {
    const repository = new AssetRepository(tx);

    const asset = await repository.createActive({
      provider: AssetProvider.CLOUDINARY,
      publicId: confirmed.providerObjectId,
      secureUrl: confirmed.secureUrl,
      format: confirmed.format,
      mimeType: confirmed.mimeType,
      width: confirmed.width,
      height: confirmed.height,
      bytes: confirmed.bytes,
      checksum: confirmed.checksum,
      originalFilename: null,
      category,
      uploadedById,
    });

    return assetMapper.toDTO(asset);
  }

  /**
   * Transitions an Asset to DETACHED, but only if nothing still references
   * it. Assets may be shared (docs/architecture/domain/assets/overview.md),
   * so removing one reference must not detach an Asset another entity still
   * depends on. Callers invoke this AFTER already clearing/reassigning their
   * own reference, inside the same transaction, so the reference count seen
   * here reflects that change.
   */
  async detachIfUnreferenced(
    tx: Prisma.TransactionClient,
    assetId: string,
  ): Promise<void> {
    const remaining = await AssetReferenceChecker.countReferences(tx, assetId);

    if (remaining > 0) {
      return;
    }

    const repository = new AssetRepository(tx);

    await repository.markDetached(assetId);
  }

  async findById(id: string) {
    return this.repository.findById({ id });
  }
}

export const assetService = new AssetService();
