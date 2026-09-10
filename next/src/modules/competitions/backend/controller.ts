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
import { ApiResponse } from "@/lib/http";
import { Route } from "@/lib/http/route";
import { SessionService } from "@/lib/auth/index";
import { UpdateCompetitionSchema } from "../schemas/update-competition";
import {
  CompetitionAction,
  CompetitionContextResolver,
  CompetitionPolicy,
} from "./authorization";
import { SlugSchema } from "@/lib/validation/index";
import { SetAssetSchema } from "@/modules/assets/schemas/set-asset";
import { isCompetitionAssetSlot } from "../types/asset-slot";
import { AppError, ForbiddenError, UnauthorizedError, ValidationError } from "@/lib/errors";
import { CompetitionErrorCode } from "../errors/error-code";
import {
  BulkCompetitionActionSchema,
  type BulkCompetitionAction,
} from "../schemas/bulk-competition-action";
import type { StrictAuthorizationActor } from "@/authorization";
import { PlatformAction } from "@/authorization/platform/actions";
import { PlatformAuthorizer } from "@/authorization/platform/authorizer";
import {
  CreateCompetitionLocationSchema,
  ReorderCompetitionLocationsSchema,
  UpdateCompetitionLocationSchema,
} from "../schemas/competition-location";
import { CompetitionLocationService } from "./competition-location.service";
import { RateLimitPolicyId } from "@/lib/rate-limit/policies";
import { rateLimitService } from "@/lib/rate-limit/service";
import { CompetitionLifecycleService } from "./lifecycle.service";
import { ApplyLifecycleSchema } from "../schemas/lifecycle";
import { AttachCompetitionTechnologySchema } from "../schemas/competition-technology";
import { CompetitionTechnologyService } from "./competition-technology.service";
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
      // Public and unauthenticated. A placeId filter can reach the billed
      // places:resolve budget on a cache miss (see PlaceMatchService); that
      // budget already caps spend platform-wide, but is shared across every
      // caller, so this per-IP limit exists for availability — one abuser
      // minting novel placeIds should not be able to exhaust it and degrade
      // search for everyone else.
      await rateLimitService.enforce({
        policyId: RateLimitPolicyId.COMPETITIONS_SEARCH,
        request,
      });

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

      const strictActor: StrictAuthorizationActor = {
        id: actor.id,
        role: actor.role,
        banned: actor.banned,
      };

      // -----------------------------------------------------------------
      // Authorization
      // -----------------------------------------------------------------
      //
      // This is an admin-scoped endpoint — being authenticated and
      // not-banned is not sufficient. The actor must hold the platform
      // capability for viewing every competition, checked the same way the
      // admin page checks it, because this API is independently reachable
      // and must not rely on the page's server-side guard.

      PlatformAuthorizer.can(
        { actor: strictActor },
        PlatformAction.VIEW_ALL_COMPETITIONS,
      );

      // -----------------------------------------------------------------
      // Validation
      // -----------------------------------------------------------------

      const query = Object.fromEntries(request.nextUrl.searchParams.entries());

      // -----------------------------------------------------------------
      // Business Logic
      // -----------------------------------------------------------------
      const competitions = await CompetitionService.searchAdmin(
        strictActor,
        query,
      );

      // -----------------------------------------------------------------
      // Response
      // -----------------------------------------------------------------

      return ApiResponse.ok(competitions);
    });
  }

  /**
   * The admin lifecycle preview: every competition whose automatically
   * derived status differs from what is currently persisted, given the
   * request's filters. Read-only — nothing is mutated here.
   */
  static async previewLifecycle(request: NextRequest) {
    return Route.execute(async () => {
      // -----------------------------------------------------------------
      // Authentication
      // -----------------------------------------------------------------

      const actor = await SessionService.getActor(request);
      if (!actor || !actor.id || !actor.role || actor.banned == undefined) {
        throw new UnauthorizedError({
          code: "UNAUTHORIZED",
          message: "Failed to authenticate the actor or actor is banned.",
        });
      }

      const strictActor: StrictAuthorizationActor = {
        id: actor.id,
        role: actor.role,
        banned: actor.banned,
      };

      // -----------------------------------------------------------------
      // Authorization
      // -----------------------------------------------------------------
      //
      // Independent of any page-level guard — this API is reachable on its
      // own, exactly like `searchAdminManageable` above.

      PlatformAuthorizer.can(
        { actor: strictActor },
        PlatformAction.MANAGE_COMPETITION_LIFECYCLE,
      );

      // -----------------------------------------------------------------
      // Validation
      // -----------------------------------------------------------------

      const query = Object.fromEntries(request.nextUrl.searchParams.entries());

      // -----------------------------------------------------------------
      // Business Logic
      // -----------------------------------------------------------------

      const preview = await CompetitionLifecycleService.preview(query);

      // -----------------------------------------------------------------
      // Response
      // -----------------------------------------------------------------

      return ApiResponse.ok(preview);
    });
  }

  /**
   * Applies automatic lifecycle reconciliation to the given competition
   * ids. The request carries ids only — the server re-reads and
   * re-evaluates each one against authoritative state; see
   * `CompetitionLifecycleService.apply`.
   */
  static async applyLifecycle(request: NextRequest) {
    return Route.execute(async () => {
      // -----------------------------------------------------------------
      // Authentication
      // -----------------------------------------------------------------

      const actor = await SessionService.getActor(request);
      if (!actor || !actor.id || !actor.role || actor.banned == undefined) {
        throw new UnauthorizedError({
          code: "UNAUTHORIZED",
          message: "Failed to authenticate the actor or actor is banned.",
        });
      }

      const strictActor: StrictAuthorizationActor = {
        id: actor.id,
        role: actor.role,
        banned: actor.banned,
      };

      // -----------------------------------------------------------------
      // Authorization
      // -----------------------------------------------------------------

      PlatformAuthorizer.can(
        { actor: strictActor },
        PlatformAction.MANAGE_COMPETITION_LIFECYCLE,
      );

      // -----------------------------------------------------------------
      // Validation
      // -----------------------------------------------------------------

      const body = await request.json();
      const { ids } = ApplyLifecycleSchema.parse(body);

      // -----------------------------------------------------------------
      // Business Logic
      // -----------------------------------------------------------------

      const result = await CompetitionLifecycleService.apply(ids);

      // -----------------------------------------------------------------
      // Response
      // -----------------------------------------------------------------

      return ApiResponse.ok(result);
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

      // Toggling automation is a lifecycle-management capability, distinct
      // from ordinary field edits — a competition OWNER/MAINTAINER who can
      // edit every other field on this form still may not turn automatic
      // status management on or off without the platform capability. An
      // explicit `status` in the same payload is unaffected: that remains
      // gated by `CompetitionAuthorizer.edit` above, exactly as before.
      if (data.automaticStatusUpdatesDisabled !== undefined) {
        PlatformAuthorizer.can(
          { actor: context.actor },
          PlatformAction.MANAGE_COMPETITION_LIFECYCLE,
        );
      }

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
    slot: string,
  ) {
    return Route.execute(async () => {
      // -----------------------------------------------------------------
      // Validation (slot)
      // -----------------------------------------------------------------

      if (!isCompetitionAssetSlot(slot)) {
        throw new ValidationError({
          code: "INVALID_ASSET_SLOT",
          status: 400,
          message: `"${slot}" is not a valid competition asset slot.`,
        });
      }

      // -----------------------------------------------------------------
      // Authentication
      // -----------------------------------------------------------------

      const actor = await SessionService.getActor(request);

      // -----------------------------------------------------------------
      // Validation (body)
      // -----------------------------------------------------------------

      const body = await request.json();

      const { assetId } = SetAssetSchema.parse(body);

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
        assetId,
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

  // ==========================================================================
  // Technologies
  // ==========================================================================

  static async listTechnologies(request: NextRequest, competitionId: string) {
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

      CompetitionAuthorizer.manageTechnologies(context);

      // -----------------------------------------------------------------
      // Business Logic
      // -----------------------------------------------------------------

      const technologies = await CompetitionTechnologyService.list(
        context.competition.id,
      );

      // -----------------------------------------------------------------
      // Response
      // -----------------------------------------------------------------

      return ApiResponse.ok(technologies);
    });
  }

  static async attachTechnology(request: NextRequest, competitionId: string) {
    return Route.execute(async () => {
      // -----------------------------------------------------------------
      // Authentication
      // -----------------------------------------------------------------

      const actor = await SessionService.getActor(request);

      // -----------------------------------------------------------------
      // Validation
      // -----------------------------------------------------------------

      const body = await request.json();

      const data = AttachCompetitionTechnologySchema.parse(body);

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

      CompetitionAuthorizer.manageTechnologies(context);

      // -----------------------------------------------------------------
      // Business Logic
      // -----------------------------------------------------------------

      const technologies = await CompetitionTechnologyService.attach(
        context.competition.id,
        data.technologyId,
      );

      // -----------------------------------------------------------------
      // Response
      // -----------------------------------------------------------------

      return ApiResponse.created(technologies);
    });
  }

  static async detachTechnology(
    request: NextRequest,
    competitionId: string,
    technologyId: string,
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

      CompetitionAuthorizer.manageTechnologies(context);

      // -----------------------------------------------------------------
      // Business Logic
      // -----------------------------------------------------------------

      const technologies = await CompetitionTechnologyService.detach(
        context.competition.id,
        technologyId,
      );

      // -----------------------------------------------------------------
      // Response
      // -----------------------------------------------------------------

      return ApiResponse.ok(technologies);
    });
  }
}
