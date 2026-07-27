import prisma from "@/lib/prisma";

import { AssetService } from "@/modules/assets/services/asset.service";
import type { CreateAssetInput } from "@/modules/assets/schemas/create-asset";

import type { HackathonAssetSlot } from "../types/asset-slot";
import { competitionMapper } from "./mapper";
import { CompetitionRepository } from "./repository";
import { SetHackathonAssetDTO } from "../types/set-asset.dto";

export class HackathonAssetService {
  static async setAsset(hackathonId: string, dto: SetHackathonAssetDTO) {
    const { slot, upload } = dto;
    return prisma.$transaction(async (tx) => {
      // Create Asset
      const asset = await AssetService.create(tx, upload);

      // Attach Asset
      await CompetitionRepository.setAsset(tx, hackathonId, slot, asset.id);

      // Load updated hackathon
      const competition = await CompetitionRepository.findByIdForEdit(
        hackathonId,
        tx,
      );

      return competitionMapper.toEditDTO(competition);
    });
  }
}
