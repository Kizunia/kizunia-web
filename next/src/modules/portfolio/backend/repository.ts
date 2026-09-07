/**
 * Portfolio Module - Repository
 *
 * Responsible only for database access.
 * Repositories should never contain business rules.
 */

import {
  PortfolioVisibility,
  Prisma,
  PrismaClient,
  ProjectStatus,
  ProjectVisibility,
} from "@/generated/prisma";
import prisma from "@/lib/prisma";
import { PortfolioAlreadyExistsError, PortfolioNotFoundError } from "../errors";

const portfolioSummarySelect = {
  id: true,

  displayName: true,

  headline: true,

  location: true,

  visibility: true,

  user: {
    select: {
      username: true,

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
} satisfies Prisma.PortfolioSelect;

const portfolioAuthorizationSelect = {
  id: true,

  userId: true,

  visibility: true,

  deletedAt: true,
} satisfies Prisma.PortfolioSelect;

const portfolioPublicDetailsInclude = {
  user: {
    select: {
      id: true,

      username: true,

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
    },
  },

  settings: true,

  resumeAsset: {
    select: {
      id: true,
      secureUrl: true,
      width: true,
      height: true,
      format: true,
      mimeType: true,
    },
  },

  links: {
    orderBy: {
      order: "asc",
    },
  },

  technologies: {
    orderBy: {
      displayOrder: "asc",
    },

    include: {
      technology: true,
    },
  },

  education: {
    orderBy: {
      displayOrder: "asc",
    },

    include: {
      institutionLogoAsset: true,
    },
  },

  experience: {
    orderBy: {
      displayOrder: "asc",
    },

    include: {
      companyLogoAsset: true,
    },
  },

  achievements: {
    orderBy: {
      displayOrder: "asc",
    },

    include: {
      asset: true,
    },
  },

  certifications: {
    orderBy: {
      displayOrder: "asc",
    },

    include: {
      asset: true,
    },
  },

  testimonials: {
    orderBy: {
      displayOrder: "asc",
    },

    include: {
      imageAsset: true,
    },
  },

  projects: {
    where: {
      hidden: false,
      project: {
        deletedAt: null,

        visibility: ProjectVisibility.PUBLIC,

        status: ProjectStatus.PUBLISHED,
      },
    },

    orderBy: {
      displayOrder: "asc",
    },

    include: {
      project: {
        include: {
          logoAsset: true,

          coverAsset: true,

          links: {
            orderBy: {
              order: "asc",
            },
          },

          technologies: {
            include: {
              technology: true,
            },
          },

          categories: {
            include: {
              category: true,
            },
          },

          badges: {
            include: {
              badge: true,
            },
          },

          competitions: {
            include: {
              competition: {
                select: {
                  id: true,

                  title: true,

                  slug: true,

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
                },
              },
            },
          },

          testimonials: {
            include: {
              imageAsset: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.PortfolioInclude;

const portfolioEditorInclude = {
  user: {
    select: {
      id: true,

      username: true,

      name: true,

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
    },
  },

  settings: true,

  resumeAsset: {
    select: {
      id: true,
      secureUrl: true,
      width: true,
      height: true,
      format: true,
      mimeType: true,
    },
  },

  links: {
    orderBy: {
      order: "asc",
    },
  },

  technologies: {
    orderBy: {
      displayOrder: "asc",
    },

    include: {
      technology: true,
    },
  },

  education: {
    orderBy: {
      displayOrder: "asc",
    },

    include: {
      institutionLogoAsset: true,
    },
  },

  experience: {
    orderBy: {
      displayOrder: "asc",
    },

    include: {
      companyLogoAsset: true,
    },
  },

  achievements: {
    orderBy: {
      displayOrder: "asc",
    },

    include: {
      asset: true,
    },
  },

  certifications: {
    orderBy: {
      displayOrder: "asc",
    },

    include: {
      asset: true,
    },
  },

  testimonials: {
    orderBy: {
      displayOrder: "asc",
    },

    include: {
      imageAsset: true,
    },
  },

  projects: {
    where: {
      project: {
        deletedAt: null,
      },
    },

    orderBy: {
      displayOrder: "asc",
    },

    include: {
      project: {
        include: {
          logoAsset: true,

          coverAsset: true,

          links: {
            orderBy: {
              order: "asc",
            },
          },

          technologies: {
            include: {
              technology: true,
            },
          },

          categories: {
            include: {
              category: true,
            },
          },

          badges: {
            include: {
              badge: true,
            },
          },

          competitions: {
            include: {
              competition: {
                select: {
                  id: true,

                  title: true,

                  slug: true,

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
                },
              },
            },
          },

          testimonials: {
            include: {
              imageAsset: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.PortfolioInclude;


export type PortfolioSummaryEntity = Prisma.PortfolioGetPayload<{
  select: typeof portfolioSummarySelect;
}>;

export type PortfolioPublicDetailsEntity = Prisma.PortfolioGetPayload<{
  include: typeof portfolioPublicDetailsInclude;
}>;

export type PortfolioEditorEntity = Prisma.PortfolioGetPayload<{
  include: typeof portfolioEditorInclude;
}>;

export type PortfolioAuthorizationEntity = Prisma.PortfolioGetPayload<{
  select: typeof portfolioAuthorizationSelect;
}>;

export interface PortfolioProfileUpdateData {
  displayName?: string;
  headline?: string | null;
  bio?: string | null;
  phone?: string | null;
  publicContactEmail?: string | null;
  location?: string | null;
  resumeAssetId?: string | null;
}
/**
 * Portfolio Module - Repository
 *
 * Responsible only for database access.
 * Repositories should never contain business rules.
 */

export class PortfolioRepository {
  constructor(
    private readonly db: Prisma.TransactionClient | PrismaClient = prisma,
  ) {}

  // ===========================================================================
  // Read
  // ===========================================================================

  async findPublicByUsername({
    username,
  }: {
    username: string;
  }): Promise<PortfolioPublicDetailsEntity | null> {
    return this.db.portfolio.findFirst({
      where: {
        deletedAt: null,

        visibility: PortfolioVisibility.PUBLIC,

        user: {
          username,

          // Banned users must not have a publicly visible portfolio, even
          // if the portfolio row itself is PUBLIC and not deleted.
          banned: {
            not: true,
          },
        },
      },

      include: portfolioPublicDetailsInclude,
    });
  }

  async findPublicByUsernameOrThrow({
    username,
  }: {
    username: string;
  }): Promise<PortfolioPublicDetailsEntity> {
    const portfolio = await this.findPublicByUsername({
      username,
    });

    if (!portfolio) {
      throw new PortfolioNotFoundError();
    }

    return portfolio;
  }

  async findById({
    id,
  }: {
    id: string;
  }): Promise<PortfolioPublicDetailsEntity | null> {
    return this.db.portfolio.findUnique({
      where: {
        id,
      },

      include: portfolioPublicDetailsInclude,
    });
  }

  async findByUserId({
    userId,
  }: {
    userId: string;
  }): Promise<PortfolioPublicDetailsEntity | null> {
    return this.db.portfolio.findUnique({
      where: {
        userId,
      },

      include: portfolioPublicDetailsInclude,
    });
  }

  async findEditorByUserId({
    userId,
  }: {
    userId: string;
  }): Promise<PortfolioEditorEntity | null> {
    return this.db.portfolio.findUnique({
      where: {
        userId,
      },

      include: portfolioEditorInclude,
    });
  }

  async findByUserIdOrThrow({
    userId,
  }: {
    userId: string;
  }): Promise<PortfolioPublicDetailsEntity> {
    const portfolio = await this.findByUserId({
      userId,
    });

    if (!portfolio) {
      throw new PortfolioNotFoundError();
    }

    return portfolio;
  }

  async findByIdOrThrow({
    id,
  }: {
    id: string;
  }): Promise<PortfolioPublicDetailsEntity> {
    const portfolio = await this.findById({
      id,
    });

    if (!portfolio) {
      throw new PortfolioNotFoundError();
    }

    return portfolio;
  }

  async findEditorByUserIdOrThrow({
    userId,
  }: {
    userId: string;
  }): Promise<PortfolioEditorEntity> {
    const portfolio = await this.findEditorByUserId({
      userId,
    });

    if (!portfolio) {
      throw new PortfolioNotFoundError();
    }

    return portfolio;
  }

  async findForAuthorization({
    id,
  }: {
    id: string;
  }): Promise<PortfolioAuthorizationEntity | null> {
    return this.db.portfolio.findUnique({
      where: {
        id,
      },

      select: portfolioAuthorizationSelect,
    });
  }

  async exists({ id }: { id: string }): Promise<boolean> {
    const portfolio = await this.db.portfolio.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
      },
    });

    return portfolio !== null;
  }

  async existsByUserId({ userId }: { userId: string }): Promise<boolean> {
    const portfolio = await this.db.portfolio.findUnique({
      where: {
        userId,
      },

      select: {
        id: true,
      },
    });

    return portfolio !== null;
  }

  async count(): Promise<number> {
    return this.db.portfolio.count({
      where: {
        deletedAt: null,
      },
    });
  }

  // ===========================================================================
  // Create
  // ===========================================================================

  async create({
    data,
  }: {
    data: Prisma.PortfolioCreateInput;
  }): Promise<PortfolioEditorEntity> {
    try {
      return await this.db.portfolio.create({
        data,

        include: portfolioEditorInclude,
      });
    } catch (error) {
      // Backstop for the concurrent-creation race: two requests can both
      // pass the service's existence pre-check before either has written a
      // row. Only the violation of the one-Portfolio-per-user constraint is
      // translated — every other Prisma error propagates untouched.
      //
      // `data.user` is always a `connect` (the service never `create`s the
      // User here), so with `Portfolio.userId @unique` the second concurrent
      // insert can surface as either of two Prisma codes depending on
      // whether the query engine's own one-to-one relation check or the
      // database's unique index catches it first:
      //   - P2002: the DB unique constraint on `userId` was violated.
      //   - P2014: the query engine rejected the `user` connect because
      //     that User already has a Portfolio (a required 1:1 relation
      //     violation) — confirmed to be what Prisma actually raises here
      //     against this schema/engine, so it must be handled, not just
      //     the more "obvious" P2002.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        Array.isArray(error.meta?.target) &&
        (error.meta.target as string[]).includes("userId")
      ) {
        throw new PortfolioAlreadyExistsError();
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2014" &&
        error.meta?.modelName === "Portfolio"
      ) {
        throw new PortfolioAlreadyExistsError();
      }

      throw error;
    }
  }

  async findUserForCreation({
    userId,
  }: {
    userId: string;
  }): Promise<{ name: string; username: string | null } | null> {
    return this.db.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        name: true,
        username: true,
      },
    });
  }

  // ===========================================================================
  // Update
  // ===========================================================================

  // ===========================================================================
  // Update
  // ===========================================================================

 async updateProfile({
  id,
  data,
}: {
  id: string;
  data: PortfolioProfileUpdateData;
}): Promise<PortfolioEditorEntity> {
  return this.db.portfolio.update({
    where: {
      id,
    },

    data: {
      displayName: data.displayName,
      headline: data.headline,
      bio: data.bio,
      phone: data.phone,
      publicContactEmail: data.publicContactEmail,
      location: data.location,

      ...(data.resumeAssetId !== undefined && {
        resumeAsset:
          data.resumeAssetId === null
            ? {
                disconnect: true,
              }
            : {
                connect: {
                  id: data.resumeAssetId,
                },
              },
      }),
    },

    include: portfolioEditorInclude,
  });
}

  async update({
    id,
    data,
  }: {
    id: string;
    data: Prisma.PortfolioUpdateInput;
  }): Promise<PortfolioPublicDetailsEntity> {
    return this.db.portfolio.update({
      where: {
        id,
      },

      data,

      include: portfolioPublicDetailsInclude,
    });
  }

  // ===========================================================================
  // Delete
  // ===========================================================================

  async softDelete({ id }: { id: string }): Promise<void> {
    await this.db.portfolio.update({
      where: {
        id,
      },

      data: {
        deletedAt: new Date(),
      },
    });
  }
}
