import prisma from "@/lib/prisma";
import type { CreateHackathonInput } from "../schemas/create-hackathon";
import type { Prisma } from "@/generated/prisma";

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
  async findMany(filters: FindCompetitionsRepositoryParams) {
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

  static async create(
        data: CreateHackathonInput,
    ) {
        console.log("");
        console.log("========================================");
        console.log("🗄️ HACKATHON REPOSITORY");
        console.log("========================================");

        console.log("Creating database record...");

        const hackathon = await prisma.hackathon.create({
            data: {
                title: data.title,
                slug: data.slug,

                shortDescription:
                    data.shortDescription || null,

                organizer:
                    data.organizer || null,

                website:
                    data.website || null,

                registrationLink:
                    data.registrationLink || null,
            },
        });

        console.log("");
        console.log("✅ Database insert complete.");

        console.dir(hackathon, {
            depth: null,
        });

        return hackathon;
    }

  /**
   * Converts sort options into Prisma orderBy.
   */
  private getOrderBy(
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

export const hackathonRepository =
  new HackathonRepository();