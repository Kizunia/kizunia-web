import { NextRequest } from "next/server";

import { HackathonController } from "@/modules/hackathons/backend/controller";

export async function POST(
    request: NextRequest,
) {
    return HackathonController.create(request);
}