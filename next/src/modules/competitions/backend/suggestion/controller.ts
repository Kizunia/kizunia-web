import { NextRequest } from "next/server";

import { ApiResponse, Route } from "@/lib/http";
import { SessionService } from "@/lib/auth/session";


import { CompetitionSuggestionService } from "./service";
import { CreateCompetitionSuggestionSchema } from "../../schemas/create-competition-suggestion";
import { UpdateCompetitionSuggestionSchema } from "../../schemas/update-competition-suggestion";

export class CompetitionSuggestionController {
  // ===========================================================================
  // Create
  // ===========================================================================

  static async create(request: NextRequest) {
    return Route.execute(async () => {
      // -----------------------------------------------------------------------
      // Authentication
      // -----------------------------------------------------------------------

      const actor = await SessionService.getStrictActor(request);

      // -----------------------------------------------------------------------
      // Validation
      // -----------------------------------------------------------------------

      const data = CreateCompetitionSuggestionSchema.parse(
        await request.json(),
      );

      // -----------------------------------------------------------------------
      // Business Logic
      // -----------------------------------------------------------------------

      const suggestion = await CompetitionSuggestionService.create({
        actor: {
          id: actor.id,
          role: actor.role,
          banned: actor.banned,
        },
        dto: data,
      });

      // -----------------------------------------------------------------------
      // Response
      // -----------------------------------------------------------------------

      return ApiResponse.created(suggestion);
    });
  }

  // ===========================================================================
  // Read
  // ===========================================================================

  static async findById(
    request: NextRequest,
    suggestionId: string,
  ) {
    return Route.execute(async () => {
      // -----------------------------------------------------------------------
      // Authentication
      // -----------------------------------------------------------------------

      const actor = await SessionService.getStrictActor(request);

      // -----------------------------------------------------------------------
      // Business Logic
      // -----------------------------------------------------------------------

      const suggestion = await CompetitionSuggestionService.findById({
        actor: {
          id: actor.id,
          role: actor.role,
          banned: actor.banned,
        },
        id: suggestionId,
      });

      // -----------------------------------------------------------------------
      // Response
      // -----------------------------------------------------------------------

      return ApiResponse.ok(suggestion);
    });
  }

  // ===========================================================================
  // Update
  // ===========================================================================

  static async update(
    request: NextRequest,
    suggestionId: string,
  ) {
    return Route.execute(async () => {
      // -----------------------------------------------------------------------
      // Authentication
      // -----------------------------------------------------------------------

      const actor = await SessionService.getStrictActor(request);

      // -----------------------------------------------------------------------
      // Validation
      // -----------------------------------------------------------------------

      const data = UpdateCompetitionSuggestionSchema.parse(
        await request.json(),
      );

      // -----------------------------------------------------------------------
      // Business Logic
      // -----------------------------------------------------------------------

      const suggestion = await CompetitionSuggestionService.update({
        actor: {
          id: actor.id,
          role: actor.role,
          banned: actor.banned,
        },
        id: suggestionId,
        dto: data,
      });

      // -----------------------------------------------------------------------
      // Response
      // -----------------------------------------------------------------------

      return ApiResponse.ok(suggestion);
    });
  }

  // ===========================================================================
  // Submit
  // ===========================================================================

  static async submit(
    request: NextRequest,
    suggestionId: string,
  ) {
    return Route.execute(async () => {
      // -----------------------------------------------------------------------
      // Authentication
      // -----------------------------------------------------------------------

      const actor = await SessionService.getStrictActor(request);

      // -----------------------------------------------------------------------
      // Business Logic
      // -----------------------------------------------------------------------

      const suggestion = await CompetitionSuggestionService.submit({
        actor: {
          id: actor.id,
          role: actor.role,
          banned: actor.banned,
        },
        id: suggestionId,
      });

      // -----------------------------------------------------------------------
      // Response
      // -----------------------------------------------------------------------

      return ApiResponse.ok(suggestion);
    });
  }

  // ===========================================================================
  // Delete
  // ===========================================================================

  static async delete(
    request: NextRequest,
    suggestionId: string,
  ) {
    return Route.execute(async () => {
      // -----------------------------------------------------------------------
      // Authentication
      // -----------------------------------------------------------------------

      const actor = await SessionService.getStrictActor(request);

      // -----------------------------------------------------------------------
      // Business Logic
      // -----------------------------------------------------------------------

      await CompetitionSuggestionService.delete({
        actor: {
          id: actor.id,
          role: actor.role,
          banned: actor.banned,
        },
        id: suggestionId,
      });

      // -----------------------------------------------------------------------
      // Response
      // -----------------------------------------------------------------------

      return ApiResponse.ok({});
    });
  }
}