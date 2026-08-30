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
import { CompetitionContextResolver } from "./authorization";
import { SlugSchema } from "@/lib/validation/index";
import { CreateAssetSchema } from "@/modules/assets/schemas/create-asset";
import { CompetitionAssetSlot } from "../types/asset-slot";
import { AppError, UnauthorizedError } from "@/lib/errors";
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
}
