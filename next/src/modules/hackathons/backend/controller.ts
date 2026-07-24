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

import { NextRequest } from "next/server";
import { CreateHackathonSchema } from "../schemas/create-hackathon";
import { CompetitionService } from "./service";
import { CompetitionAuthorizer } from "./authorization/authorizer";
import { ApiResponse, Route } from "@/lib/http";
import { SessionService } from "@/lib/auth/index";
import { UpdateHackathonSchema } from "../schemas/update-hackathon";
import { CompetitionContextResolver } from "./authorization";
export class CompetitionController {
  static async create(request: NextRequest) {
    return Route.execute(async () => {
      const body = await request.json();

      console.dir(body, {
        depth: null,
      });
      const actor = await SessionService.getActor(request);

      const data = CreateHackathonSchema.parse(body);

      const context = {
        actor,
      };

      

      CompetitionAuthorizer.create(context);

      const competition = await CompetitionService.create({ data, context });

     return ApiResponse.created(competition);
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

      const context = await CompetitionContextResolver.resolve({
        actor,
        hackathonId,
      });

      // -----------------------------------------------------------------
      // Authorization
      // -----------------------------------------------------------------

      CompetitionAuthorizer.edit(context);

      // -----------------------------------------------------------------
      // Business Logic
      // -----------------------------------------------------------------

      const hackathon = await CompetitionService.update({
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
