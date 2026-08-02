
import { CreateAssetSchema } from "@/modules/assets/schemas/create-asset";
import { CompetitionAssetSlot } from "../types/asset-slot";
import { CompetitionAssetService } from "./competition-asset.service";

export class SetCompetitionAssetController {
  static async handle(
    competitionId: string,
    slot: CompetitionAssetSlot,
    body: unknown,
  ) {
    const upload = CreateAssetSchema.parse(body);

    return CompetitionAssetService.setAsset(
      competitionId,
      {slot,
      upload}
    );
  }
}