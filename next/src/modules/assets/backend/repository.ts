/**
 * Assets Module - Repository
 *
 * Responsible only for database access. No business rules.
 */

import {
  Asset,
  AssetCategory,
  AssetProvider,
  AssetStatus,
  Prisma,
  PrismaClient,
} from "@/generated/prisma";
import prisma from "@/lib/prisma";

export interface CreateActiveAssetData {
  provider: AssetProvider;
  publicId: string;
  secureUrl: string;
  format: string | null;
  mimeType: string | null;
  width: number | null;
  height: number | null;
  bytes: number | null;
  checksum: string | null;
  originalFilename: string | null;
  category: AssetCategory;
  uploadedById: string;
}

export class AssetRepository {
  constructor(
    private readonly db: PrismaClient | Prisma.TransactionClient = prisma,
  ) {}

  async findById({ id }: { id: string }): Promise<Asset | null> {
    return this.db.asset.findUnique({ where: { id } });
  }

  /**
   * Creates an Asset directly in ACTIVE. There is no intermediate,
   * not-yet-usable Asset row — see
   * docs/architecture/domain/assets/lifecycle.md.
   */
  async createActive(data: CreateActiveAssetData): Promise<Asset> {
    return this.db.asset.create({
      data: {
        ...data,
        status: AssetStatus.ACTIVE,
      },
    });
  }

  /**
   * Transitions an Asset to DETACHED. Callers must have already verified no
   * valid references remain (see AssetReferenceChecker) — this method does
   * not check that itself, since it operates purely on ids.
   *
   * Scoped to `status: ACTIVE` so calling this twice, or racing with another
   * detach, is a no-op rather than an error.
   */
  async markDetached(assetId: string): Promise<void> {
    await this.db.asset.updateMany({
      where: { id: assetId, status: AssetStatus.ACTIVE },
      data: { status: AssetStatus.DETACHED, detachedAt: new Date() },
    });
  }

  /** DETACHED -> DELETING. Scoped so it only ever fires from DETACHED. */
  async markDeleting(assetId: string): Promise<void> {
    await this.db.asset.updateMany({
      where: { id: assetId, status: AssetStatus.DETACHED },
      data: { status: AssetStatus.DELETING },
    });
  }

  /** DELETING -> DELETED, once provider deletion has actually succeeded. */
  async markDeleted(assetId: string): Promise<void> {
    await this.db.asset.updateMany({
      where: { id: assetId, status: AssetStatus.DELETING },
      data: { status: AssetStatus.DELETED },
    });
  }

  /** Detached long enough ago to be swept toward deletion. */
  async findDetachedBefore(cutoff: Date, limit: number): Promise<Asset[]> {
    return this.db.asset.findMany({
      where: { status: AssetStatus.DETACHED, detachedAt: { lte: cutoff } },
      take: limit,
      orderBy: { detachedAt: "asc" },
    });
  }

  /** Still DELETING — provider deletion is due for a retry. */
  async findStaleDeleting(limit: number): Promise<Asset[]> {
    return this.db.asset.findMany({
      where: { status: AssetStatus.DELETING },
      take: limit,
      orderBy: { updatedAt: "asc" },
    });
  }
}
