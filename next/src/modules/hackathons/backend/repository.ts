import prisma from "@/lib/prisma";
import type { CreateHackathonInput } from "../schemas/create-hackathon";
import type { Prisma } from "@/generated/prisma";
import { UpdateHackathonInput } from "../schemas/update-hackathon";

interface FindCompetitionsRepositoryParams {
  search?: string;

  mode?: Prisma.HackathonWhereInput["mode"];

  status?: Prisma.HackathonWhereInput["status"];

  category?: string;

  technology?: string;

  sort?: "start-date" | "deadline" | "newest";

  skip: number;

  take: number;
}

export class HackathonRepository {
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
  static async findMany(filters: FindCompetitionsRepositoryParams) {
    const where: Prisma.HackathonWhereInput = {
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
    return await prisma.hackathon.findUnique({
      where: {
        slug,
      },
    });
  }

  static async findById(id: string) {
    return prisma.hackathon.findUnique({
      where: {
        id,
      },
    });
  }

  static async isSlugTaken(slug: string): Promise<boolean> {
    const exists = await prisma.hackathon.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
      },
    });

    return exists !== null;
  }

  static async create(data: CreateHackathonInput) {
    console.log("");
    console.log("========================================");
    console.log("🗄️ HACKATHON REPOSITORY");
    console.log("========================================");

    console.log("Creating database record...");

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

    console.log("");
    console.log("✅ Database insert complete.");

    console.dir(hackathon, {
      depth: null,
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

  /**
   * Converts sort options into Prisma orderBy.
   */
  private static getOrderBy(
    sort: FindCompetitionsRepositoryParams["sort"],
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
