/**
 * Projects Module - Controller
 *
 * Responsible for:
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
import { projectService } from "./service";
import { ProjectQuerySchema } from "../search";
import { SessionService } from "@/lib/auth/session";
import { CreateProjectSchema, DeleteProjectSchema } from "../schemas";
import { AuthorizationActor, PlatformRole } from "@/authorization";
import { UpdateProjectProfileDto, UpdateProjectContentDto } from "./dto/input";
import { ProjectDetailsDto } from "./dto/output";
import { UpdateProjectProfileSchema } from "../schemas/update-project-profile.schema";
import { UpdateProjectContentSchema } from "./dto/input/update-project-content.schema";

export class ProjectController {
  // ===========================================================================
  // Read
  // ===========================================================================

  static async findMany({ request }: { request: NextRequest }) {
    return Route.execute(async () => {
      // -----------------------------------------------------------------------
      // Validation
      // -----------------------------------------------------------------------

      const query = Object.fromEntries(request.nextUrl.searchParams.entries());

      const filters = ProjectQuerySchema.parse(query);

      const actor = await SessionService.getOptionalActor(request);
      // -----------------------------------------------------------------------
      // Business Logic
      // -----------------------------------------------------------------------

      const actorData = {
        id: actor?.id ?? null,
        role: actor?.role ?? PlatformRole.USER,
        banned: actor?.banned ?? false,
      };

      const projects = await projectService.findMany({
        query: filters,
        actor: actorData,
      });

      // -----------------------------------------------------------------------
      // Response
      // -----------------------------------------------------------------------

      return ApiResponse.ok(projects);
    });
  }

  static async findBySlug(request: NextRequest, slug: string) {
    //public
    return Route.execute(async () => {
      // -----------------------------------------------------------------------
      // Authentication (Optional)
      // -----------------------------------------------------------------------

      const actor = await SessionService.getOptionalActor(request);

      // -----------------------------------------------------------------------
      // Business Logic
      // -----------------------------------------------------------------------

      const project = await projectService.findBySlug({
        slug,

        actor: {
          id: actor?.id ?? null,
          role: actor?.role ?? null,
          banned: actor?.banned ?? null,
        },
      });

      // -----------------------------------------------------------------------
      // Response
      // -----------------------------------------------------------------------

      return ApiResponse.ok(project);
    });
  }

  static async findById(
  request: NextRequest,
  projectId: string,
) {
  return Route.execute(async () => {
    // =========================================================================
    // Authentication
    // =========================================================================

    const actor = await SessionService.getStrictActor(request);

    // =========================================================================
    // Business Logic
    // =========================================================================

    const project = await projectService.findById({
      id: projectId,

      actor: {
        id: actor.id,
        role: actor.role,
        banned: actor.banned,
      },
    });

    // =========================================================================
    // Response
    // =========================================================================

    return ApiResponse.ok(project);
  });
}

  // ===========================================================================
  // Create
  // ===========================================================================

  static async create(request: NextRequest) {
    return Route.execute(async () => {
      // -----------------------------------------------------------------------
      // Authentication
      // -----------------------------------------------------------------------

      const actor = await SessionService.getActor(request);

      if (!actor || !actor.id || !actor.role || actor.banned === undefined) {
        throw new UnauthorizedError({
          code: "unauthorized",
          message: "Failed to authenticate the actor.",
        });
      }

      // -----------------------------------------------------------------------
      // Validation
      // -----------------------------------------------------------------------

      const body = await request.json();

      const data = CreateProjectSchema.parse(body);

      // -----------------------------------------------------------------------
      // Business Logic
      // -----------------------------------------------------------------------

      const project = await projectService.create({
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

      return ApiResponse.created(project);
    });
  }

  // update
  static async updateProfile(request: NextRequest, projectId: string) {
    return Route.execute(async () => {
      // Authentication
      const actor = await SessionService.getStrictActor(request);

      // Validation
      const data = UpdateProjectProfileSchema.parse(await request.json());

      // Business Logic
      const project = await projectService.updateProfile({
        id: projectId,
        actor: {
          id: actor.id,
          role: actor.role,
          banned: actor.banned,
        },
        dto: data,
      });

      return ApiResponse.ok(project);
    });
  }

  static async updateContent(request: NextRequest, projectId: string) {
    return Route.execute(async () => {
      // Authentication
      const actor = await SessionService.getStrictActor(request);

      // Validation
      const data = UpdateProjectContentSchema.parse(await request.json());

      // Business Logic
      const project = await projectService.updateContent({
        id: projectId,
        actor: {
          id: actor.id,
          role: actor.role,
          banned: actor.banned,
        },
        dto: data,
      });

      return ApiResponse.ok(project);
    });
  }

  // ===========================================================================
  // Delete
  // ===========================================================================

  static async delete(request: NextRequest, projectId: string) {
    return Route.execute(async () => {
      // -----------------------------------------------------------------------
      // Authentication
      // -----------------------------------------------------------------------

      const actor = await SessionService.getActor(request);

      if (!actor || !actor.id || !actor.role || actor.banned === undefined) {
        throw new UnauthorizedError({
          code: "unauthorized",
          message: "Failed to authenticate the actor.",
        });
      }

      // -----------------------------------------------------------------------
      // Validation
      // -----------------------------------------------------------------------

      const { id } = DeleteProjectSchema.parse({
        id: projectId,
      });

      // -----------------------------------------------------------------------
      // Business Logic
      // -----------------------------------------------------------------------

      await projectService.delete({
        id,

        actor: {
          id: actor.id,
          role: actor.role,
          banned: actor.banned,
        },
      });

      // -----------------------------------------------------------------------
      // Response
      // -----------------------------------------------------------------------

      return ApiResponse.ok({});
    });
  }
}
