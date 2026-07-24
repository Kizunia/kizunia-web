import prisma from "@/lib/prisma";
import type { CreateHackathonInput } from "../schemas/create-hackathon";
import type { Prisma } from "@/generated/prisma";
import { UpdateHackathonInput } from "../schemas/update-hackathon";
import { NotFoundError } from "@/lib/errors";

interface FindCompetitionsOptions {
  search?: string;

  mode?: Prisma.HackathonWhereInput["mode"];

  status?: Prisma.HackathonWhereInput["status"];

  category?: string;

  technology?: string;

  sort?: "start-date" | "deadline" | "newest";

  skip: number;

  take: number;
}

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
  static async findMany(filters: FindCompetitionsOptions) {
    const where: Prisma.HackathonWhereInput = {
      deletedAt: null,
      ...(filters.search && {
        OR: [
          {
            title: {
              contains: filters.search,
              mode: "insensitive",
            },
          },
          {
            organizer: {
              contains: filters.search,
              mode: "insensitive",
            },
          },
        ],
      }),

      ...(filters.mode && {
        mode: filters.mode,
      }),

      ...(filters.status && {
        status: filters.status,
      }),

      ...(filters.category && {
        categories: {
          some: {
            category: {
              slug: filters.category,
            },
          },
        },
      }),

      ...(filters.technology && {
        technologies: {
          some: {
            technology: {
              slug: filters.technology,
            },
          },
        },
      }),
    };

    return prisma.hackathon.findMany({
      where,

      include: {
        logoAsset: true,
        coverAsset: true,
      },

      orderBy: this.getOrderBy(filters.sort),

      skip: filters.skip,

      take: filters.take,
    });
  }

  static async findBySlug(slug: string) {
    return prisma.hackathon.findFirst({
      where: {
        slug,
        deletedAt: null,
      },
    });
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
    return prisma.hackathon.update({
      where: {
        id,
      },
      data,
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

  static async count(where?: Prisma.HackathonWhereInput): Promise<number> {
    return prisma.hackathon.count({
      where: {
        deletedAt: null,
        ...where,
      },
    });
  }

  /**
   * Converts sort options into Prisma orderBy.
   */
  private static getOrderBy(
    sort: FindCompetitionsOptions["sort"],
  ): Prisma.HackathonOrderByWithRelationInput {
    switch (sort) {
      case "deadline":
        return {
          registrationDeadline: "asc",
        };

      case "newest":
        return {
          createdAt: "desc",
        };

      case "start-date":
      default:
        return {
          startDate: "asc",
        };
    }
  }
}

// export const hackathonRepository = new HackathonRepository();
