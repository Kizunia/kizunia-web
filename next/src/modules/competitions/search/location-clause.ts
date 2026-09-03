import { CompetitionMode, type Prisma } from "@/generated/prisma";

type CompetitionWhere = Prisma.CompetitionWhereInput;

/**
 * A condition no competition can satisfy.
 *
 * Prisma treats `{ in: [] }` as matching zero rows — the property that makes
 * this work, and the same property that makes an accidental empty `in`
 * elsewhere so dangerous. Here it is exactly what is wanted: a location that
 * resolved successfully but matched no stored area must produce an explicit
 * empty result, not an absent restriction.
 *
 * That is the difference between "no competitions here" and "here is
 * everything", and it is the single most important line in this file.
 */
const MATCHES_NOTHING: CompetitionWhere = { id: { in: [] } };

export interface LocationClauseInput {
  /** Search areas the selected place resolved to. May legitimately be empty. */
  readonly searchAreaIds: readonly string[];

  /** Whether online competitions should be returned alongside the place. */
  readonly includeOnline: boolean;
}

/**
 * Builds the restriction for a resolved location.
 *
 * Always returns a clause. There is no "no restriction" outcome, because this
 * is only ever called once a place has actually been selected and resolved —
 * `bindResolvableFilter` handles the absent case before reaching here.
 *
 * The clause is applied as a *base* clause rather than a filter clause, so it
 * cannot be dropped by the engine's "empty means absent" rule. See the note in
 * `src/lib/search/resolve.ts` for why that distinction exists.
 *
 * Matching is by search-area id and never by text. Containment was
 * materialized at ingestion, so selecting a city matches every location that
 * recorded a link to it, while selecting a neighbourhood matches only
 * locations linked to that neighbourhood — expansion runs downward, never up
 * or sideways.
 */
export function buildLocationClause(
  input: LocationClauseInput,
): CompetitionWhere {
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
  // geographic condition. Including them is an explicit user choice rather
  // than something the location filter decides on their behalf — and it still
  // holds when the place matched nothing, which correctly yields online-only
  // results rather than an empty page.
  return input.includeOnline
    ? { OR: [geographic, { mode: CompetitionMode.ONLINE }] }
    : geographic;
}
