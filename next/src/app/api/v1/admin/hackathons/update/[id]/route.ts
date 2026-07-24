import { CompetitionController } from "@/modules/hackathons/backend/controller";
import { NextRequest } from "next/server";

export async function PATCH(
    request: NextRequest,
    {
        params,
    }: {
        params: Promise<{
            id: string;
        }>;
    },
) {
    const { id } = await params;

    return CompetitionController.update(
        request,
        id,
    );
}