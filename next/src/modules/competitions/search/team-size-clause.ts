import type { Prisma } from "@/generated/prisma";
import type { TeamSizeValue } from "@/lib/search/client";

type CompetitionWhere = Prisma.CompetitionWhereInput;

/**
 * Builds the restriction for a team-size filter value.
 *
 * =============================================================================
 * The overlap this clause tests
 * =============================================================================
 *
 * A participant's intent is an interval: `[min ?? 1, max ?? ∞]`. A
 * competition's own rules are also an interval: `[minTeamSize ?? 1,
 * maxTeamSize ?? ∞]`, using `null` for "the organizer declared no limit on
 * this side". A competition matches when the two intervals overlap — there
 * exists at least one team size both sides would accept.
 *
 * Interval overlap reduces to two independent conditions, and each is only a
 * real constraint on one side:
 *
 *   participant's lower bound <= competition's upper bound
 *   competition's lower bound <= participant's upper bound
 *
 * The first is only worth asking when the participant declared a lower bound
 * above 1 — a competition's upper bound is never below 1, so "my team is at
 * least 1" restricts nothing. The second mirrors that on the other side: it
 * only matters once the participant has actually named an upper bound.
 *
 * This one pair of conditions is what lets `min`/`max` alone express every
 * shape `TeamSizeControl` offers — exact, range, at-least, at-most — with no
 * per-mode branching here. An exact size of 5 is simply `min: 5, max: 5`, and
 * the clause built for it is identical to what a range of `[5, 5]` would
 * produce.
 *
 * =============================================================================
 * Policy is a second, independent question
 * =============================================================================
 *
 * `policy` asks what the *competition* allows, not what the participant
 * brings, and is ANDed in alongside the size conditions rather than folded
 * into them — a person can ask for "a team of 4, at a competition that also
 * allows solo entry" in one filter, and the two conditions have to compose
 * rather than override each other.
 */
export function buildTeamSizeClause(value: TeamSizeValue): CompetitionWhere {
  const clauses: CompetitionWhere[] = [];

  // Participant's lower bound vs. competition's upper bound. A bound of 1 (or
  // absent) restricts nothing, since no competition's maximum is below 1.
  if (value.min !== undefined && value.min > 1) {
    clauses.push({
      OR: [{ maxTeamSize: null }, { maxTeamSize: { gte: value.min } }],
    });
  }

  // Competition's lower bound vs. participant's upper bound.
  if (value.max !== undefined) {
    clauses.push({
      OR: [{ minTeamSize: null }, { minTeamSize: { lte: value.max } }],
    });
  }

  if (value.policy === "SOLO_ONLY") {
    // `lte` excludes NULL by SQL's own comparison rules, so this reads as "a
    // maximum is declared, and it is 1" without an explicit not-null clause.
    clauses.push({ maxTeamSize: { lte: 1 } });
  }

  if (value.policy === "SOLO_OR_TEAM") {
    clauses.push({
      OR: [{ minTeamSize: null }, { minTeamSize: { lte: 1 } }],
    });

    clauses.push({
      OR: [{ maxTeamSize: null }, { maxTeamSize: { gt: 1 } }],
    });
  }

  // At least one clause always exists: `TeamSizeControl` never emits a value
  // with every field unset — `normalizeOrUndefined` clears the filter instead.
  return clauses.length === 1 ? clauses[0] : { AND: clauses };
}
