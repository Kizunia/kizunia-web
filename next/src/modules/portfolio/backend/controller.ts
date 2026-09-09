/**
 * Portfolio Module - Controller
 *
 * Responsible for:
 *
 * - Request parsing
 * - Authentication
 * - Validation
 * - Calling services
 * - Returning responses
 *
 * Controllers should never contain business logic or authorization.
 */

import { NextRequest } from "next/server";

import { ApiResponse, Route } from "@/lib/http";

import { UnauthorizedError } from "@/lib/errors";

import { SessionService } from "@/lib/auth/session";

import { portfolioService } from "./service";
import { portfolioProjectService } from "./portfolio-project.service";



import { createPortfolioSchema } from "../schemas";
import { PortfolioNotFoundError } from "../errors";
import { UpdatePortfolioProfileSchema } from "../schemas/update/profile-update.schema";
import {
  AddPortfolioProjectSchema,
  ReorderPortfolioProjectsSchema,
  UpdatePortfolioProjectSchema,
} from "../schemas/portfolio-project.schema";

export class PortfolioController {
  // ===========================================================================
  // Read
  // ===========================================================================

  static async findPublicByUsername(
    username: string,
  ) {
    return Route.execute(async () => {
      // -----------------------------------------------------------------------
      // Business Logic
      // -----------------------------------------------------------------------

      const portfolio =
        await portfolioService.findPublicByUsername({
          username,
        });

      // -----------------------------------------------------------------------
      // Response
      // -----------------------------------------------------------------------

      return ApiResponse.ok(portfolio);
    });
  }

  static async findMine(request: NextRequest) {
  return Route.execute(async () => {
    // -----------------------------------------------------------------------
    // Authentication
    // -----------------------------------------------------------------------

    const actor = await SessionService.getActor(request);

    if (
      !actor ||
      !actor.id ||
      !actor.role ||
      actor.banned === undefined
    ) {
      throw new UnauthorizedError({
        code: "UNAUTHORIZED",
        message: "Failed to authenticate the actor.",
      });
    }

    // -----------------------------------------------------------------------
    // Business Logic
    // -----------------------------------------------------------------------

    const portfolio = await portfolioService.findMine({
      actor: {
        id: actor.id,
        role: actor.role,
        banned: ( actor.banned === true) ? true : false,
      },
    });

    if (!portfolio) {
      throw new PortfolioNotFoundError();
    }

    // -----------------------------------------------------------------------
    // Response
    // -----------------------------------------------------------------------

    return ApiResponse.ok(portfolio);
  });
}

  // ===========================================================================
  // Create
  // ===========================================================================

  static async create(
    request: NextRequest,
  ) {
    return Route.execute(async () => {
      // -----------------------------------------------------------------------
      // Authentication
      // -----------------------------------------------------------------------

      const actor =
        await SessionService.getActor(request);

      if (
        !actor ||
        !actor.id ||
        !actor.role ||
        actor.banned === undefined
      ) {
        throw new UnauthorizedError({
          code: "UNAUTHORIZED",
          message:
            "Failed to authenticate the actor.",
        });
      }

      // -----------------------------------------------------------------------
      // Validation
      // -----------------------------------------------------------------------

      // const body =
      //   await request.json();

      // const dto =
      //   createPortfolioSchema.parse(body);

      // -----------------------------------------------------------------------
      // Business Logic
      // -----------------------------------------------------------------------

      const portfolio =
        await portfolioService.create({
          actor: {
            id: actor.id,
            role: actor.role,
            banned: (actor.banned === true) ? true : false,
          },

          // dto,
        });

      // -----------------------------------------------------------------------
      // Response
      // -----------------------------------------------------------------------

      return ApiResponse.created(
        portfolio,
      );
    });
  }

  // ===========================================================================
// Profile
// ===========================================================================

static async updateProfile(request: NextRequest) {
  return Route.execute(async () => {
    // -----------------------------------------------------------------------
    // Authentication
    // -----------------------------------------------------------------------

    const actor = await SessionService.getStrictActor(request);

    // if (
    //   !actor ||
    //   !actor.id ||
    //   !actor.role ||
    //   actor.banned === undefined
    // ) {
    //   throw new UnauthorizedError({
    //     code: "unauthorized",
    //     message: "Failed to authenticate the actor.",
    //   });
    // }

    // -----------------------------------------------------------------------
    // Validation
    // -----------------------------------------------------------------------

    const body = await request.json();

    const data = UpdatePortfolioProfileSchema.parse(body);

    // -----------------------------------------------------------------------
    // Business Logic
    // -----------------------------------------------------------------------

    const portfolio = await portfolioService.updateProfile({
      actor: {
        id: actor.id,
        role: actor.role,
        banned: (actor.banned === true) ? true : false,
      },

      dto: data,
    });

    // -----------------------------------------------------------------------
    // Response
    // -----------------------------------------------------------------------

    return ApiResponse.ok(portfolio);
  });
}

  // ===========================================================================
  // Projects
  //
  // No handler accepts a portfolio id: the portfolio is always derived from
  // the session, matching `updateProfile` above. Every mutation returns the
  // resulting list so the editor never has to re-derive server ordering.
  // ===========================================================================

  static async listProjects(request: NextRequest) {
    return Route.execute(async () => {
      // -----------------------------------------------------------------------
      // Authentication
      // -----------------------------------------------------------------------

      const actor = await SessionService.getStrictActor(request);

      // -----------------------------------------------------------------------
      // Business Logic
      // -----------------------------------------------------------------------

      const projects = await portfolioProjectService.list({ actor });

      // -----------------------------------------------------------------------
      // Response
      // -----------------------------------------------------------------------

      return ApiResponse.ok(projects);
    });
  }

  static async addProject(request: NextRequest) {
    return Route.execute(async () => {
      // -----------------------------------------------------------------------
      // Authentication
      // -----------------------------------------------------------------------

      const actor = await SessionService.getStrictActor(request);

      // -----------------------------------------------------------------------
      // Validation
      // -----------------------------------------------------------------------

      const body = await request.json();

      const dto = AddPortfolioProjectSchema.parse(body);

      // -----------------------------------------------------------------------
      // Business Logic
      // -----------------------------------------------------------------------

      const projects = await portfolioProjectService.add({ actor, dto });

      // -----------------------------------------------------------------------
      // Response
      // -----------------------------------------------------------------------

      return ApiResponse.created(projects);
    });
  }

  static async reorderProjects(request: NextRequest) {
    return Route.execute(async () => {
      // -----------------------------------------------------------------------
      // Authentication
      // -----------------------------------------------------------------------

      const actor = await SessionService.getStrictActor(request);

      // -----------------------------------------------------------------------
      // Validation
      // -----------------------------------------------------------------------

      const body = await request.json();

      const dto = ReorderPortfolioProjectsSchema.parse(body);

      // -----------------------------------------------------------------------
      // Business Logic
      // -----------------------------------------------------------------------

      const projects = await portfolioProjectService.reorder({ actor, dto });

      // -----------------------------------------------------------------------
      // Response
      // -----------------------------------------------------------------------

      return ApiResponse.ok(projects);
    });
  }

  static async updateProject(request: NextRequest, projectId: string) {
    return Route.execute(async () => {
      // -----------------------------------------------------------------------
      // Authentication
      // -----------------------------------------------------------------------

      const actor = await SessionService.getStrictActor(request);

      // -----------------------------------------------------------------------
      // Validation
      // -----------------------------------------------------------------------

      const body = await request.json();

      const dto = UpdatePortfolioProjectSchema.parse(body);

      // -----------------------------------------------------------------------
      // Business Logic
      // -----------------------------------------------------------------------

      const projects = await portfolioProjectService.setFeatured({
        actor,
        projectId,
        dto,
      });

      // -----------------------------------------------------------------------
      // Response
      // -----------------------------------------------------------------------

      return ApiResponse.ok(projects);
    });
  }

  static async removeProject(request: NextRequest, projectId: string) {
    return Route.execute(async () => {
      // -----------------------------------------------------------------------
      // Authentication
      // -----------------------------------------------------------------------

      const actor = await SessionService.getStrictActor(request);

      // -----------------------------------------------------------------------
      // Business Logic
      // -----------------------------------------------------------------------

      const projects = await portfolioProjectService.remove({
        actor,
        projectId,
      });

      // -----------------------------------------------------------------------
      // Response
      // -----------------------------------------------------------------------

      return ApiResponse.ok(projects);
    });
  }
}