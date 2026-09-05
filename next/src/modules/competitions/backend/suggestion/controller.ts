import { NextRequest } from "next/server";

import { ApiResponse, Route } from "@/lib/http";
import { SessionService } from "@/lib/auth/session";


import { CompetitionSuggestionService } from "./service";
import { CompetitionSuggestionAssetService } from "./asset-service";
import { CreateCompetitionSuggestionSchema } from "../../schemas/create-competition-suggestion";
import { UpdateCompetitionSuggestionSchema } from "../../schemas/update-competition-suggestion";
import { AttachCompetitionSuggestionAssetSchema } from "../../schemas/attach-competition-suggestion-asset";

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


static async findMine(request: NextRequest) {
  return Route.execute(async () => {
    const actor = await SessionService.getStrictActor(request);

    const suggestions =
      await CompetitionSuggestionService.findMine({
        actor: {
          id: actor.id,
          role: actor.role,
          banned: actor.banned,
        },
      });

    return ApiResponse.ok(suggestions);
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
  // Assets
  // ===========================================================================

  static async attachAsset(
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

      const data = AttachCompetitionSuggestionAssetSchema.parse(
        await request.json(),
      );

      // -----------------------------------------------------------------------
      // Business Logic
      // -----------------------------------------------------------------------

      const suggestion = await CompetitionSuggestionAssetService.attach({
        actor: {
          id: actor.id,
          role: actor.role,
          banned: actor.banned,
        },
        suggestionId,
        assetId: data.assetId,
      });

      // -----------------------------------------------------------------------
      // Response
      // -----------------------------------------------------------------------

      return ApiResponse.created(suggestion);
    });
  }

  static async detachAsset(
    request: NextRequest,
    suggestionId: string,
    assetId: string,
  ) {
    return Route.execute(async () => {
      // -----------------------------------------------------------------------
      // Authentication
      // -----------------------------------------------------------------------

      const actor = await SessionService.getStrictActor(request);

      // -----------------------------------------------------------------------
      // Business Logic
      // -----------------------------------------------------------------------

      const suggestion = await CompetitionSuggestionAssetService.detach({
        actor: {
          id: actor.id,
          role: actor.role,
          banned: actor.banned,
        },
        suggestionId,
        assetId,
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