import { CompetitionController } from "@/modules/hackathons/backend/controller";
import { HackathonAssetSlot } from "@/modules/hackathons/types/asset-slot";
import { NextRequest } from "next/server";

export async function PATCH(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
      slot: string;
    }>;
  },
) {
  const { id, slot } = await params;

  return CompetitionController.setAsset(
    request,
    id,
    slot as HackathonAssetSlot, //TODO: validate slot value before casting
  );
}