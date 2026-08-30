import type { Prisma } from "@/generated/prisma";
import { buildSearchQuery, type RawSearchParams } from "@/lib/search";

import { competitionSearchDefinition } from "./definition";

export interface CompetitionSearchQuery {
  where: Prisma.CompetitionWhereInput;
  orderBy: Prisma.CompetitionOrderByWithRelationInput[];
  skip: number;
  take: number;
}

const BASE_CLAUSES: readonly Prisma.CompetitionWhereInput[] = [
  { deletedAt: null },
];

/**
 * Thin adapter from the repository's call shape onto the shared
 * `src/lib/search` engine + `competitionSearchDefinition` registry.
 *
 * Kept as a class with the same three static methods the legacy
 * hand-written builder had, so `CompetitionRepository` did not need to
 * change beyond its parameter type (`CompetitionSearchInput` →
 * `RawSearchParams`). See
 * docs/project/feature-specification/search/05-implementation-plan.md
 * for the migration this completes.
 */
export class CompetitionSearchBuilder {
  static build(filters: RawSearchParams): CompetitionSearchQuery {
    return buildSearchQuery({
      definition: competitionSearchDefinition,
      params: filters,
      scope: "public",
      context: {},
      baseClauses: BASE_CLAUSES,
    });
  }

  static buildManagement(
    actorId: string,
    filters: RawSearchParams,
  ): CompetitionSearchQuery {
    return buildSearchQuery({
      definition: competitionSearchDefinition,
      params: filters,
      scope: "management",
      context: { actorId },
      baseClauses: BASE_CLAUSES,
    });
  }

  static buildAdmin(filters: RawSearchParams): CompetitionSearchQuery {
    return buildSearchQuery({
      definition: competitionSearchDefinition,
      params: filters,
      scope: "admin",
      context: {},
      baseClauses: BASE_CLAUSES,
    });
  }
}
