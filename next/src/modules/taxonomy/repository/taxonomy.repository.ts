import { Prisma } from "@/generated/prisma";
import prisma from "@/lib/prisma";

import type { TaxonomyQuery } from "../schemas/taxonomy-query";

/**
 * Counts only competitions a public search could actually return.
 *
 * If this diverged from the public scope's guard, an option would advertise a
 * count and then return fewer — or zero — results, which reads as a bug in
 * search rather than as a difference in visibility rules. Kept alongside the
 * scope guard in `competitions/search/definition.ts`; the two must move
 * together.
 */
const PUBLICLY_VISIBLE: Prisma.CompetitionWhereInput = {
  deletedAt: null,
  visibility: "PUBLIC",
};

export class TaxonomyRepository {
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

  static async findCategories(query: TaxonomyQuery) {
    return prisma.category.findMany({
      where: this.nameFilter(query),

      select: {
        name: true,
        slug: true,
        _count: {
          select: {
            competitions: {
              where: { competition: PUBLICLY_VISIBLE },
            },
          },
        },
      },

      orderBy: { name: "asc" },

      take: query.limit,
    });
  }

  static async findTechnologies(query: TaxonomyQuery) {
    return prisma.technology.findMany({
      where: this.nameFilter(query),

      select: {
        name: true,
        slug: true,
        _count: {
          select: {
            competitions: {
              where: { competition: PUBLICLY_VISIBLE },
            },
          },
        },
      },

      orderBy: { name: "asc" },

      take: query.limit,
    });
  }

  /**
   * Narrows by name when a query was supplied.
   *
   * Filtering happens here rather than after loading because a taxonomy is
   * unbounded in principle — the picker must stay responsive as it grows.
   */
  private static nameFilter(query: TaxonomyQuery) {
    if (!query.q) {
      return {};
    }

    return {
      name: {
        contains: query.q,
        mode: Prisma.QueryMode.insensitive,
      },
    };
  }
}
