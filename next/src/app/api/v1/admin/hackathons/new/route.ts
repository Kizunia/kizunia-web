import { NextRequest } from "next/server";

import { CompetitionController } from "@/modules/hackathons/backend/controller";

export async function POST(
    request: NextRequest,
) {
    return CompetitionController.create(request);
}