import type { Prisma } from "@/generated/prisma";

import type { CompetitionSearchInput } from "./schema";

import { CompetitionWhereBuilder } from "./where";
import { CompetitionOrderByBuilder } from "./order-by";
import { CompetitionPaginationBuilder } from "./pagination";

export interface CompetitionSearchQuery {
  where: Prisma.HackathonWhereInput;
  orderBy: Prisma.HackathonOrderByWithRelationInput;
  skip: number;
  take: number;
}

export class CompetitionSearchBuilder {
  /**
   * ===========================================================================
   * Build Prisma Query
   * ===========================================================================
   */

  static build(
    filters: CompetitionSearchInput,
  ): CompetitionSearchQuery {
    return {
      where: CompetitionWhereBuilder.build(filters),

      orderBy: CompetitionOrderByBuilder.build(
        filters.sort,
      ),

      ...CompetitionPaginationBuilder.build(
        filters,
      ),
    };
  }
}