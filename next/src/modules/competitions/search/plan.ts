/**
 * Competitions - Search planning
 *
 * =============================================================================
 * The invariant this module makes structural
 * =============================================================================
 *
 * A listing runs two queries against the same predicate: one for the rows, one
 * for the total. If the two are built independently, they can differ — and a
 * total that disagrees with the rows produces a pager to a page that does not
 * exist, intermittently and only under the conditions that caused the drift.
 *
 * With a resolvable filter in play, that risk stops being theoretical. Two
 * independent resolutions of the same place could straddle a cache expiry and
 * legitimately return different area sets.
 *
 * So resolution does not happen in the repository. It happens once, here,
 * producing a `CompetitionSearchPlan`; the repository accepts a plan and has
 * no way to obtain raw parameters, and therefore no way to resolve anything a
 * second time. The invariant is enforced by the type, not by remembering.
 *
 * =============================================================================
 * Where failure is handled
 * =============================================================================
 *
 * Planning is the only step that can fail for an external reason, and it fails
 * loudly. A location lookup that could not complete raises
 * `LOCATION_RESOLUTION_FAILED` rather than degrading to an unfiltered or empty
 * search: "we could not find out" must never be presented as "there is nothing
 * there".
 */

import type { Prisma } from "@/generated/prisma";
import { ExternalServiceError } from "@/lib/errors";
import {
  buildSearchQuery,
  readFilterValue,
  resolvableFiltersForScope,
  resolveBaseClauses,
  type RawSearchParams,
} from "@/lib/search";

import { CompetitionErrorCode } from "../errors/error-code";
import {
  competitionSearchDefinition,
  type CompetitionSearchContext,
} from "./definition";
import { RECORD_STATE_SPEC } from "./ui";

type CompetitionWhere = Prisma.CompetitionWhereInput;

/** The scopes the Competition registry declares. */
export type CompetitionSearchScope = "public" | "management" | "admin";

/**
 * Soft-deleted-row visibility, per request.
 *
 * =============================================================================
 * Why this is scope-gated here and not left to the filter registry
 * =============================================================================
 *
 * For `public` and `management` this returns the exact same fixed clause the
 * old `INVARIANT_CLAUSES` constant always did — unconditionally, without ever
 * reading `params`. That last part matters: this function does not decide
 * "is `recordState` an allowed filter for this scope and did the caller
 * supply one" and then act on it. It decides "is this the admin scope" FIRST,
 * and every branch below that check is unreachable for anything else. A
 * request built by hand against `/api/v1/competitions` with
 * `?recordState=DELETED` cannot influence this function at all — the
 * parameter is never even inspected outside the `admin` branch.
 *
 * `RECORD_STATE_SPEC` is also never added to `COMPETITION_FILTER_SPECS`
 * (see `ui.ts`), so it cannot appear in the public/management filter UI or
 * chip list either. The two protections are independent: this function is
 * what stops a crafted request; spec exclusion is what stops the UI from
 * ever offering the control in the first place.
 *
 * Soft-deleted rows are therefore not "filtered out" for non-admin scopes —
 * they are not part of the entity's visible universe at all, which is why
 * this contributes a base clause rather than an ordinary, droppable filter.
 */
function deletionClauses(
  scope: CompetitionSearchScope,
  params: RawSearchParams,
): readonly CompetitionWhere[] {
  if (scope !== "admin") {
    return [{ deletedAt: null }];
  }

  const state = readFilterValue(RECORD_STATE_SPEC, params);

  const wantsActive = state?.includes("ACTIVE") ?? false;
  const wantsDeleted = state?.includes("DELETED") ?? false;

  if (wantsDeleted && !wantsActive) {
    return [{ deletedAt: { not: null } }];
  }

  if (wantsActive && wantsDeleted) {
    // Both explicitly selected: no restriction on deletion state at all.
    return [];
  }

  // Absent, or ACTIVE alone: today's default, unchanged.
  return [{ deletedAt: null }];
}

/**
 * A fully resolved, ready-to-execute search.
 *
 * Deliberately carries no raw parameters beyond what the pure builder still
 * needs, and carries its base clauses already computed. Handing this to two
 * repository methods guarantees they build byte-identical `where` clauses.
 */
export interface CompetitionSearchPlan {
  readonly scope: CompetitionSearchScope;

  readonly params: RawSearchParams;

  readonly context: CompetitionSearchContext;

  /** Invariants plus every resolved clause, in composition order. */
  readonly baseClauses: readonly CompetitionWhere[];
}

export interface PlanCompetitionSearchArgs {
  readonly scope: CompetitionSearchScope;

  readonly params: RawSearchParams;

  readonly context?: CompetitionSearchContext;
}

/**
 * Resolves every resolvable filter for one request and returns an executable
 * plan.
 *
 * Scope-aware: `resolvableFiltersForScope` applies the same `allowedFilters`
 * rule to resolvable filters as to ordinary ones, so a scope that narrows what
 * may be filtered narrows both kinds consistently. With all three Competition
 * scopes currently allowing everything, location applies uniformly — which is
 * the intended behaviour and no longer something each service method has to
 * opt into.
 *
 * @throws ExternalServiceError when a lookup could not be completed.
 */
export async function planCompetitionSearch(
  args: PlanCompetitionSearchArgs,
): Promise<CompetitionSearchPlan> {
  const context = args.context ?? {};

  const resolvable = resolvableFiltersForScope(
    competitionSearchDefinition,
    args.scope,
  );

  const resolution = await resolveBaseClauses(resolvable, args.params);

  if (resolution.status === "FAILED") {
    throw new ExternalServiceError({
      code: CompetitionErrorCode.LOCATION_RESOLUTION_FAILED,
      message:
        "We could not look that location up right now. Please try again in a moment.",
      details: { filter: resolution.key, reason: resolution.reason },
    });
  }

  return {
    scope: args.scope,
    params: args.params,
    context,
    baseClauses: [
      ...deletionClauses(args.scope, args.params),
      ...resolution.clauses,
    ],
  };
}

/**
 * Turns a plan into a Prisma query.
 *
 * Pure and synchronous. Calling it twice with the same plan yields identical
 * output, which is exactly what the row query and the count query rely on.
 */
export function buildCompetitionQuery(plan: CompetitionSearchPlan) {
  return buildSearchQuery({
    definition: competitionSearchDefinition,
    params: plan.params,
    scope: plan.scope,
    context: plan.context,
    baseClauses: plan.baseClauses,
  });
}
