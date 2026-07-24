import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

import type { PlatformContext } from "./context";

import type { NextRequest } from "next/server";

export class PlatformContextResolver {
    static async resolve(
        request: NextRequest,
    ): Promise<PlatformContext> {

        console.log("");
        console.log("========================================");
        console.log("🧩 PLATFORM CONTEXT RESOLVER");
        console.log("========================================");

        console.log("Loading session...");

        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session) {
            throw new Error("Unauthenticated.");
        }

        console.log("Loading actor...");

        const actor = await prisma.user.findUnique({
            where: {
                id: session.user.id,
            },
            select: {
                id: true,
                role: true,
                banned: true,
            },
        });

        if (!actor) {
            throw new Error("User not found.");
        }

        console.log("Context resolved.");

        console.dir(actor, {
            depth: null,
        });

        return {
            actor,
        };
    }
}