import type { AuthorizationActor } from "@/authorization";

import { InternalError } from "@/lib/errors";

import type { ProjectContext } from "./context";

import { ProjectRepository } from "../repository";

export class ProjectContextResolver {
  /**
   * Resolves the authorization context for a project.
   */
  static async resolve({
    actor,
    projectId,
  }: {
    actor: AuthorizationActor;
    projectId: string;
  }): Promise<ProjectContext> {
    if (!actor.id) {
      throw new InternalError({
        code: "PROJECT_CONTEXT_RESOLUTION_ERROR",
        status: 500,
        message:
          "Actor ID is required to resolve the project context.",
        details:
          "The actor ID is missing or undefined.",
      });
    }

    const repository = new ProjectRepository();

    const [project, membership] = await Promise.all([
      repository.findForAuthorization({
        id: projectId,
      }),

      repository.findMembership({
        projectId,
        userId: actor.id,
      }),
    ]);

    if (!project) {
      throw new InternalError({
        code: "PROJECT_CONTEXT_RESOLUTION_ERROR",
        status: 500,
        message:
          "Failed to resolve the project authorization context.",
      });
    }

    return {
      actor: {
        id: actor.id,
        role: actor.role,
        banned: actor.banned,
      },

      project,

      membership,
    };
  }

  /**
   * Creates a context from already loaded entities.
   *
   * This avoids additional database queries when the
   * caller already has the authorization data.
   */
  static fromData({
    actor,
    project,
    membership,
  }: ProjectContext): ProjectContext {
    return {
      actor,

      project,

      membership,
    };
  }
}