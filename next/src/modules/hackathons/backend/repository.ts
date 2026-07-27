import prisma from "@/lib/prisma";
import type { CreateHackathonInput } from "../schemas/create-hackathon";
import type { Prisma } from "@/generated/prisma";
import { UpdateHackathonInput } from "../schemas/update-hackathon";
import { NotFoundError } from "@/lib/errors";
import type { CompetitionSearchOptions } from "../search/types";
import { CompetitionSearchInput } from "../search/schema";
import { CompetitionSearchBuilder } from "../search/builder";
import { HackathonAssetSlot } from "../types/asset-slot";

// interface FindCompetitionsOptions {
//   search?: string;

//   mode?: Prisma.HackathonWhereInput["mode"];

//   status?: Prisma.HackathonWhereInput["status"];

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
  //   const where: Prisma.HackathonWhereInput = {
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

  //   return prisma.hackathon.findMany({
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

    return prisma.hackathon.findMany({
      ...query,

      include: {
        logoAsset: true,
        coverAsset: true,
      },
    });
  }

  static async findBySlug(slug: string) {
    return prisma.hackathon.findFirst({
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
    Prisma.HackathonGetPayload<{
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
      throw new NotFoundError({
        code: "competition_not_found",
        message: `Competition with given slug not found.`,
      });
    }
    return competition;
  }

  static async findById(id: string) {
    return prisma.hackathon.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
  }

  static async findByIdOrThrow(id: string) {
    const competition = await this.findById(id);

    if (!competition) {
      throw new NotFoundError({
        code: "competition_not_found",
        message: `Competition with given id not found.`,
      });
    }

    return competition;
  }

  static async findByIdForEdit(
  id: string,
  db: Prisma.TransactionClient | Prisma.DefaultPrismaClient = prisma,
) {
   const competition = await db.hackathon.findFirst({
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
      throw new NotFoundError({
        code: "competition_not_found",
        message: "Competition not found.",
      });
    }

    return competition;
  }

  static async existsBySlug(slug: string): Promise<boolean> {
    const exists = await prisma.hackathon.findUnique({
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

  static async existsById(id: string): Promise<boolean> {
    const exists = await prisma.hackathon.findUnique({
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
  static async create({ data }: { data: CreateHackathonInput }) {
    const hackathon = await prisma.hackathon.create({
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

    return hackathon;
  }

  static async update({
    id,
    data,
  }: {
    id: string;
    data: UpdateHackathonInput;
  }) {
    const { content, ...rest } = data;

    return prisma.$transaction(async (tx) => {
      const hackathon = await tx.hackathon.findUnique({
        where: {
          id,
        },
        select: {
          contentId: true,
        },
      });

      if (!hackathon) {
        throw new NotFoundError({
          code: "competition_not_found",
          message: "Competition not found.",
        });
      }

      let contentId = hackathon.contentId;

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
      // Update hackathon
      // ------------------------------------------------------------

      return tx.hackathon.update({
        where: {
          id,
        },
        data: {
          ...rest,

          ...(contentId !== hackathon.contentId && {
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
    hackathonId: string,
    assetId: string,
  ) {
    return tx.hackathon.update({
      where: {
        id: hackathonId,
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
  hackathonId: string,
  slot: HackathonAssetSlot,
  assetId: string,
) {
  const relationField = {
    logo: "logoAsset",
    banner: "bannerAsset",
    cover: "coverAsset",
  } as const;

  return tx.hackathon.update({
    where: {
      id: hackathonId,
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

  static async delete(id: string) {
    // TODO: Soft delete is not fully implemented yet.
    return prisma.hackathon.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  static async restore(id: string) {
    return prisma.hackathon.update({
      where: {
        id,
      },
      data: {
        deletedAt: null,
      },
    });
  }

  static async findMembership(hackathonId: string, userId: string) {
    return prisma.hackathonMember.findUnique({
      where: {
        hackathonId_userId: {
          hackathonId,
          userId,
        },
      },
    });
  }

  static async findMembers(hackathonId: string) {
    return prisma.hackathonMember.findMany({
      where: {
        hackathonId,
      },
    });
  }

  static async findOwners(hackathonId: string) {
    return prisma.hackathonMember.findMany({
      where: {
        hackathonId,
        role: "OWNER",
      },
    });
  }

  static async search(query: string) {
    return prisma.hackathon.findMany({
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

    return prisma.hackathon.count({
      where,
    });
  }

  static async searchCount(where: Prisma.HackathonWhereInput) {
    return prisma.hackathon.count({
      where,
    });
  }

  static async countByStatus(status: Prisma.HackathonWhereInput["status"]) {
    return prisma.hackathon.count({
      where: {
        status,
        deletedAt: null,
      },
    });
  }

  static async countByVisibility(
    visibility: Prisma.HackathonWhereInput["visibility"],
  ) {
    return prisma.hackathon.count({
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
  // ): Prisma.HackathonOrderByWithRelationInput {
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

// export const hackathonRepository = new HackathonRepository();
