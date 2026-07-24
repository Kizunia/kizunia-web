import { auth } from "@/lib/auth";

import { AuthorizationCode, type AuthorizationActor } from "@/authorization";
import type { NextRequest } from "next/server";
import { AuthenticationError } from "../errors";

export class SessionService {
    static async getActor(
        request: NextRequest,
    ): Promise<AuthorizationActor> {
        console.log("Loading session...");

        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session || !session.user) {
            throw new AuthenticationError({status: 401, message: "User is not authenticated.", code: "UNAUTHORIZED"});
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