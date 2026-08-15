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



import { createPortfolioSchema } from "../schemas";

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

      const body =
        await request.json();

      const dto =
        createPortfolioSchema.parse(body);

      // -----------------------------------------------------------------------
      // Business Logic
      // -----------------------------------------------------------------------

      const portfolio =
        await portfolioService.create({
          actor: {
            id: actor.id,
            role: actor.role,
            banned: actor.banned,
          },

          dto,
        });

      // -----------------------------------------------------------------------
      // Response
      // -----------------------------------------------------------------------

      return ApiResponse.created(
        portfolio,
      );
    });
  }
}