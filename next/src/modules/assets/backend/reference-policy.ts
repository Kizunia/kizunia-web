/**
 * Asset-side reference validation.
 *
 * This is HALF of what every attachment requires (see
 * docs/architecture/domain/assets/overview.md#asset-vs-upload-policy and
 * security.md): the Asset must actually be usable for the purpose it's being
 * attached for. The OTHER half — whether this actor may edit the target
 * entity at all — is target-domain authorization and stays in the relevant
 * domain module (ProjectAuthorizer, CompetitionAuthorizer,
 * PortfolioAuthorizer, ...). This helper never performs that check itself,
 * and never uses `uploadedBy` as an ownership/permission signal — a shared
 * Asset uploaded by someone else is exactly as valid a reference as one the
 * current actor uploaded themselves.
 */

import type { Prisma, PrismaClient } from "@/generated/prisma";
import { AssetPurpose, AssetStatus } from "@/generated/prisma";

import {
  AssetCategoryMismatchError,
  AssetNotActiveError,
  AssetNotFoundError,
} from "./errors";
import { AssetRepository } from "./repository";
import { getUploadPolicy } from "./policies/upload-policy";

type Db = PrismaClient | Prisma.TransactionClient;

export async function assertAssetReferenceAllowed({
  db,
  assetId,
  purpose,
}: {
  db?: Db;
  assetId: string;
  purpose: AssetPurpose;
}): Promise<void> {
  const repository = new AssetRepository(db);

  const asset = await repository.findById({ id: assetId });

  if (!asset) {
    throw new AssetNotFoundError();
  }

  if (asset.status !== AssetStatus.ACTIVE) {
    throw new AssetNotActiveError(
      `Asset ${assetId} is ${asset.status.toLowerCase()}, not active, and cannot be attached.`,
    );
  }

  const policy = getUploadPolicy(purpose);

  if (asset.category !== policy.category) {
    throw new AssetCategoryMismatchError(
      `${purpose} requires a ${policy.category} asset, but this asset is ${asset.category}.`,
    );
  }
}
