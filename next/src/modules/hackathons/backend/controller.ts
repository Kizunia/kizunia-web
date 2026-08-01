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
import { CompetitionSearchSchema } from "../search/schema";
import { Slug } from "@/lib/validation/index";
import { CreateAssetSchema } from "@/modules/assets/schemas/create-asset";
import { HackathonAssetSlot } from "../types/asset-slot";
import { AppError, UnauthorizedError } from "@/lib/errors";
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

  static async search(request: NextRequest) {
    return Route.execute(async () => {
      const query = Object.fromEntries(request.nextUrl.searchParams.entries());

      const filters = CompetitionSearchSchema.parse(query);

      const competitions = await CompetitionService.search(filters);

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
      const filters = CompetitionSearchSchema.parse(query);

      // -----------------------------------------------------------------
      // Business Logic
      // -----------------------------------------------------------------
      const competitions = await CompetitionService.searchManageable(
        { id: actor.id, role: actor.role, banned: actor.banned },
        filters,
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
      const filters = CompetitionSearchSchema.parse(query);

      // -----------------------------------------------------------------
      // Business Logic
      // -----------------------------------------------------------------
      const competitions = await CompetitionService.searchAdmin(
        { id: actor.id, role: actor.role, banned: actor.banned },
        filters,
      );

      // -----------------------------------------------------------------
      // Response
      // -----------------------------------------------------------------

      return ApiResponse.ok(competitions);
    });
  }

  static async findBySlug(request: NextRequest, slug: string) {
    return Route.execute(async () => {
      const parsedSlug = Slug.parse(slug);
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

  static async findForEdit(request: NextRequest, hackathonId: string) {
    return Route.execute(async () => {
      const actor = await SessionService.getActor(request);

      const context = await CompetitionContextResolver.resolve({
        actor,
        hackathonId,
      });

      CompetitionAuthorizer.edit(context);

      const competition = await CompetitionService.adminFindForEdit(context);

      return ApiResponse.ok(competition);
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

  static async delete(request: NextRequest, hackathonId: string) {
    return Route.execute(async () => {
      // -------------------------------------------------
      // Authentication
      // -------------------------------------------------

      const actor = await SessionService.getActor(request);

      // -------------------------------------------------
      // Context
      // -------------------------------------------------
      console.log("CompetitionController.delete: hackathonId", hackathonId);
      const context = await CompetitionContextResolver.resolve({
        actor,
        hackathonId,
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

  static async setAsset(
    request: NextRequest,
    hackathonId: string,
    slot: HackathonAssetSlot,
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
        hackathonId,
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
}
