/**
 * Projects Module - Service
 *
 * Responsible for all business rules:
 * - Duplicate detection
 * - Transactions
 * - Workflows
 * - Permission checks
 * - Business validation
 */

import { AuthorizationActor, AuthorizationCode, StrictAuthorizationActor } from "@/authorization";
import { AuthorizationError } from "@/lib/errors";
import {
  ProjectAction,
  ProjectAuthorizer,
  ProjectContext,
  ProjectContextResolver,
  ProjectPolicy,
} from "./authorization";
import {
  ProjectNotFoundError,
  ProjectSlugAlreadyExistsError,
} from "./errors/index";
import { ProjectMapper } from "./mapper/project.mapper";
import { ProjectRepository, ProjectDetailsEntity } from "./repository";
import { ProjectDetailsDto, ProjectSummaryDto } from "./dto/output";
import { ProjectQueryDto } from "../search";
import prisma from "@/lib/prisma";
import { CreateProjectDto } from "./dto/input";
import { ProjectRole } from "@/generated/prisma";
import { PlatformAction } from "@/authorization/platform/actions";
import { PlatformAuthorizer } from "@/authorization/platform/authorizer";

export class ProjectService {
  private readonly repository = new ProjectRepository();

  // ===========================================================================
  // Read
  // ===========================================================================

  async findBySlug({
    slug,
    actor,
  }: {
    slug: string;
    actor: AuthorizationActor;
  }): Promise<ProjectDetailsDto> {
    const project = await this.repository.findBySlug({
      slug,
    });

    

    if (!project) {
      throw new ProjectNotFoundError();
    }

    const membership = actor.id
      ? await this.repository.findMembership({
          projectId: project.id,
          userId: actor.id,
        })
      : null;

    const context = ProjectContextResolver.fromData({
      actor,

      project,

      membership,
    });

    // const decision = ProjectPolicy.can(context, ProjectAction.VIEW);
    ProjectAuthorizer.read(context)

    // if (!decision.allowed) {
    //   throw new AuthorizationError({
    //     status: 403,
    //     message: decision.message ?? "Unauthorized.",
    //     code: "UNAUTHORIZED",
    //   });
    // }

    return ProjectMapper.toDetailsDto(project);
  }

  async findMany({
    query,
    actor,
  }: {
    query: ProjectQueryDto;
    actor: AuthorizationActor;
  }): Promise<ProjectSummaryDto[]> {
    const projects = await this.repository.findMany({
      query,
    });

    //  PlatformAuthorizer.can({actor}, PlatformAction.VIEW_PUBLIC_PROJECTS); //TODO: Implement this check in the future

    return ProjectMapper.toSummaryDtos(projects);
  }

  // ===========================================================================
  // Create
  // ===========================================================================

  async create({
    actor,
    dto,
  }: {
    actor: AuthorizationActor;
    dto: CreateProjectDto;
  }): Promise<ProjectDetailsDto> {
    await this.ensureSlugAvailable({
      slug: dto.slug,
    });

    if (!actor.id) {
      throw new AuthorizationError({
        code: AuthorizationCode.UNAUTHORIZED,
        message: "Authentication is required.",
        status: 401,
      });
    }

    const actorId = actor.id;

    PlatformAuthorizer.can({actor}, PlatformAction.CREATE_PROJECT);

    const project = await prisma.$transaction(async (tx) => {
      const repository = new ProjectRepository(tx);

      const project = await repository.create({
        data: {
          ...ProjectMapper.toCreateInput(dto),

          content: {
            create: {
              content: dto.content,
            },
          },

          createdBy: {
            connect: {
              id: actorId,
            },
          },

          updatedBy: {
            connect: {
              id: actorId,
            },
          },

          ...(dto.logoAssetId && {
            logoAsset: {
              connect: {
                id: dto.logoAssetId,
              },
            },
          }),

          ...(dto.coverAssetId && {
            coverAsset: {
              connect: {
                id: dto.coverAssetId,
              },
            },
          }),
        },
      });

      await tx.projectMember.create({
        data: {
          projectId: project.id,
          userId: actorId,
          role: ProjectRole.OWNER,
        },
      });

      return project;
    });

    return ProjectMapper.toDetailsDto(project);
  }

  // ===========================================================================
  // Update
  // ===========================================================================

  async update() {
    throw new Error("Not implemented.");
  }

  // ===========================================================================
  // Delete
  // ===========================================================================

  async delete({
  id,
  actor,
}: {
  id: string;
  actor: AuthorizationActor;
}): Promise<void> {
  const project = await this.getProjectOrThrow({
    id,
  });

  const membership = actor.id
    ? await this.repository.findMembership({
        projectId: project.id,
        userId: actor.id,
      })
    : null;

  const context = ProjectContextResolver.fromData({
    actor,
    project,
    membership,
  });

  // const decision = ProjectPolicy.can(
  //   context,
  //   ProjectAction.DELETE,
  // );

  ProjectAuthorizer.delete(context)

  // if (!decision.allowed) {
  //   throw new AuthorizationError({
  //       status: 403,
  //       message: decision.message ?? "Unauthorized.",
  //       code: "UNAUTHORIZED",
  //   });
  // }

  await this.repository.softDelete({
    id,
  });
}

  // ===========================================================================
  // Helpers
  // ===========================================================================

  private async getProjectOrThrow({
    id,
  }: {
    id: string;
  }): Promise<ProjectDetailsEntity> {
    const project = await this.repository.findById({
      id,
    });

    if (!project) {
      throw new ProjectNotFoundError();
    }

    return project;
  }

  private async ensureSlugAvailable({ slug }: { slug: string }): Promise<void> {
    const exists = await this.repository.existsBySlug({
      slug,
    });

    if (exists) {
      throw new ProjectSlugAlreadyExistsError();
    }
  }

}

export const projectService = new ProjectService();