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

import type { Asset, Prisma, PrismaClient } from "@/generated/prisma";
import { AssetPurpose, AssetStatus } from "@/generated/prisma";

import {
  AssetCategoryMismatchError,
  AssetNotActiveError,
  AssetNotFoundError,
} from "./errors";
import { AssetRepository } from "./repository";
import { getUploadPolicy, resolveAllowedCategories } from "./policies/upload-policy";

type Db = PrismaClient | Prisma.TransactionClient;

export async function assertAssetReferenceAllowed({
  db,
  assetId,
  purpose,
}: {
  db?: Db;
  assetId: string;
  purpose: AssetPurpose;
}): Promise<Asset> {
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

  // A purpose with `mimeTypeOverrides` (see upload-policy.ts) accepts more
  // than one category, so this checks membership in the full set of
  // categories the policy allows, rather than deriving a single "expected"
  // category from the asset's own `mimeType` — that field is nullable and
  // not guaranteed to be populated for every provider/category, so it isn't
  // reliable to re-derive from at validation time. `asset.category` was
  // already resolved correctly, from the actor's declared and policy-checked
  // mime type, at upload-intent creation — it's the authoritative field.
  const allowedCategories = resolveAllowedCategories(policy);

  if (!allowedCategories.includes(asset.category)) {
    throw new AssetCategoryMismatchError(
      `${purpose} does not accept ${asset.category} assets.`,
    );
  }

  return asset;
}
