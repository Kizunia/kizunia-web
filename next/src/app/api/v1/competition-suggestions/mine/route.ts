import { NextRequest } from "next/server";

import { CompetitionSuggestionController } from "@/modules/competitions/backend/suggestions/controller";

export async function GET(request: NextRequest) {
  return CompetitionSuggestionController.findMine(request);
}