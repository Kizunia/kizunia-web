import type { CreateAssetInput } from "@/modules/assets/schemas/create-asset";
import type { HackathonAssetSlot } from "../types/asset-slot";

export interface SetHackathonAssetDTO {
  slot: HackathonAssetSlot;

  upload: CreateAssetInput;
}