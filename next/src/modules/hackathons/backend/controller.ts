/**
 * Hackathons Module - Controller
 *
 * Responsible for:
 * - Request parsing
 * - Authentication checks
 * - Calling services
 * - Returning responses
 *
 * Controllers should never contain business logic.
 */

import { NextRequest, NextResponse } from "next/server";
import { CreateHackathonSchema } from "../schemas/create-hackathon";
import { HackathonService } from "./service";
import { HackathonAuthorizer } from "./authorization/authorizer";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { UnauthorizedError } from "@/lib/errors";
import { AuthorizationCode } from "@/authorization";
import { ApiResponse, Route } from "@/lib/http";
import { SessionService } from "@/lib/auth/index";
import { UpdateHackathonSchema } from "../schemas/update-hackathon";
import { HackathonContextResolver } from "./authorization";
export class HackathonController {
  static async create(request: NextRequest) {
    const body = await request.json();

    console.dir(body, {
      depth: null,
    });

    const session = await auth.api.getSession({
      headers: await headers(), // you need to pass the headers object.
    });
    if (!session || !session.user) {
      throw new UnauthorizedError({
        code: AuthorizationCode.UNAUTHORIZED,
        message: "User is not authenticated.",
      });
    }

    const data = CreateHackathonSchema.parse(body);

    const context = {
      actor: {
        id: session.user.id,
        role: session.user.role,
        banned: session.user.banned,
      },
    };

    HackathonAuthorizer.create(context);

    const hackathon = await HackathonService.create(data, context);

    return NextResponse.json(hackathon, {
      status: 201,
    });
  }

  static async update(request: NextRequest, hackathonId: string) {
    return Route.execute(async () => {
      // -----------------------------------------------------------------
      // Authentication
      // -----------------------------------------------------------------

      const actor = await SessionService.getActor(request);

      // -----------------------------------------------------------------
      // Validation
      // -----------------------------------------------------------------

      const body = await request.json();

      const data = UpdateHackathonSchema.parse(body);

      // -----------------------------------------------------------------
      // Context
      // -----------------------------------------------------------------

      const context = await HackathonContextResolver.resolve({
        actor,
        hackathonId,
      });

      // -----------------------------------------------------------------
      // Authorization
      // -----------------------------------------------------------------

      HackathonAuthorizer.edit(context);

      // -----------------------------------------------------------------
      // Business Logic
      // -----------------------------------------------------------------

      const hackathon = await HackathonService.update({
        context,
        data,
      });

      // -----------------------------------------------------------------
      // Response
      // -----------------------------------------------------------------

      return ApiResponse.ok(hackathon);
    });
  }
}
