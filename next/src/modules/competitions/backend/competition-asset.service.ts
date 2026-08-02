import prisma from "@/lib/prisma";

import { AssetService } from "@/modules/assets/services/asset.service";
import type { CreateAssetInput } from "@/modules/assets/schemas/create-asset";

import type { CompetitionAssetSlot } from "../types/asset-slot";
import { competitionMapper } from "./mapper";
import { CompetitionRepository } from "./repository";
import { SetCompetitionAssetDTO } from "../types/set-asset.dto";
import { CompetitionContextResolver } from "./authorization";

export class CompetitionAssetService {
  static async setAsset(competitionId: string, dto: SetCompetitionAssetDTO) {
    const { slot, upload } = dto;
    return prisma.$transaction(async (tx) => {
      // Create Asset
      const asset = await AssetService.create(tx, upload);

      // Attach Asset
      await CompetitionRepository.setAsset(tx, competitionId, slot, asset.id);

      // Load updated competition
      const competition = await CompetitionRepository.findByIdForEdit(
        competitionId,
        tx,
      );



      return competitionMapper.toEditDTO({competition: competition});
    });
  }
}
