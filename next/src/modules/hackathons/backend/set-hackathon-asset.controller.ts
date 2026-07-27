
import { CreateAssetSchema } from "@/modules/assets/schemas/create-asset";
import { HackathonAssetSlot } from "../types/asset-slot";
import { HackathonAssetService } from "./hackathon-asset.service";

export class SetHackathonAssetController {
  static async handle(
    hackathonId: string,
    slot: HackathonAssetSlot,
    body: unknown,
  ) {
    const upload = CreateAssetSchema.parse(body);

    return HackathonAssetService.setAsset(
      hackathonId,
      {slot,
      upload}
    );
  }
}