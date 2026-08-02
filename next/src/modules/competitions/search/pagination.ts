export const DEFAULT_PAGE = 1;

export const DEFAULT_LIMIT = 20;

export const MAX_LIMIT = 100;

import type { CompetitionSearchInput } from "./schema";

export interface CompetitionPagination {
  skip: number;
  take: number;
}

export class CompetitionPaginationBuilder {
  static build(
    filters: CompetitionSearchInput,
  ): CompetitionPagination {
    return {
      skip: (filters.page - 1) * filters.limit,

      take: filters.limit,
    };
  }
}