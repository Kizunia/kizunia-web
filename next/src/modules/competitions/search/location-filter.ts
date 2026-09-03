/**
 * Competitions - Location as a registered, resolvable filter
 *
 * =============================================================================
 * Why this file exists
 * =============================================================================
 *
 * Location used to be handled by hand inside `CompetitionService.search`:
 * the service read `placeId` straight out of the raw parameters, resolved it,
 * built a clause and passed it along. That worked, and it had three defects
 * that were structural rather than incidental.
 *
 * 1. The registry did not know about it. Anything driven by the registry —
 *    the active-filter chips, Clear all, URL canonicalisation — was blind to
 *    location. A Clear all built on the registry would have left the user
 *    still filtered to a city, with no chip on screen explaining why.
 *
 * 2. Only one of three scopes applied it. `searchManageable` and
 *    `searchAdmin` never called the resolution step, so a `placeId` sent to
 *    the management or admin listing was accepted and silently discarded.
 *    Every new scope would have had to remember to opt in.
 *
 * 3. There was no shape for the next filter like it. Radius search, or any
 *    future filter needing a lookup, would have been a second hand-rolled
 *    special case in the service.
 *
 * Registering it as a resolvable filter fixes all three at once, and does so
 * by removing code rather than adding a special case: the service now resolves
 * whatever the registry declares, and location is simply the one entry that
 * currently exists.
 */

import type { Prisma } from "@/generated/prisma";
import {
  bindResolvableFilter,
  resolutionFailed,
  resolved,
  type BoundResolvableFilter,
  type FilterResolution,
  type PlaceSpec,
  type PlaceValue,
} from "@/lib/search";
import { PlaceMatchService } from "@/modules/locations";

import { buildLocationClause } from "./location-clause";
import { competitionFilterSpecs } from "./ui";

type CompetitionWhere = Prisma.CompetitionWhereInput;

/** What resolving a place yields: the areas a search should match. */
interface ResolvedPlace {
  readonly searchAreaIds: readonly string[];
}

/**
 * Consults the place service.
 *
 * Never throws. A provider outage returns `FAILED` with the provider's own
 * reason, so the caller can distinguish "we could not find out" from "there is
 * nothing there" and answer each honestly. Throwing would collapse that
 * distinction into a generic error, and the most likely handling of a generic
 * error — render an empty list — is precisely the wrong answer.
 *
 * An empty `searchAreaIds` is a *success*. It means the place is real, the
 * lookup worked, and no competition has been recorded there yet. That produces
 * an unsatisfiable clause and an honest empty page.
 */
async function resolvePlace(
  value: PlaceValue,
): Promise<FilterResolution<ResolvedPlace>> {
  const resolution = await PlaceMatchService.resolve({ placeId: value.id });

  if (resolution.status === "RESOLUTION_FAILED") {
    return resolutionFailed(resolution.reason);
  }

  return resolved({ searchAreaIds: resolution.searchAreaIds });
}

/**
 * The location filter, bound and ready for the registry.
 *
 * Note that `toWhere` receives both the resolution and the original decoded
 * value. The area ids come from the lookup; `includeOnline` is a modifier the
 * user set that survives resolution untouched. Keeping both available is why
 * `ResolvableFilterDescriptor.toWhere` takes two arguments — a filter's
 * modifiers should not have to be smuggled through its resolution result.
 */
export const competitionLocationFilter: BoundResolvableFilter<CompetitionWhere> =
  bindResolvableFilter<CompetitionWhere, PlaceSpec, ResolvedPlace>({
    spec: competitionFilterSpecs.location,

    resolve: resolvePlace,

    toWhere: (resolvedPlace, value) =>
      buildLocationClause({
        searchAreaIds: resolvedPlace.searchAreaIds,
        includeOnline: value.includeOnline,
      }),
  });
