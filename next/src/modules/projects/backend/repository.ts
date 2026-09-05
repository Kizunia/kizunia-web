/**
 * Projects Module - Repository
 *
 * Responsible only for database access.
 * Repositories should never contain business rules.
 */

import { Prisma, PrismaClient, Project } from "@/generated/prisma";
import prisma from "@/lib/prisma";
import { ProjectQueryDto } from "../search";
import { ProjectNotFoundError } from "./errors";

const projectSummarySelect = {
  id: true,

  title: true,

  slug: true,

  shortDescription: true,

  visibility: true,

  status: true,

  startDate: true,

  endDate: true,

  logoAsset: {
    select: {
      id: true,
      secureUrl: true,
      width: true,
      height: true,
      format: true,
      mimeType: true,
    },
  },
} satisfies Prisma.ProjectSelect;

const projectDetailsInclude = {
  content: true,

  links: {
    orderBy: {
      order: "asc",
    },
  },

  logoAsset: {
    select: {
      id: true,
      secureUrl: true,
      width: true,
      height: true,
      format: true,
      mimeType: true,
    },
  },
  coverAsset: {
    select: {
      id: true,
      secureUrl: true,
      width: true,
      height: true,
      format: true,
      mimeType: true,
    },
  },

  members: {
    orderBy: {
      joinedAt: "asc",
    },

    include: {
      user: {
        include: {
          avatarAsset: {
            select: {
              id: true,
              secureUrl: true,
              width: true,
              height: true,
              format: true,
              mimeType: true,
            },
          },
        },
      },
    },
  },

  categories: {
    include: {
      category: true,
    },
  },

  technologies: {
    include: {
      technology: true,
      // role: true,
      // content: true,
    },
  },

  badges: {
    orderBy: {
      issuedAt: "desc",
    },

    include: {
      badge: {
        include: {
          iconAsset: {
            select: {
              id: true,
              secureUrl: true,
              width: true,
              height: true,
              format: true,
              mimeType: true,
            },
          },
        },
      },
    },
  },

  competitions: {
    orderBy: {
      submittedAt: "desc",
    },

    include: {
      competition: true,
    },
  },

  testimonials: {
    orderBy: {
      createdAt: "desc",
    },
    include: {
      imageAsset: {
        select: {
          id: true,
          secureUrl: true,
          width: true,
          height: true,
          format: true,
          mimeType: true,
        },
      },
    },
  },

  createdBy: {
    include: {
      avatarAsset: {
        select: {
          id: true,
          secureUrl: true,
          width: true,
          height: true,
          format: true,
          mimeType: true,
        },
      },
    },
  },

  updatedBy: {
    include: {
      avatarAsset: {
        select: {
          id: true,
          secureUrl: true,
          width: true,
          height: true,
          format: true,
          mimeType: true,
        },
      },
    },
  },
} satisfies Prisma.ProjectInclude;

const projectAuthorizationSelect = {
  id: true,

  status: true,

  visibility: true,

  deletedAt: true,

  createdById: true,

  members: {
    select: {
      userId: true,
      role: true,
    },
  },
} satisfies Prisma.ProjectSelect;

export type ProjectSummaryEntity = Prisma.ProjectGetPayload<{
  select: typeof projectSummarySelect;
}>;

export type ProjectDetailsEntity = Prisma.ProjectGetPayload<{
  include: typeof projectDetailsInclude;
}>;

export type ProjectAuthorizationEntity = Prisma.ProjectGetPayload<{
  select: typeof projectAuthorizationSelect;
}>;

type ProjectProfileUpdateData = Pick<
  Prisma.ProjectUpdateInput,
  "title" | "slug" | "shortDescription" | "status" | "visibility" | "updatedBy"
>;
export class ProjectRepository {
  constructor(
    private readonly db: PrismaClient | Prisma.TransactionClient = prisma,
  ) {}

  // =============================================================================
  // Read
  // =============================================================================

  async findById({ id }: { id: string }): Promise<ProjectDetailsEntity | null> {
    return this.db.project.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: projectDetailsInclude,
    });
  }

  async findBySlug({
    slug,
  }: {
    slug: string;
  }): Promise<ProjectDetailsEntity | null> {
    return this.db.project.findFirst({
      where: {
        slug,
        deletedAt: null,
      },
      include: projectDetailsInclude,
    });
  }

  async findForAuthorization({
    id,
  }: {
    id: string;
  }): Promise<ProjectAuthorizationEntity | null> {
    return this.db.project.findFirst({
      where: {
        id,
      },
      select: projectAuthorizationSelect,
    });
  }

  async findMany({
    query,
  }: {
    query: ProjectQueryDto;
  }): Promise<ProjectSummaryEntity[]> {
    return this.db.project.findMany({
      where: this.buildWhereClause({
        query,
      }),

      orderBy: this.buildOrderByClause({
        query,
      }),

      ...this.buildPagination({
        query,
      }),

      select: projectSummarySelect,
    });
  }

  async findMembership({
    projectId,
    userId,
  }: {
    projectId: string;
    userId: string;
  }) {
    return this.db.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
      select: {
        role: true,
      },
    });
  }

  async findContent({
    projectId,
  }: {
    projectId: string;
  }): Promise<{ contentId: string | null } | null> {
    return this.db.project.findFirst({
      where: {
        id: projectId,
        deletedAt: null,
      },
      select: {
        contentId: true,
      },
    });
  }

  async exists({ id }: { id: string }): Promise<boolean> {
    const count = await this.db.project.count({
      where: {
        id,
        deletedAt: null,
      },
    });

    return count > 0;
  }

  async existsBySlug({ slug }: { slug: string }): Promise<boolean> {
    const count = await this.db.project.count({
      where: {
        slug,
        deletedAt: null,
      },
    });

    return count > 0;
  }

  async count(): Promise<number> {
    return this.db.project.count({
      where: {
        deletedAt: null,
      },
    });
  }

  // =============================================================================
  // Create
  // =============================================================================

  async create({
    data,
  }: {
    data: Prisma.ProjectCreateInput;
  }): Promise<ProjectDetailsEntity> {
    return this.db.project.create({
      data,
      include: projectDetailsInclude,
    });
  }

  async createContent({
    projectId,
    data,
  }: {
    projectId: string;
    data: Prisma.ContentCreateWithoutProjectInput;
  }): Promise<ProjectDetailsEntity> {
    return this.db.project.update({
      where: {
        id: projectId,
      },
      data: {
        content: {
          create: data,
        },
      },
      include: projectDetailsInclude,
    });
  }

  // =============================================================================
  // Update
  // =============================================================================

  /**
   *
   * @deprecated Use updateProfile or updateContent or similar instead.
   */
  async update({
    id,
    data,
  }: {
    id: string;
    data: Prisma.ProjectUpdateInput;
  }): Promise<ProjectDetailsEntity> {
    return this.db.project.update({
      where: {
        id,
      },
      data,
      include: projectDetailsInclude,
    });
  }

  async updateProfile({
    id,
    data,
  }: {
    id: string;
    data: ProjectProfileUpdateData;
  }): Promise<ProjectDetailsEntity> {
    return this.db.project.update({
      where: {
        id,
      },
      data,
      include: projectDetailsInclude,
    });
  }

  async setAsset({
    id,
    slot,
    assetId,
  }: {
    id: string;
    slot: "logo" | "cover";
    assetId: string | null;
  }): Promise<ProjectDetailsEntity> {
    const relationField = {
      logo: "logoAsset",
      cover: "coverAsset",
    } as const;

    return this.db.project.update({
      where: { id },
      data: {
        [relationField[slot]]:
          assetId === null
            ? { disconnect: true }
            : { connect: { id: assetId } },
      },
      include: projectDetailsInclude,
    });
  }

  async updateContent({
    contentId,
    data,
  }: {
    contentId: string;
    data: Prisma.ContentUpdateInput;
  }) {
    return this.db.content.update({
      where: {
        id: contentId,
      },
      data,
    });
  }

  // =============================================================================
  // Delete
  // =============================================================================

  async softDelete({
    id,
    deletedAt = new Date(),
  }: {
    id: string;
    deletedAt?: Date;
  }): Promise<Project> {
    return this.db.project.update({
      where: {
        id,
      },
      data: {
        deletedAt,
      },
    });
  }

  async existsBySlugExceptProject({
    slug,
    projectId,
  }: {
    slug: string;
    projectId: string;
  }): Promise<boolean> {
    const count = await this.db.project.count({
      where: {
        slug,
        deletedAt: null,
        id: {
          not: projectId,
        },
      },
    });

    return count > 0;
  }

  // =============================================================================
  // Query Builders
  // =============================================================================

  private buildWhereClause({
    query,
  }: {
    query: ProjectQueryDto;
  }): Prisma.ProjectWhereInput {
    return {
      deletedAt: null,

      // Visibility is a scope, not a caller-supplied filter: findMany() is
      // the public listing path, so it is always restricted to PUBLIC
      // projects here rather than accepting a `visibility` query param.
      visibility: "PUBLIC",

      ...(query.search && {
        OR: [
          {
            title: {
              contains: query.search,
              mode: "insensitive",
            },
          },
          {
            shortDescription: {
              contains: query.search,
              mode: "insensitive",
            },
          },
        ],
      }),

      ...(query.status && {
        status: query.status,
      }),

      ...(query.category && {
        categories: {
          some: {
            category: {
              slug: query.category,
            },
          },
        },
      }),

      ...(query.technology && {
        technologies: {
          some: {
            technology: {
              slug: query.technology,
            },
          },
        },
      }),
    };
  }

  private buildOrderByClause({
    query,
  }: {
    query: ProjectQueryDto;
  }): Prisma.ProjectOrderByWithRelationInput {
    return {
      [query.sortBy]: query.sortOrder,
    };
  }

  private buildPagination({ query }: { query: ProjectQueryDto }) {
    return {
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    };
  }
}
