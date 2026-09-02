import { CompetitionMode, type Prisma } from "@/generated/prisma";

type CompetitionWhere = Prisma.CompetitionWhereInput;

/**
 * A condition no competition can satisfy.
 *
 * Used when a location filter was genuinely requested but matched nothing, so
 * the result is an explicit empty set rather than an absent restriction. This
 * is the difference between "no competitions here" and "here is everything".
 */
const MATCHES_NOTHING: CompetitionWhere = { id: { in: [] } };

export interface LocationClauseInput {
  /** Whether a location filter was requested at all. */
  readonly requested: boolean;

  /** Search areas the selected place resolved to. May be empty. */
  readonly searchAreaIds: readonly string[];

  /** Whether online competitions should be returned alongside the location. */
  readonly includeOnline: boolean;
}

/**
 * Builds the location restriction as a base clause.
 *
 * Returns `undefined` only when no location was requested — the one case where
 * results genuinely should not be restricted. Every other case yields a real
 * clause, including the empty one, which is what keeps a zero-match search from
 * silently widening to the whole platform.
 *
 * Matching is by search-area id and never by text. Containment was materialized
 * at ingestion, so selecting a city matches every location that recorded a link
 * to it, while selecting a neighbourhood matches only locations linked to that
 * neighbourhood — expansion runs downward, never up or sideways.
 */
export function buildLocationClause(
  input: LocationClauseInput,
): CompetitionWhere | undefined {
  if (!input.requested) {
    return undefined;
  }

  const geographic: CompetitionWhere =
    input.searchAreaIds.length > 0
      ? {
          locations: {
            some: {
              location: {
                searchAreas: {
                  some: { searchAreaId: { in: [...input.searchAreaIds] } },
                },
              },
            },
          },
        }
      : MATCHES_NOTHING;

  // Online competitions have no location, so they can never satisfy a
  // geographic condition. Including them is an explicit user choice rather than
  // something the location filter decides on their behalf — and it still holds
  // when the place matched nothing, which correctly yields online-only results.
  return input.includeOnline
    ? { OR: [geographic, { mode: CompetitionMode.ONLINE }] }
    : geographic;
}
