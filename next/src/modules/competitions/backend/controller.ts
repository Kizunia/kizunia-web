/**
 * Competitions Module - Controller
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
import { CreateCompetitionSchema } from "../schemas/create-competition";
import { CompetitionService } from "./service";
import { CompetitionAuthorizer } from "./authorization/authorizer";
import { ApiResponse, Route } from "@/lib/http";
import { SessionService } from "@/lib/auth/index";
import { UpdateCompetitionSchema } from "../schemas/update-competition";
import {
  CompetitionAction,
  CompetitionContextResolver,
  CompetitionPolicy,
} from "./authorization";
import { SlugSchema } from "@/lib/validation/index";
import { CreateAssetSchema } from "@/modules/assets/schemas/create-asset";
import { CompetitionAssetSlot } from "../types/asset-slot";
import { AppError, ForbiddenError, UnauthorizedError } from "@/lib/errors";
import { CompetitionErrorCode } from "../errors/error-code";
import {
  BulkCompetitionActionSchema,
  type BulkCompetitionAction,
} from "../schemas/bulk-competition-action";
import type { StrictAuthorizationActor } from "@/authorization";
import {
  CreateCompetitionLocationSchema,
  ReorderCompetitionLocationsSchema,
  UpdateCompetitionLocationSchema,
} from "../schemas/competition-location";
import { CompetitionLocationService } from "./competition-location.service";
export class CompetitionController {
  static async create(request: NextRequest) {
    return Route.execute(async () => {
      const body = await request.json();

      const actor = await SessionService.getActor(request);

      const data = CreateCompetitionSchema.parse(body);

      const context = {
        actor,
      };

      CompetitionAuthorizer.create(context);

      const competition = await CompetitionService.create({ data, context });

      return ApiResponse.created(competition);
    });
  }

  static async search(request: NextRequest) {
    return Route.execute(async () => {
      const query = Object.fromEntries(request.nextUrl.searchParams.entries());

      const competitions = await CompetitionService.search(query);

      return ApiResponse.ok(competitions);
    });
  }

  static async searchManageable(request: NextRequest) {
    return Route.execute(async () => {
      // -----------------------------------------------------------------
      // Authentication
      // -----------------------------------------------------------------

      const actor = await SessionService.getActor(request);
      if (!actor || !actor.id || !actor.role || actor.banned == undefined) {
        throw new UnauthorizedError({
          code: "unauthorized",
          message: "Failed to authenticate the actor or actor is banned.",
        });
      }
      // -----------------------------------------------------------------
      // Validation
      // -----------------------------------------------------------------

      const query = Object.fromEntries(request.nextUrl.searchParams.entries());

      // -----------------------------------------------------------------
      // Business Logic
      // -----------------------------------------------------------------
      const competitions = await CompetitionService.searchManageable(
        { id: actor.id, role: actor.role, banned: actor.banned },
        query,
      );

      // -----------------------------------------------------------------
      // Response
      // -----------------------------------------------------------------

      return ApiResponse.ok(competitions);
    });
  }

  static async searchAdminManageable(request: NextRequest) {
    return Route.execute(async () => {
      // -----------------------------------------------------------------
      // Authentication
      // -----------------------------------------------------------------

      const actor = await SessionService.getActor(request);
      if (!actor || !actor.id || !actor.role || actor.banned == undefined) {
        throw new UnauthorizedError({
          code: "unauthorized",
          message: "Failed to authenticate the actor or actor is banned.",
        });
      }
      // -----------------------------------------------------------------
      // Validation
      // -----------------------------------------------------------------

      const query = Object.fromEntries(request.nextUrl.searchParams.entries());

      // -----------------------------------------------------------------
      // Business Logic
      // -----------------------------------------------------------------
      const competitions = await CompetitionService.searchAdmin(
        { id: actor.id, role: actor.role, banned: actor.banned },
        query,
      );

      // -----------------------------------------------------------------
      // Response
      // -----------------------------------------------------------------

      return ApiResponse.ok(competitions);
    });
  }

  static async findBySlug(request: NextRequest, slug: string) {
    return Route.execute(async () => {
      const parsedSlug = SlugSchema.parse(slug);
      const actor = await SessionService.getOptionalActor(request);

      const context = await CompetitionContextResolver.resolveBySlug({
        actor: {
          id: actor?.id ?? null,
          role: actor?.role ?? null,
          banned: actor?.banned ?? null,
        },
        slug: parsedSlug,
      });
      CompetitionAuthorizer.read(context);

      const competition = await CompetitionService.findBySlug(parsedSlug);

      return ApiResponse.ok(competition);
    });
  }

  static async findForEdit(request: NextRequest, competitionId: string) {
    return Route.execute(async () => {
      const actor = await SessionService.getActor(request);

      const context = await CompetitionContextResolver.resolve({
        actor,
        competitionId,
      });

      CompetitionAuthorizer.edit(context);

      const competition = await CompetitionService.adminFindForEdit(context);

      return ApiResponse.ok(competition);
    });
  }

  static async update(request: NextRequest, competitionId: string) {
    return Route.execute(async () => {
      // -----------------------------------------------------------------
      // Authentication
      // -----------------------------------------------------------------

      const actor = await SessionService.getActor(request);

      // -----------------------------------------------------------------
      // Validation
      // -----------------------------------------------------------------

      const body = await request.json();

      const data = UpdateCompetitionSchema.parse(body);

      // -----------------------------------------------------------------
      // Context
      // -----------------------------------------------------------------

      const context = await CompetitionContextResolver.resolve({
        actor,
        competitionId,
      });

      // -----------------------------------------------------------------
      // Authorization
      // -----------------------------------------------------------------

      CompetitionAuthorizer.edit(context);

      // -----------------------------------------------------------------
      // Business Logic
      // -----------------------------------------------------------------

      const competition = await CompetitionService.update({
        context,
        data,
      });

      // -----------------------------------------------------------------
      // Response
      // -----------------------------------------------------------------

      return ApiResponse.ok(competition);
    });
  }

  static async delete(request: NextRequest, competitionId: string) {
    return Route.execute(async () => {
      // -------------------------------------------------
      // Authentication
      // -------------------------------------------------

      const actor = await SessionService.getActor(request);

      // -------------------------------------------------
      // Context
      // -------------------------------------------------
      console.log("CompetitionController.delete: competitionId", competitionId);
      const context = await CompetitionContextResolver.resolve({
        actor,
        competitionId,
      });

      // -------------------------------------------------
      // Authorization
      // -------------------------------------------------

      CompetitionAuthorizer.delete(context);

      // -------------------------------------------------
      // Business Logic
      // -------------------------------------------------

      await CompetitionService.delete({
        context,
      });

      // -------------------------------------------------
      // Response
      // -------------------------------------------------

      return ApiResponse.ok({});
    });
  }

  static async restore(request: NextRequest, competitionId: string) {
    return Route.execute(async () => {
      // -------------------------------------------------
      // Authentication
      // -------------------------------------------------

      const actor = await SessionService.getActor(request);

      // -------------------------------------------------
      // Context
      // -------------------------------------------------
      //
      // The deleted-inclusive resolver, not the ordinary one: restore is
      // only ever meaningful on a competition the ordinary resolver treats
      // as not found, by design. See `CompetitionContextResolver.resolveIncludingDeleted`.

      const context = await CompetitionContextResolver.resolveIncludingDeleted({
        actor,
        competitionId,
      });

      // -------------------------------------------------
      // Authorization
      // -------------------------------------------------
      //
      // Admin-only by construction — see `CompetitionAction.RESTORE`. The
      // server re-checks this regardless of what the caller believes it is
      // permitted to do; a client-supplied permission value is never trusted.

      CompetitionAuthorizer.restore(context);

      // -------------------------------------------------
      // Business Logic
      // -------------------------------------------------

      await CompetitionService.restore(context);

      // -------------------------------------------------
      // Response
      // -------------------------------------------------

      return ApiResponse.ok({});
    });
  }

  /**
   * The Competition action each bulk action type requires.
   *
   * SET_STATUS and SET_VISIBILITY are ordinary edits — the same permission
   * the general-tab editor already requires for either field. DELETE and
   * RESTORE map onto their own actions, RESTORE's admin-only nature coming
   * entirely from the policy chain, not from anything here.
   */
  private static readonly BULK_ACTION_REQUIRES: Record<
    BulkCompetitionAction["type"],
    CompetitionAction
  > = {
    SET_STATUS: CompetitionAction.EDIT,
    SET_VISIBILITY: CompetitionAction.EDIT,
    DELETE: CompetitionAction.DELETE,
    RESTORE: CompetitionAction.RESTORE,
  };

  static async bulkUpdate(request: NextRequest) {
    return Route.execute(async () => {
      // -------------------------------------------------
      // Authentication
      // -------------------------------------------------

      const actor = await SessionService.getActor(request);

      if (!actor || !actor.id || !actor.role || actor.banned == undefined) {
        throw new UnauthorizedError({
          code: "unauthorized",
          message: "Failed to authenticate the actor or actor is banned.",
        });
      }

      const strictActor: StrictAuthorizationActor = {
        id: actor.id,
        role: actor.role,
        banned: actor.banned,
      };

      // -------------------------------------------------
      // Validation
      // -------------------------------------------------

      const body = await request.json();

      const { ids, action } = BulkCompetitionActionSchema.parse(body);

      // -------------------------------------------------
      // Context
      // -------------------------------------------------
      //
      // Loads every requested row and the actor's membership in it — from
      // the database, never from anything the client asserted about itself.
      // Throws if any requested id does not exist, before anything else runs.

      const contexts = await CompetitionService.loadBulkActionContexts(
        strictActor,
        ids,
      );

      // -------------------------------------------------
      // Authorization
      // -------------------------------------------------
      //
      // Every row is authorized independently, from the context just loaded
      // — never from a permission value the client might have sent. If even
      // one id is denied, the whole request is rejected and nothing is
      // written: the authorized set must equal the requested set exactly,
      // or the mutation does not happen at all. This is what makes it
      // impossible to smuggle one unauthorized id in alongside authorized
      // ones and have it silently skipped rather than caught.

      const requiredAction = this.BULK_ACTION_REQUIRES[action.type];

      const unauthorized = contexts
        .filter(
          (context) => !CompetitionPolicy.can(context, requiredAction).allowed,
        )
        .map((context) => context.competition.id);

      if (unauthorized.length > 0) {
        throw new ForbiddenError({
          code: CompetitionErrorCode.BULK_UNAUTHORIZED,
          message:
            "You are not authorized to perform this action on all requested competitions.",
          details: { unauthorized },
        });
      }

      // -------------------------------------------------
      // Business Logic
      // -------------------------------------------------

      const result = await CompetitionService.bulkApply(ids, action);

      // -------------------------------------------------
      // Response
      // -------------------------------------------------

      return ApiResponse.ok(result);
    });
  }

  static async setAsset(
    request: NextRequest,
    competitionId: string,
    slot: CompetitionAssetSlot,
  ) {
    return Route.execute(async () => {
      // -----------------------------------------------------------------
      // Authentication
      // -----------------------------------------------------------------

      const actor = await SessionService.getActor(request);

      // -----------------------------------------------------------------
      // Validation
      // -----------------------------------------------------------------

      const body = await request.json();

      const upload = CreateAssetSchema.parse(body);

      // -----------------------------------------------------------------
      // Context
      // -----------------------------------------------------------------

      const context = await CompetitionContextResolver.resolve({
        actor,
        competitionId,
      });

      // -----------------------------------------------------------------
      // Authorization
      // -----------------------------------------------------------------

      CompetitionAuthorizer.edit(context);

      // -----------------------------------------------------------------
      // Business Logic
      // -----------------------------------------------------------------

      const competition = await CompetitionService.setAsset({
        context,
        slot,
        upload,
      });

      // -----------------------------------------------------------------
      // Response
      // -----------------------------------------------------------------

      return ApiResponse.ok(competition);
    });
  }

  // ==========================================================================
  // Locations
  // ==========================================================================

  static async listLocations(request: NextRequest, competitionId: string) {
    return Route.execute(async () => {
      // -----------------------------------------------------------------
      // Authentication
      // -----------------------------------------------------------------

      const actor = await SessionService.getActor(request);

      // -----------------------------------------------------------------
      // Context
      // -----------------------------------------------------------------

      const context = await CompetitionContextResolver.resolve({
        actor,
        competitionId,
      });

      // -----------------------------------------------------------------
      // Authorization
      // -----------------------------------------------------------------

      CompetitionAuthorizer.edit(context);

      // -----------------------------------------------------------------
      // Business Logic
      // -----------------------------------------------------------------

      const locations = await CompetitionLocationService.list(
        context.competition.id,
      );

      // -----------------------------------------------------------------
      // Response
      // -----------------------------------------------------------------

      return ApiResponse.ok(locations);
    });
  }

  static async addLocation(request: NextRequest, competitionId: string) {
    return Route.execute(async () => {
      // -----------------------------------------------------------------
      // Authentication
      // -----------------------------------------------------------------

      const actor = await SessionService.getActor(request);

      // -----------------------------------------------------------------
      // Validation
      // -----------------------------------------------------------------

      const body = await request.json();

      const data = CreateCompetitionLocationSchema.parse(body);

      // -----------------------------------------------------------------
      // Context
      // -----------------------------------------------------------------

      const context = await CompetitionContextResolver.resolve({
        actor,
        competitionId,
      });

      // -----------------------------------------------------------------
      // Authorization
      // -----------------------------------------------------------------

      CompetitionAuthorizer.edit(context);

      // -----------------------------------------------------------------
      // Business Logic
      // -----------------------------------------------------------------

      const locations = await CompetitionLocationService.add(
        context.competition.id,
        data,
      );

      // -----------------------------------------------------------------
      // Response
      // -----------------------------------------------------------------

      return ApiResponse.created(locations);
    });
  }

  static async updateLocation(
    request: NextRequest,
    competitionId: string,
    competitionLocationId: string,
  ) {
    return Route.execute(async () => {
      // -----------------------------------------------------------------
      // Authentication
      // -----------------------------------------------------------------

      const actor = await SessionService.getActor(request);

      // -----------------------------------------------------------------
      // Validation
      // -----------------------------------------------------------------

      const body = await request.json();

      const data = UpdateCompetitionLocationSchema.parse(body);

      // -----------------------------------------------------------------
      // Context
      // -----------------------------------------------------------------

      const context = await CompetitionContextResolver.resolve({
        actor,
        competitionId,
      });

      // -----------------------------------------------------------------
      // Authorization
      // -----------------------------------------------------------------

      CompetitionAuthorizer.edit(context);

      // -----------------------------------------------------------------
      // Business Logic
      // -----------------------------------------------------------------

      const locations = await CompetitionLocationService.update(
        context.competition.id,
        competitionLocationId,
        data,
      );

      // -----------------------------------------------------------------
      // Response
      // -----------------------------------------------------------------

      return ApiResponse.ok(locations);
    });
  }

  static async removeLocation(
    request: NextRequest,
    competitionId: string,
    competitionLocationId: string,
  ) {
    return Route.execute(async () => {
      // -----------------------------------------------------------------
      // Authentication
      // -----------------------------------------------------------------

      const actor = await SessionService.getActor(request);

      // -----------------------------------------------------------------
      // Context
      // -----------------------------------------------------------------

      const context = await CompetitionContextResolver.resolve({
        actor,
        competitionId,
      });

      // -----------------------------------------------------------------
      // Authorization
      // -----------------------------------------------------------------

      CompetitionAuthorizer.edit(context);

      // -----------------------------------------------------------------
      // Business Logic
      // -----------------------------------------------------------------

      const locations = await CompetitionLocationService.remove(
        context.competition.id,
        competitionLocationId,
      );

      // -----------------------------------------------------------------
      // Response
      // -----------------------------------------------------------------

      return ApiResponse.ok(locations);
    });
  }

  static async reorderLocations(request: NextRequest, competitionId: string) {
    return Route.execute(async () => {
      // -----------------------------------------------------------------
      // Authentication
      // -----------------------------------------------------------------

      const actor = await SessionService.getActor(request);

      // -----------------------------------------------------------------
      // Validation
      // -----------------------------------------------------------------

      const body = await request.json();

      const data = ReorderCompetitionLocationsSchema.parse(body);

      // -----------------------------------------------------------------
      // Context
      // -----------------------------------------------------------------

      const context = await CompetitionContextResolver.resolve({
        actor,
        competitionId,
      });

      // -----------------------------------------------------------------
      // Authorization
      // -----------------------------------------------------------------

      CompetitionAuthorizer.edit(context);

      // -----------------------------------------------------------------
      // Business Logic
      // -----------------------------------------------------------------

      const locations = await CompetitionLocationService.reorder(
        context.competition.id,
        data,
      );

      // -----------------------------------------------------------------
      // Response
      // -----------------------------------------------------------------

      return ApiResponse.ok(locations);
    });
  }
}
