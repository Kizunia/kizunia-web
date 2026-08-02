import { CompetitionController } from "@/modules/competitions/backend/controller";
import { CompetitionAssetSlot } from "@/modules/competitions/types/asset-slot";
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
    slot as CompetitionAssetSlot, //TODO: validate slot value before casting
  );
}