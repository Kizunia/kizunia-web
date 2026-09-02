/**
 * Search Core - Engine
 *
 * Ties filters, scope, sort and pagination together into one Prisma-ready
 * query. This is the only place that composes a `where` clause; modules
 * never build one by hand.
 *
 * Composition order (mirrors `CompetitionWhereBuilder` exactly):
 *
 *   composeAnd([
 *     ...baseClauses,          // e.g. deletedAt: null
 *     ...filterClauses,        // one per supplied, scope-allowed filter
 *     ...scope.guard(context), // visibility / ownership — always last
 *   ])
 */

import type { AndComposable } from "./compose";
import { composeAnd } from "./compose";
import type { SearchScope } from "./scope";
import { filterKeysForScope, UnknownScopeError } from "./scope";
import type { SortRegistry } from "./sort";
import { resolveSort } from "./sort";
import type { PaginationConfig } from "./pagination";
import {
  parsePagination,
  toSkipTake,
} from "./pagination";
import type { BoundFilter, RawSearchParams } from "./types";

export class InvalidSearchDefinitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidSearchDefinitionError";
  }
}

/** Parameters no filter may claim — they belong to pagination/sorting. */
const RESERVED_KEYS = new Set(["page", "limit", "sort"]);

export interface SearchDefinition<TWhere, TOrderBy, TContext> {
  readonly entity: string;
  readonly filters: readonly BoundFilter<TWhere>[];
  readonly sorts: SortRegistry<TOrderBy>;
  readonly scopes: Readonly<Record<string, SearchScope<TWhere, TContext>>>;
  readonly pagination?: PaginationConfig;
}

export interface SearchQuery<TWhere, TOrderBy> {
  readonly where: TWhere;
  readonly orderBy: TOrderBy[];
  readonly skip: number;
  readonly take: number;
}

/**
 * Validates a definition at construction time rather than at first use, so
 * a mistake surfaces immediately (module load / test run) instead of in a
 * production request.
 */
export function defineSearch<TWhere extends AndComposable<TWhere>, TOrderBy, TContext>(
  definition: SearchDefinition<TWhere, TOrderBy, TContext>,
): SearchDefinition<TWhere, TOrderBy, TContext> {
  const seenFilterKeys = new Set<string>();

  // Every URL parameter claimed by any filter. Checked separately from
  // `key` because a filter's owned parameters can be derived rather than
  // equal to its key — `dateRangeFilter({ key: "startDate" })` owns
  // `startDateFrom` and `startDateTo`. Two filters could therefore fight
  // over the same URL parameter while having distinct keys.
  const seenParams = new Map<string, string>();

  for (const filter of definition.filters) {
    if (seenFilterKeys.has(filter.key)) {
      throw new InvalidSearchDefinitionError(
        `[${definition.entity}] duplicate filter key "${filter.key}".`,
      );
    }

    seenFilterKeys.add(filter.key);

    for (const param of filter.keys) {
      if (RESERVED_KEYS.has(param)) {
        throw new InvalidSearchDefinitionError(
          `[${definition.entity}] filter "${filter.key}" claims URL parameter "${param}", ` +
            `which is reserved (page/limit/sort).`,
        );
      }

      const owner = seenParams.get(param);

      if (owner !== undefined) {
        throw new InvalidSearchDefinitionError(
          `[${definition.entity}] filters "${owner}" and "${filter.key}" both claim URL parameter "${param}".`,
        );
      }

      seenParams.set(param, filter.key);
    }
  }

  for (const [scopeId, scope] of Object.entries(definition.scopes)) {
    const guardedKeys = scope.guardedKeys ?? [];

    for (const key of guardedKeys) {
      if (seenFilterKeys.has(key) || seenParams.has(key)) {
        throw new InvalidSearchDefinitionError(
          `[${definition.entity}] scope "${scopeId}" guards "${key}", but a filter of the same key is also registered. ` +
            `Visibility/ownership must be enforced by the scope, not requestable as a filter.`,
        );
      }
    }
  }

  if (Object.keys(definition.scopes).length === 0) {
    throw new InvalidSearchDefinitionError(
      `[${definition.entity}] must declare at least one scope — there is no unscoped entry point.`,
    );
  }

  return definition;
}

export interface BuildSearchQueryArgs<TWhere, TOrderBy, TContext> {
  readonly definition: SearchDefinition<TWhere, TOrderBy, TContext>;
  readonly params: RawSearchParams;
  readonly scope: string;
  readonly context: TContext;

  /** Always ANDed first, e.g. `{ deletedAt: null }`. */
  readonly baseClauses?: readonly TWhere[];
}

export function buildSearchQuery<
  TWhere extends AndComposable<TWhere>,
  TOrderBy,
  TContext,
>(
  args: BuildSearchQueryArgs<TWhere, TOrderBy, TContext>,
): SearchQuery<TWhere, TOrderBy> {
  const { definition, params, context } = args;

  const scope = definition.scopes[args.scope];

  if (!scope) {
    throw new UnknownScopeError(args.scope, definition.entity);
  }

  const allowedKeys = filterKeysForScope(
    scope,
    definition.filters.map((filter) => filter.key),
  );
  const allowedKeySet = new Set(allowedKeys);

  const filterClauses: TWhere[] = [];

  for (const filter of definition.filters) {
    if (!allowedKeySet.has(filter.key)) {
      continue;
    }

    const clause = filter.toWhereFromParams(params);

    if (clause !== undefined) {
      filterClauses.push(clause);
    }
  }

  const where = composeAnd<TWhere>([
    ...(args.baseClauses ?? []),
    ...filterClauses,
    ...scope.guard(context),
  ]);

  const orderBy = resolveSort(definition.sorts, normalizeSortToken(params.sort));

  const pagination = parsePagination(params, definition.pagination);
  const { skip, take } = toSkipTake(pagination);

  return { where, orderBy, skip, take };
}

function normalizeSortToken(
  raw: string | string[] | undefined,
): string | undefined {
  return Array.isArray(raw) ? raw[0] : raw;
}

/**
 * The filters a caller may see/set in a given scope, in registry order —
 * what the frontend iterates to render Quick/Advanced filter UI. Excludes
 * anything the scope has stripped via `allowedFilters`.
 */
export function filtersForScope<TWhere, TOrderBy, TContext>(
  definition: SearchDefinition<TWhere, TOrderBy, TContext>,
  scopeId: string,
): readonly BoundFilter<TWhere>[] {
  const scope = definition.scopes[scopeId];

  if (!scope) {
    throw new UnknownScopeError(scopeId, definition.entity);
  }

  const allowedKeys = new Set(
    filterKeysForScope(
      scope,
      definition.filters.map((filter) => filter.key),
    ),
  );

  return definition.filters.filter((filter) => allowedKeys.has(filter.key));
}
