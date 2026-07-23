import { auth } from "@/lib/auth";

import type { AuthorizationActor } from "@/authorization";
import type { NextRequest } from "next/server";

export class SessionService {
    static async getActor(
        request: NextRequest,
    ): Promise<AuthorizationActor> {
        console.log("Loading session...");

        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session || !session.user) {
            throw new Error("Unauthenticated.");
        }

        console.log("Session loaded.");

        // console.dir(session.user, {
        //     depth: null,
        // });

        return {
            id: session.user.id,
            role: session.user.role,
            banned: session.user.banned,
        };
    }
}