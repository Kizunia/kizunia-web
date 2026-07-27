import { AssetProvider, type Prisma } from "@/generated/prisma";
import type { CreateAssetInput } from "../schemas/create-asset";

export class AssetRepository {
  static async create(
    tx: Prisma.TransactionClient,
    data: CreateAssetInput,
  ) {
    return tx.asset.create({
      data: {
        provider: AssetProvider.CLOUDINARY,

        publicId: data.publicId,

        secureUrl: data.secureUrl,

        format: data.format,

        mimeType: data.mimeType,

        width: data.width,

        height: data.height,

        bytes: data.bytes,

        checksum: data.checksum,

        originalFilename: data.originalFilename,
      },
    });
  }
}