import type { Prisma } from "@/generated/prisma";

import { AssetRepository } from "../repository/asset.repository";
import { assetMapper } from "../mapper/asset.mapper";

import type { CreateAssetInput } from "../schemas/create-asset";

export class AssetService {
  static async create(
    tx: Prisma.TransactionClient,
    data: CreateAssetInput,
  ) {
    const asset = await AssetRepository.create(tx, data);

    return assetMapper.toDTO(asset);
  }
}