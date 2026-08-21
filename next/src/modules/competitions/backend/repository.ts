import prisma from "@/lib/prisma";
import type { CreateCompetitionInput } from "../schemas/create-competition";
import type { Prisma } from "@/generated/prisma";
import { UpdateCompetitionInput } from "../schemas/update-competition";
import { NotFoundError } from "@/lib/errors";
import type { CompetitionSearchOptions } from "../search/types";
import { CompetitionSearchInput } from "../search/schema";
import { CompetitionSearchBuilder } from "../search/builder";
import { CompetitionAssetSlot } from "../types/asset-slot";
import { CompetitionNotFoundError } from "../errors";

// interface FindCompetitionsOptions {
//   search?: string;

//   mode?: Prisma.CompetitionWhereInput["mode"];

//   status?: Prisma.CompetitionWhereInput["status"];

//   category?: string;

//   technology?: string;

//   sort?: "start-date" | "deadline" | "newest";

//   skip: number;

//   take: number;
// }

export class CompetitionRepository {
  /**
   * Database Layer
   *
   * Responsibilities
   * ----------------
   * ✓ Build Prisma queries
   * ✓ Execute database operations
   * ✓ Return Prisma models
   *
   * Does NOT
   * ----------------
   * ✗ Business rules
   * ✗ Authentication
   * ✗ Authorization
   * ✗ DTO Mapping
   */
  // static async findMany(filters: FindCompetitionsOptions) {
  //   const where: Prisma.CompetitionWhereInput = {
  //     deletedAt: null,
  //     ...(filters.search && {
  //       OR: [
  //         {
  //           title: {
  //             contains: filters.search,
  //             mode: "insensitive",
  //           },
  //         },
  //         {
  //           organizer: {
  //             contains: filters.search,
  //             mode: "insensitive",
  //           },
  //         },
  //       ],
  //     }),

  //     ...(filters.mode && {
  //       mode: filters.mode,
  //     }),

  //     ...(filters.status && {
  //       status: filters.status,
  //     }),

  //     ...(filters.category && {
  //       categories: {
  //         some: {
  //           category: {
  //             slug: filters.category,
  //           },
  //         },
  //       },
  //     }),

  //     ...(filters.technology && {
  //       technologies: {
  //         some: {
  //           technology: {
  //             slug: filters.technology,
  //           },
  //         },
  //       },
  //     }),
  //   };

  //   return prisma.competition.findMany({
  //     where,

  //     include: {
  //       logoAsset: true,
  //       coverAsset: true,
  //     },

  //     orderBy: this.getOrderBy(filters.sort),

  //     skip: filters.skip,

  //     take: filters.take,
  //   });
  // }

  static async findMany(filters: CompetitionSearchInput) {
    const query = CompetitionSearchBuilder.build(filters);

    return prisma.competition.findMany({
      ...query,

      include: {
        logoAsset: true,
        coverAsset: true,
      },
    });
  }

  static async findManyManageable(
    actorId: string,
    filters: CompetitionSearchInput,
  ) {
    const query = CompetitionSearchBuilder.buildManagement(actorId, filters);

    return prisma.competition.findMany({
      ...query,

      include: {
        logoAsset: true,
        coverAsset: true,

        members: {
          where: {
            userId: actorId,
          },
          take: 1,
        },

        _count: {
          select: {
            members: true,
          },
        },
      },
    });
  }

  static async findManyAdmin(actorId: string, filters: CompetitionSearchInput) {
    const query = CompetitionSearchBuilder.buildAdmin(filters);

    return prisma.competition.findMany({
      ...query,

      include: {
        logoAsset: true,
        coverAsset: true,

        members: {
          where: {
            userId: actorId,
          },
          take: 1,
        },

        _count: {
          select: {
            members: true,
          },
        },
      },
    });
  }

  static async findBySlug(slug: string) {
    return prisma.competition.findFirst({
      where: {
        slug,
        deletedAt: null,
      },
      include: {
        logoAsset: true,
        coverAsset: true,
        bannerAsset: true,
        content: true,
        categories: {
          include: {
            category: true,
          },
        },

        technologies: {
          include: {
            technology: true,
          },
        },

        eligibilities: true,
      },
    });
  }
  static async findBySlugOrThrow(slug: string): Promise<
    Prisma.CompetitionGetPayload<{
      include: {
        logoAsset: true;
        coverAsset: true;
        bannerAsset: true;
        content: true;
        categories: {
          include: {
            category: true;
          };
        };

        technologies: {
          include: {
            technology: true;
          };
        };

        eligibilities: true;
      };
    }>
  > {
    const competition = await this.findBySlug(slug);

    if (!competition) {
      throw new CompetitionNotFoundError();
    }
    return competition;
  }

  static async findById(id: string) {
    return prisma.competition.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
  }

  static async findByIdOrThrow(id: string) {
    const competition = await this.findById(id);

    if (!competition) {
      throw new CompetitionNotFoundError(`Competition with given id not found.`);
    }

    return competition;
  }

  static async findByIdForEdit(
    id: string,
    db: Prisma.TransactionClient | Prisma.DefaultPrismaClient = prisma,
  ) {
    const competition = await db.competition.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        logoAsset: true,
        coverAsset: true,
        bannerAsset: true,

        content: true,

        categories: {
          include: {
            category: true,
          },
        },

        technologies: {
          include: {
            technology: true,
          },
        },
      },
    });

    if (!competition) {
      throw new CompetitionNotFoundError();
    }

    return competition;
  }

  /**
   * This method is different from existsBySlugExceptCompetition because it doesn't check for the competition id.
   * It's only used for create method.
   */
  static async existsBySlug(slug: string): Promise<boolean> {
    const exists = await prisma.competition.findUnique({
      where: {
        slug,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    return exists !== null;
  }


  static async existsBySlugExceptCompetition({
    slug,
    competitionId,
  }: {
    slug: string;
    competitionId: string;
  }): Promise<boolean> {
    const exists = await prisma.competition.findFirst({
      where: {
        slug,
        deletedAt: null,
        id: {
          not: competitionId,
        },
      },
      select: {
        id: true,
      },
    });

    return exists !== null;
  }

  static async existsById(id: string): Promise<boolean> {
    const exists = await prisma.competition.findUnique({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    return exists !== null;
  }
  static async create({ data }: { data: CreateCompetitionInput }) {
    const competition = await prisma.competition.create({
      data: {
        title: data.title,
        slug: data.slug,

        shortDescription: data.shortDescription || null,

        organizer: data.organizer || null,

        website: data.website || null,

        registrationLink: data.registrationLink || null,

        content: {
          create: {
            content: data.content ?? "",
          },
        },
      },
    });

    return competition;
  }

  static async update({
    id,
    data,
  }: {
    id: string;
    data: UpdateCompetitionInput;
  }) {
    const { content, ...rest } = data;

    return prisma.$transaction(async (tx) => {
      const competition = await tx.competition.findUnique({
        where: {
          id,
        },
        select: {
          contentId: true,
        },
      });

      if (!competition) {
        throw new CompetitionNotFoundError();
      }

      let contentId = competition.contentId;

      // ------------------------------------------------------------
      // Update or create documentation
      // ------------------------------------------------------------

      if (content !== undefined) {
        if (contentId) {
          await tx.content.update({
            where: {
              id: contentId,
            },
            data: {
              content,
              version: {
                increment: 1,
              },
            },
          });
        } else {
          const createdContent = await tx.content.create({
            data: {
              content,
            },
          });

          contentId = createdContent.id;
        }
      }

      // ------------------------------------------------------------
      // Update competition
      // ------------------------------------------------------------

      return tx.competition.update({
        where: {
          id,
        },
        data: {
          ...rest,

          ...(contentId !== competition.contentId && {
            content: {
              connect: {
                id: contentId!,
              },
            },
          }),
        },
      });
    });
  }

  static async setLogoAsset(
    tx: Prisma.TransactionClient,
    competitionId: string,
    assetId: string,
  ) {
    return tx.competition.update({
      where: {
        id: competitionId,
      },
      data: {
        logoAsset: {
          connect: {
            id: assetId,
          },
        },
      },
    });
  }

  static async setAsset(
    tx: Prisma.TransactionClient,
    competitionId: string,
    slot: CompetitionAssetSlot,
    assetId: string,
  ) {
    const relationField = {
      logo: "logoAsset",
      banner: "bannerAsset",
      cover: "coverAsset",
    } as const;

    return tx.competition.update({
      where: {
        id: competitionId,
      },
      data: {
        [relationField[slot]]: {
          connect: {
            id: assetId,
          },
        },
      },
    });
  }

  static async softDelete(id: string) {
    // TODO: Soft delete is not fully implemented yet.
    return prisma.competition.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  static async restore(id: string) {
    return prisma.competition.update({
      where: {
        id,
      },
      data: {
        deletedAt: null,
      },
    });
  }

  static async findMembership(competitionId: string, userId: string) {
    return prisma.competitionMember.findUnique({
      where: {
        competitionId_userId: {
          competitionId,
          userId,
        },
      },
    });
  }

  static async findMembers(competitionId: string) {
    return prisma.competitionMember.findMany({
      where: {
        competitionId,
      },
    });
  }

  static async findOwners(competitionId: string) {
    return prisma.competitionMember.findMany({
      where: {
        competitionId,
        role: "OWNER",
      },
    });
  }

  static async search(query: string) {
    return prisma.competition.findMany({
      where: {
        deletedAt: null,
        OR: [
          {
            title: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            organizer: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
      },
    });
  }

  static async count(filters: CompetitionSearchInput) {
    const { where } = CompetitionSearchBuilder.build(filters);

    return prisma.competition.count({
      where,
    });
  }

  static async countManageable(
    actorId: string,
    filters: CompetitionSearchInput,
  ) {
    const { where } = CompetitionSearchBuilder.buildManagement(
      actorId,
      filters,
    );

    return prisma.competition.count({
      where,
    });
  }

  static async countAdmin(filters: CompetitionSearchInput) {
    const { where } = CompetitionSearchBuilder.buildAdmin(filters);

    return prisma.competition.count({
      where,
    });
  }

  static async searchCount(where: Prisma.CompetitionWhereInput) {
    return prisma.competition.count({
      where,
    });
  }

  static async countByStatus(status: Prisma.CompetitionWhereInput["status"]) {
    return prisma.competition.count({
      where: {
        status,
        deletedAt: null,
      },
    });
  }

  static async countByVisibility(
    visibility: Prisma.CompetitionWhereInput["visibility"],
  ) {
    return prisma.competition.count({
      where: {
        visibility,
        deletedAt: null,
      },
    });
  }

  /**
   * Converts sort options into Prisma orderBy.
   */
  // private static getOrderBy(
  //   sort: FindCompetitionsOptions["sort"],
  // ): Prisma.CompetitionOrderByWithRelationInput {
  //   switch (sort) {
  //     case "deadline":
  //       return {
  //         registrationDeadline: "asc",
  //       };

  //     case "newest":
  //       return {
  //         createdAt: "desc",
  //       };

  //     case "start-date":
  //     default:
  //       return {
  //         startDate: "asc",
  //       };
  //   }
  // }
}

// export const competitionRepository = new CompetitionRepository();
