import type { CreateAssetInput } from "@/modules/assets/schemas/create-asset";
import type { CompetitionAssetSlot } from "./asset-slot";

export interface SetCompetitionAssetDTO {
  slot: CompetitionAssetSlot;

  upload: CreateAssetInput;
}