/**
 * Projects Module - Repository
 *
 * Responsible only for database access.
 * Repositories should never contain business rules.
 */

import { Prisma, PrismaClient, Project } from "@/generated/prisma";
import prisma from "@/lib/prisma";
import { ProjectQueryDto } from "../search";

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

  // =============================================================================
  // Update
  // =============================================================================

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

      ...(query.visibility && {
        visibility: query.visibility,
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
