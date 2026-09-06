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
import { projectLinkService } from "./project-link.service";
import { ProjectQuerySchema, ProjectMineQuerySchema } from "../search";
import { SessionService } from "@/lib/auth/session";
import { CreateProjectSchema, DeleteProjectSchema } from "../schemas";
import { AuthorizationActor, PlatformRole } from "@/authorization";
import { UpdateProjectProfileDto, UpdateProjectContentDto } from "./dto/input";
import { ProjectDetailsDto } from "./dto/output";
import { UpdateProjectProfileSchema } from "../schemas/update-project-profile.schema";
import { UpdateProjectContentSchema } from "./dto/input/update-project-content.schema";
import {
  CreateProjectLinkSchema,
  ReorderProjectLinksSchema,
  UpdateProjectLinkSchema,
} from "../schemas/project-link.schema";
import { SetAssetSchema } from "@/modules/assets/schemas/set-asset";
import { ValidationError } from "@/lib/errors";
import { isProjectAssetSlot } from "../types/asset-slot";

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

  /**
   * Projects the authenticated actor is a member of. The actor is always
   * derived from the session — there is no `userId` query param to accept.
   */
  static async findMine(request: NextRequest) {
    return Route.execute(async () => {
      // -----------------------------------------------------------------------
      // Authentication
      // -----------------------------------------------------------------------

      const actor = await SessionService.getStrictActor(request);

      // -----------------------------------------------------------------------
      // Validation
      // -----------------------------------------------------------------------

      const query = Object.fromEntries(request.nextUrl.searchParams.entries());

      const filters = ProjectMineQuerySchema.parse(query);

      // -----------------------------------------------------------------------
      // Business Logic
      // -----------------------------------------------------------------------

      const result = await projectService.findMine({
        actor,
        query: filters,
      });

      // -----------------------------------------------------------------------
      // Response
      // -----------------------------------------------------------------------

      return ApiResponse.ok(result);
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

  static async setAsset(request: NextRequest, projectId: string, slot: string) {
    return Route.execute(async () => {
      // Validation (slot)
      if (!isProjectAssetSlot(slot)) {
        throw new ValidationError({
          code: "INVALID_ASSET_SLOT",
          status: 400,
          message: `"${slot}" is not a valid project asset slot.`,
        });
      }

      // Authentication
      const actor = await SessionService.getStrictActor(request);

      // Validation (body)
      const { assetId } = SetAssetSchema.parse(await request.json());

      // Business Logic
      const project = await projectService.setAsset({
        id: projectId,
        actor,
        slot,
        assetId,
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

      if (!actor || !actor.id || !actor.role || typeof actor.banned !== "boolean") {
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

  // ===========================================================================
  // Links
  // ===========================================================================

  static async listLinks(request: NextRequest, projectId: string) {
    return Route.execute(async () => {
      // Authentication
      const actor = await SessionService.getStrictActor(request);

      // Business Logic
      const links = await projectLinkService.list({
        projectId,
        actor,
      });

      return ApiResponse.ok(links);
    });
  }

  static async addLink(request: NextRequest, projectId: string) {
    return Route.execute(async () => {
      // Authentication
      const actor = await SessionService.getStrictActor(request);

      // Validation
      const dto = CreateProjectLinkSchema.parse(await request.json());

      // Business Logic
      const links = await projectLinkService.add({
        projectId,
        actor,
        dto,
      });

      return ApiResponse.ok(links);
    });
  }

  static async updateLink(
    request: NextRequest,
    projectId: string,
    linkId: string,
  ) {
    return Route.execute(async () => {
      // Authentication
      const actor = await SessionService.getStrictActor(request);

      // Validation
      const dto = UpdateProjectLinkSchema.parse(await request.json());

      // Business Logic
      const links = await projectLinkService.update({
        projectId,
        linkId,
        actor,
        dto,
      });

      return ApiResponse.ok(links);
    });
  }

  static async removeLink(
    request: NextRequest,
    projectId: string,
    linkId: string,
  ) {
    return Route.execute(async () => {
      // Authentication
      const actor = await SessionService.getStrictActor(request);

      // Business Logic
      const links = await projectLinkService.remove({
        projectId,
        linkId,
        actor,
      });

      return ApiResponse.ok(links);
    });
  }

  /**
   * Reorders the project's links. Lives on the collection rather than an
   * individual link because ordering is a property of the list.
   */
  static async reorderLinks(request: NextRequest, projectId: string) {
    return Route.execute(async () => {
      // Authentication
      const actor = await SessionService.getStrictActor(request);

      // Validation
      const dto = ReorderProjectLinksSchema.parse(await request.json());

      // Business Logic
      const links = await projectLinkService.reorder({
        projectId,
        actor,
        dto,
      });

      return ApiResponse.ok(links);
    });
  }
}
