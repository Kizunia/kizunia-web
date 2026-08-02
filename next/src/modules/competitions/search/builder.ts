import type { Prisma } from "@/generated/prisma";

import type { CompetitionSearchInput } from "./schema";

import { CompetitionOrderByBuilder } from "./order-by";
import { CompetitionPaginationBuilder } from "./pagination";

// import { CompetitionWhereBuilder } from "./where";
import { PublicCompetitionWhereBuilder } from "./public-where";
import { ManagementCompetitionWhereBuilder } from "./management-where";
import { AdminCompetitionWhereBuilder } from "./admin-where";

export interface CompetitionSearchQuery {
  where: Prisma.CompetitionWhereInput;
  orderBy: Prisma.CompetitionOrderByWithRelationInput;
  skip: number;
  take: number;
}

export class CompetitionSearchBuilder {
  /**
   * Public competition search.
   */
  static build(
    filters: CompetitionSearchInput,
  ): CompetitionSearchQuery {
    return {
      where: PublicCompetitionWhereBuilder.build(filters),

      orderBy: CompetitionOrderByBuilder.build(filters.sort),

      ...CompetitionPaginationBuilder.build(filters),
    };
  }

  /**
   * Public search using the new builder.
   *
   * Temporary wrapper while we migrate away from `where.ts`.
   */
  // static buildPublic(
  //   filters: CompetitionSearchInput,
  // ): CompetitionSearchQuery {
  //   return {
  //     where: PublicCompetitionWhereBuilder.build(filters),

  //     orderBy: CompetitionOrderByBuilder.build(filters.sort),

  //     ...CompetitionPaginationBuilder.build(filters),
  //   };
  // }

  /**
 * Management competition search.
 */
static buildManagement(
  actorId: string,
  filters: CompetitionSearchInput,
): CompetitionSearchQuery {
  return {
    where: ManagementCompetitionWhereBuilder.build(
      actorId,
      filters,
    ),

    orderBy: CompetitionOrderByBuilder.build(
      filters.sort,
    ),

    ...CompetitionPaginationBuilder.build(
      filters,
    ),
  };
}

/**
 * Admin competition search.
 */
static buildAdmin(
  filters: CompetitionSearchInput,
): CompetitionSearchQuery {
  return {
    where: AdminCompetitionWhereBuilder.build(
      filters,
    ),

    orderBy: CompetitionOrderByBuilder.build(
      filters.sort,
    ),

    ...CompetitionPaginationBuilder.build(
      filters,
    ),
  };
}
}