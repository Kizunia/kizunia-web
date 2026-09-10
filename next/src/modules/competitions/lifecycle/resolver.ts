/**
 * Competition Lifecycle - Pure automatic status resolver
 *
 * =============================================================================
 * What this module is
 * =============================================================================
 *
 * The single place lifecycle precedence is encoded. No database access, no
 * side effects, deterministic given its inputs (including `now`, which is
 * always passed in rather than read from the clock here). Every caller that
 * needs to know "what should this competition's status be right now" —
 * the nightly sweep, the admin preview/apply endpoints, and the date-edit /
 * re-enable reconciliation path on `PATCH /competitions/[id]` — goes through
 * `resolveAutomaticStatus` (or its `evaluateLifecycle` wrapper). Nothing else
 * in the codebase is allowed to re-encode these rules.
 *
 * =============================================================================
 * Precedence, in evaluation order (first match wins)
 * =============================================================================
 *
 *   0. CANCELLED is terminal for automatic processing — never overwritten.
 *   1. COMPLETED           — endDate has been reached.
 *   2. REGISTRATION_OPEN   — registrationStartDate has been reached AND
 *                            registration is not yet past its deadline.
 *   3. ONGOING              — startDate has been reached.
 *   4. REGISTRATION_CLOSED — registrationDeadline has been reached.
 *   5. UPCOMING             — at least one lifecycle date is known, but none
 *                            of the rules above matched.
 *   6. unchanged             — no lifecycle date is known at all; there is
 *                            nothing to derive a status from.
 *
 * REGISTRATION_OPEN outranks ONGOING deliberately: a competition may already
 * have started while registration is still open (late registration), and the
 * two are not mutually exclusive states — the registration window is what the
 * status describes at that point, not the event itself. ONGOING outranks
 * REGISTRATION_CLOSED because "the event has started" is a stronger signal
 * than "the registration window is over" whenever both are true.
 *
 * =============================================================================
 * Missing dates
 * =============================================================================
 *
 * Every rule names exactly the date(s) it needs and is skipped — not
 * defaulted, not inferred — when that date is null. In particular, a null
 * `registrationStartDate` disables rule 2 only; it never means "registration
 * is always open" and it never suppresses any other rule. If none of the four
 * dates are known, there is nothing to derive from, and the current status is
 * preserved unchanged (rule 6).
 *
 * =============================================================================
 * Boundary semantics
 * =============================================================================
 *
 * "Reached" is inclusive: `date.getTime() <= now.getTime()`. Its complement
 * (a deadline that has not yet been reached, in rule 2) is therefore strict
 * (`> now`). One consistent rule, so there is no gap or overlap at the exact
 * instant `now` equals a lifecycle date.
 */

import type { CompetitionStatus } from "@/generated/prisma";

// =============================================================================
// Types
// =============================================================================

export const LifecycleReason = {
  /** currentStatus was CANCELLED; automation never moves it. */
  CANCELLED_PRESERVED: "CANCELLED_PRESERVED",
  /** endDate has been reached or passed. */
  END_DATE_PASSED: "END_DATE_PASSED",
  /** registrationStartDate reached and registrationDeadline not yet passed. */
  REGISTRATION_WINDOW_OPEN: "REGISTRATION_WINDOW_OPEN",
  /** startDate has been reached or passed. */
  START_DATE_REACHED: "START_DATE_REACHED",
  /** registrationDeadline has been reached or passed. */
  REGISTRATION_DEADLINE_PASSED: "REGISTRATION_DEADLINE_PASSED",
  /** At least one lifecycle date is known, but none has been reached yet. */
  AWAITING_FIRST_MILESTONE: "AWAITING_FIRST_MILESTONE",
  /** No lifecycle date is known at all; status is left unchanged. */
  NO_LIFECYCLE_DATES: "NO_LIFECYCLE_DATES",
} as const;

export type LifecycleReason =
  (typeof LifecycleReason)[keyof typeof LifecycleReason];

export interface LifecycleInput {
  /** The instant to evaluate against. Always injected — never `new Date()`. */
  readonly now: Date;
  readonly currentStatus: CompetitionStatus | null;
  readonly registrationStartDate: Date | null;
  readonly registrationDeadline: Date | null;
  readonly startDate: Date | null;
  readonly endDate: Date | null;
}

export interface LifecycleResolution {
  /**
   * The status automation believes is correct right now. For CANCELLED
   * (rule 0) and "no lifecycle dates" (rule 6) this equals `currentStatus`.
   */
  readonly status: CompetitionStatus | null;
  readonly reason: LifecycleReason;
  /**
   * The date that drove this resolution, for display ("Why" column). Null
   * for CANCELLED_PRESERVED and NO_LIFECYCLE_DATES. For
   * AWAITING_FIRST_MILESTONE this is the earliest known future lifecycle
   * date, shown as the next milestone rather than something already reached.
   */
  readonly drivingDate: Date | null;
}

export interface LifecycleEvaluation extends LifecycleResolution {
  readonly current: CompetitionStatus | null;
  /** Whether persisting `status` would actually change the stored value. */
  readonly changed: boolean;
}

// =============================================================================
// Helpers
// =============================================================================

function reached(date: Date | null, now: Date): date is Date {
  return date !== null && date.getTime() <= now.getTime();
}

function notYetReached(date: Date | null, now: Date): boolean {
  return date === null || date.getTime() > now.getTime();
}

function earliestKnownDate(
  ...dates: readonly (Date | null)[]
): Date | null {
  let earliest: Date | null = null;
  for (const date of dates) {
    if (date === null) continue;
    if (earliest === null || date.getTime() < earliest.getTime()) {
      earliest = date;
    }
  }
  return earliest;
}

// =============================================================================
// Resolver
// =============================================================================

/**
 * Computes the status automation believes a competition should have right
 * now, from lifecycle dates and current status alone. Pure, synchronous, no
 * I/O. Calling it twice with identical input always yields identical output.
 */
export function resolveAutomaticStatus(
  input: LifecycleInput,
): LifecycleResolution {
  const {
    now,
    currentStatus,
    registrationStartDate,
    registrationDeadline,
    startDate,
    endDate,
  } = input;

  // Rule 0 — CANCELLED is terminal for automatic processing.
  if (currentStatus === "CANCELLED") {
    return {
      status: currentStatus,
      reason: LifecycleReason.CANCELLED_PRESERVED,
      drivingDate: null,
    };
  }

  // Rule 1 — COMPLETED once the event has ended.
  if (reached(endDate, now)) {
    return {
      status: "COMPLETED",
      reason: LifecycleReason.END_DATE_PASSED,
      drivingDate: endDate,
    };
  }

  // Rule 2 — REGISTRATION_OPEN outranks ONGOING: the event may already have
  // started while registration is still accepting entries.
  if (
    reached(registrationStartDate, now) &&
    notYetReached(registrationDeadline, now)
  ) {
    return {
      status: "REGISTRATION_OPEN",
      reason: LifecycleReason.REGISTRATION_WINDOW_OPEN,
      drivingDate: registrationStartDate,
    };
  }

  // Rule 3 — ONGOING once the event has started.
  if (reached(startDate, now)) {
    return {
      status: "ONGOING",
      reason: LifecycleReason.START_DATE_REACHED,
      drivingDate: startDate,
    };
  }

  // Rule 4 — REGISTRATION_CLOSED once the deadline has passed, provided
  // nothing above already matched (i.e. the event has not started and has
  // not ended).
  if (reached(registrationDeadline, now)) {
    return {
      status: "REGISTRATION_CLOSED",
      reason: LifecycleReason.REGISTRATION_DEADLINE_PASSED,
      drivingDate: registrationDeadline,
    };
  }

  // Rule 5 — UPCOMING: something is known about this competition's
  // schedule, but no milestone has been reached yet.
  const nextMilestone = earliestKnownDate(
    registrationStartDate,
    registrationDeadline,
    startDate,
    endDate,
  );
  if (nextMilestone !== null) {
    return {
      status: "UPCOMING",
      reason: LifecycleReason.AWAITING_FIRST_MILESTONE,
      drivingDate: nextMilestone,
    };
  }

  // Rule 6 — no lifecycle date is known at all. Nothing to derive from;
  // preserve whatever status is currently persisted (including null).
  return {
    status: currentStatus,
    reason: LifecycleReason.NO_LIFECYCLE_DATES,
    drivingDate: null,
  };
}

/**
 * `resolveAutomaticStatus` plus the "did this actually change anything"
 * comparison every caller needs — the admin preview table, the sweep's
 * write-grouping, and the date-edit reconciliation path all only care about
 * rows where `changed` is true.
 */
export function evaluateLifecycle(input: LifecycleInput): LifecycleEvaluation {
  const resolution = resolveAutomaticStatus(input);

  return {
    ...resolution,
    current: input.currentStatus,
    changed: resolution.status !== input.currentStatus,
  };
}
