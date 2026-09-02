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
 * Conditions resolved before the query is built and applied unconditionally.
 *
 * The location restriction arrives this way rather than as a registry filter,
 * because a filter that decodes to nothing is dropped by the engine — which
 * would turn "this place has no competitions" into "return everything". Base
 * clauses cannot be dropped.
 *
 * Both `findMany` and `count` must be given the same value, or totals and rows
 * disagree; `CompetitionService` resolves once and passes the same array to both.
 */
export type ExtraBaseClauses = readonly Prisma.CompetitionWhereInput[];

function withExtras(extra?: ExtraBaseClauses) {
  return extra && extra.length > 0 ? [...BASE_CLAUSES, ...extra] : BASE_CLAUSES;
}

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
  static build(
    filters: RawSearchParams,
    extraBaseClauses?: ExtraBaseClauses,
  ): CompetitionSearchQuery {
    return buildSearchQuery({
      definition: competitionSearchDefinition,
      params: filters,
      scope: "public",
      context: {},
      baseClauses: withExtras(extraBaseClauses),
    });
  }

  static buildManagement(
    actorId: string,
    filters: RawSearchParams,
    extraBaseClauses?: ExtraBaseClauses,
  ): CompetitionSearchQuery {
    return buildSearchQuery({
      definition: competitionSearchDefinition,
      params: filters,
      scope: "management",
      context: { actorId },
      baseClauses: withExtras(extraBaseClauses),
    });
  }

  static buildAdmin(
    filters: RawSearchParams,
    extraBaseClauses?: ExtraBaseClauses,
  ): CompetitionSearchQuery {
    return buildSearchQuery({
      definition: competitionSearchDefinition,
      params: filters,
      scope: "admin",
      context: {},
      baseClauses: withExtras(extraBaseClauses),
    });
  }
}
