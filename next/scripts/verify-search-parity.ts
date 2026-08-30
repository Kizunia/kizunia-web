/**
 * Verifies the new `src/lib/search` engine, wired up for Competitions via
 * `competitionSearchDefinition`, reproduces the legacy hand-written
 * `CompetitionWhereBuilder` pipeline's *behaviour* — not its literal object
 * shape (the two nest `AND` differently; see
 * docs/project/feature-specification/search/07-implementation-design.md §7)
 * — by running both against the real database and comparing the resulting
 * row id sequences.
 *
 * There is no test runner in this repository yet (see 07 §8), so this is a
 * standalone script rather than a `describe`/`it` suite. Run with:
 *
 *   pnpm exec tsx scripts/verify-search-parity.ts
 *
 * It also asserts invariants that must hold regardless of parity:
 *   - no filter ever reaches Prisma as an empty `in`/`OR` (would match 0 rows)
 *   - every registered scope rejects filters on its own guarded keys
 *   - every resolved sort ends in the tiebreaker
 *   - encode(decode(x)) is stable for representative filters
 */

import { PrismaClient } from "../src/generated/prisma";
import { CompetitionSearchSchema } from "../src/modules/competitions/search/schema";
import { PublicCompetitionWhereBuilder } from "../src/modules/competitions/search/public-where";
import { CompetitionOrderByBuilder } from "../src/modules/competitions/search/order-by";
import {
  competitionSearchDefinition,
  type CompetitionSearchContext,
} from "../src/modules/competitions/search/definition";
import { buildSearchQuery, defineSearch } from "../src/lib/search/engine";
import { bindFilter } from "../src/lib/search/bind";
import { defineScope } from "../src/lib/search/scope";
import { defineSortRegistry } from "../src/lib/search/sort";
import { dateRangeFilter } from "../src/lib/search/filters/range";
import { textContainsFilter } from "../src/lib/search/filters/text";
import type { RawSearchParams } from "../src/lib/search/types";

const prisma = new PrismaClient();

let failures = 0;
let checks = 0;

function report(label: string, ok: boolean, detail?: string): void {
  checks += 1;

  if (ok) {
    console.log(`  ok   ${label}`);
    return;
  }

  failures += 1;
  console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ""}`);
}

// =============================================================================
// Part 1 — behavioural parity against the real database
// =============================================================================

type Case = { name: string; raw: RawSearchParams };

const cases: Case[] = [
  { name: "no filters", raw: {} },
  { name: "search text", raw: { search: "ETH" } },
  { name: "single mode", raw: { modes: "OFFLINE" } },
  { name: "multi mode", raw: { modes: "ONLINE,HYBRID" } },
  { name: "mode + category", raw: { modes: "OFFLINE", categories: "web3" } },
  { name: "category OR", raw: { categories: "ai,web3" } },
  { name: "technology", raw: { technologies: "react" } },
  { name: "team size bounds", raw: { minTeamSize: "1", maxTeamSize: "5" } },
  {
    name: "date range",
    raw: { startDateFrom: "2026-01-01", startDateTo: "2026-12-31" },
  },
  { name: "organizer contains", raw: { organizers: "ETHGlobal" } },
  { name: "combined", raw: { modes: "OFFLINE", technologies: "react", search: "ETH" } },
  { name: "sort alphabetical", raw: { sort: "alphabetical-asc" } },
  { name: "sort start date", raw: { sort: "start-date-asc" } },
  { name: "pagination page 2", raw: { page: "2", limit: "5" } },
  { name: "empty modes param", raw: { modes: "" } },
  { name: "location contains", raw: { location: "Delhi" } },
  { name: "difficulty + fee", raw: { difficultyLevels: "BEGINNER", registrationFeeTypes: "FREE" } },

  // Case-varied inputs for every filter the legacy builder matches
  // case-insensitively. Without these, a dropped `mode: "insensitive"`
  // passes parity whenever the fixture data happens to match the test's
  // casing — which is exactly how the `location` filter shipped broken and
  // was only caught by reading the two implementations side by side.
  { name: "location lowercase", raw: { location: "delhi" } },
  { name: "location uppercase", raw: { location: "DELHI" } },
  { name: "search lowercase", raw: { search: "eth" } },
  { name: "search uppercase", raw: { search: "ETHGLOBAL" } },
  { name: "organizers lowercase", raw: { organizers: "ethglobal" } },

  // Inputs the legacy Zod schema REJECTS outright — excluded from the
  // deep-equal loop below and asserted separately to degrade gracefully
  // instead (07 §7's documented, deliberate exception).
];

const gracefulOnlyCases: Case[] = [
  { name: "invalid enum value", raw: { modes: "BANANA" } },
  { name: "repeated param (array)", raw: { modes: ["ONLINE", "HYBRID"] } },
  { name: "out-of-range page", raw: { page: "0" } },
  { name: "out-of-range limit", raw: { limit: "1000" } },
  { name: "garbage date", raw: { startDateFrom: "not-a-date" } },
];

async function runLegacy(raw: RawSearchParams) {
  // Only used for the `cases` matrix below, none of which contain array
  // values — array-valued params are exercised separately in
  // `verifyGracefulDegradation`, which passes them to the schema unfiltered.
  const stringRaw: Record<string, string> = {};

  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string") stringRaw[key] = value;
  }

  const filters = CompetitionSearchSchema.parse(stringRaw);

  const where = PublicCompetitionWhereBuilder.build(filters);
  const orderBy = CompetitionOrderByBuilder.build(filters.sort);
  const skip = (filters.page - 1) * filters.limit;
  const take = filters.limit;

  const rows = await prisma.competition.findMany({
    where,
    orderBy,
    skip,
    take,
    select: { id: true },
  });

  return rows.map((r) => r.id);
}

async function runEngine(raw: RawSearchParams) {
  const context: CompetitionSearchContext = {};

  const query = buildSearchQuery({
    definition: competitionSearchDefinition,
    params: raw,
    scope: "public",
    context,
    baseClauses: [{ deletedAt: null }],
  });

  const rows = await prisma.competition.findMany({
    where: query.where,
    orderBy: query.orderBy,
    skip: query.skip,
    take: query.take,
    select: { id: true },
  });

  return rows.map((r) => r.id);
}

async function verifyParity(): Promise<void> {
  console.log("\n== Behavioural parity (legacy vs. engine, same DB) ==");

  for (const testCase of cases) {
    const [legacyIds, engineIds] = await Promise.all([
      runLegacy(testCase.raw),
      runEngine(testCase.raw),
    ]);

    const equal =
      legacyIds.length === engineIds.length &&
      legacyIds.every((id, i) => id === engineIds[i]);

    report(
      testCase.name,
      equal,
      equal
        ? undefined
        : `legacy=[${legacyIds.join(",")}] engine=[${engineIds.join(",")}]`,
    );
  }
}

async function verifyGracefulDegradation(): Promise<void> {
  console.log("\n== Graceful degradation (inputs the legacy schema rejects) ==");

  for (const testCase of gracefulOnlyCases) {
    let legacyThrew = false;

    try {
      // Passed as-is, including arrays: this is what Next.js's App Router
      // `searchParams` prop actually delivers for a repeated key (verified
      // live in Phase 0 — `?modes=ONLINE&modes=HYBRID` renders the error
      // page). Stripping arrays first, as `runLegacy` does for the DB
      // parity cases below, would hide exactly the failure this case
      // exists to demonstrate.
      CompetitionSearchSchema.parse(testCase.raw);
    } catch {
      legacyThrew = true;
    }

    report(`legacy throws on: ${testCase.name}`, legacyThrew);

    let engineThrew = false;
    let ids: string[] = [];

    try {
      ids = await runEngine(testCase.raw);
    } catch {
      engineThrew = true;
    }

    report(
      `engine degrades gracefully on: ${testCase.name}`,
      !engineThrew,
      engineThrew ? "engine threw instead of degrading" : `returned ${ids.length} rows`,
    );
  }
}

// =============================================================================
// Part 2 — structural invariants
// =============================================================================

function containsEmptyInOrOr(value: unknown, path = "where"): string | null {
  if (value === null || typeof value !== "object") return null;

  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if ((key === "in" || key === "OR") && Array.isArray(val) && val.length === 0) {
      return `${path}.${key}`;
    }

    if (val !== null && typeof val === "object") {
      const nested = containsEmptyInOrOr(val, `${path}.${key}`);
      if (nested) return nested;
    }
  }

  return null;
}

async function verifyNoEmptyInOrOr(): Promise<void> {
  console.log("\n== Invariant: no filter ever emits empty `in`/`OR` ==");

  const emptyValueCases: RawSearchParams[] = [
    { modes: "" },
    { categories: "" },
    { technologies: "" },
    { organizers: "" },
    { eligibilities: "" },
    { statuses: "," },
  ];

  for (const raw of emptyValueCases) {
    const query = buildSearchQuery({
      definition: competitionSearchDefinition,
      params: raw,
      scope: "public",
      context: {},
      baseClauses: [{ deletedAt: null }],
    });

    const offender = containsEmptyInOrOr(query.where);

    report(
      `params=${JSON.stringify(raw)}`,
      offender === null,
      offender ? `found empty collection at ${offender}` : undefined,
    );
  }
}

async function verifyScopeGuardEnforcement(): Promise<void> {
  console.log("\n== Invariant: scope guards cannot be bypassed by a filter ==");

  // The public scope guards "visibility". No registered filter may share
  // that key — defineSearch() would have thrown at import time if one did,
  // which this process reaching this line already proves. Assert it
  // explicitly anyway so a future refactor that reintroduces the collision
  // fails loudly here too, not only via import-time crash.
  const filterKeys = new Set(
    competitionSearchDefinition.filters.map((f) => f.key),
  );

  report(
    '"visibility" is not a registered filter key',
    !filterKeys.has("visibility"),
  );

  // Unknown scope must throw, not silently fall back to unscoped.
  let threw = false;
  try {
    buildSearchQuery({
      definition: competitionSearchDefinition,
      params: {},
      scope: "does-not-exist",
      context: {},
    });
  } catch {
    threw = true;
  }
  report("unknown scope id throws", threw);

  // Management scope without an actorId must throw, not leak.
  let managementThrew = false;
  try {
    buildSearchQuery({
      definition: competitionSearchDefinition,
      params: {},
      scope: "management",
      context: {},
    });
  } catch {
    managementThrew = true;
  }
  report("management scope with no actorId throws", managementThrew);
}

async function verifyDefinitionValidation(): Promise<void> {
  console.log("\n== Invariant: defineSearch() rejects malformed registries ==");

  type W = { AND?: W | W[]; visibility?: unknown };

  const ui = { label: "x", group: "quick" as const };

  const sorts = defineSortRegistry<{ id: "asc" }>({
    options: [{ key: "newest", label: "N", orderBy: [{ id: "asc" as const }] }],
    defaultKey: "newest",
    tiebreaker: { id: "asc" },
  });

  const openScopes = {
    public: defineScope<W, object>({
      id: "public",
      allowedFilters: "all",
      guard: () => [],
    }),
  };

  const rejects = (label: string, build: () => unknown) => {
    let threw = false;
    try {
      build();
    } catch {
      threw = true;
    }
    report(label, threw, "expected defineSearch to throw");
  };

  rejects("filter claiming a reserved parameter", () =>
    defineSearch<W, { id: "asc" }, object>({
      entity: "T",
      sorts,
      scopes: openScopes,
      filters: [
        bindFilter(textContainsFilter<W>({ key: "page", toWhere: () => ({}), ui })),
      ],
    }),
  );

  rejects("two filters claiming the same URL parameter", () =>
    defineSearch<W, { id: "asc" }, object>({
      entity: "T",
      sorts,
      scopes: openScopes,
      // dateRangeFilter("startDate") owns startDateFrom/startDateTo, so this
      // collides on a *derived* parameter while the two keys differ — the
      // case a key-only check would miss.
      filters: [
        bindFilter(dateRangeFilter<W>({ key: "startDate", toWhere: () => ({}), ui })),
        bindFilter(
          textContainsFilter<W>({ key: "startDateFrom", toWhere: () => ({}), ui }),
        ),
      ],
    }),
  );

  rejects("duplicate filter key", () =>
    defineSearch<W, { id: "asc" }, object>({
      entity: "T",
      sorts,
      scopes: openScopes,
      filters: [
        bindFilter(textContainsFilter<W>({ key: "a", toWhere: () => ({}), ui })),
        bindFilter(textContainsFilter<W>({ key: "a", toWhere: () => ({}), ui })),
      ],
    }),
  );

  rejects("filter colliding with a scope's guardedKeys", () =>
    defineSearch<W, { id: "asc" }, object>({
      entity: "T",
      sorts,
      scopes: {
        public: defineScope<W, object>({
          id: "public",
          allowedFilters: "all",
          guardedKeys: ["visibility"],
          guard: () => [{ visibility: "PUBLIC" }],
        }),
      },
      filters: [
        bindFilter(
          textContainsFilter<W>({ key: "visibility", toWhere: () => ({}), ui }),
        ),
      ],
    }),
  );

  rejects("registry with no scopes", () =>
    defineSearch<W, { id: "asc" }, object>({
      entity: "T",
      sorts,
      scopes: {},
      filters: [],
    }),
  );

  let accepted = true;
  try {
    defineSearch<W, { id: "asc" }, object>({
      entity: "T",
      sorts,
      scopes: openScopes,
      filters: [
        bindFilter(dateRangeFilter<W>({ key: "startDate", toWhere: () => ({}), ui })),
        bindFilter(textContainsFilter<W>({ key: "location", toWhere: () => ({}), ui })),
      ],
    });
  } catch {
    accepted = false;
  }
  report("a valid registry is accepted", accepted);
}

async function verifySortDeterminism(): Promise<void> {
  console.log("\n== Invariant: every sort resolves with the tiebreaker ==");

  for (const option of competitionSearchDefinition.sorts.options) {
    const query = buildSearchQuery({
      definition: competitionSearchDefinition,
      params: { sort: option.key },
      scope: "public",
      context: {},
    });

    const last = query.orderBy[query.orderBy.length - 1];

    report(
      `sort "${option.key}" ends in tiebreaker`,
      JSON.stringify(last) === JSON.stringify({ id: "asc" }),
      `got ${JSON.stringify(last)}`,
    );
  }

  const unknownQuery = buildSearchQuery({
    definition: competitionSearchDefinition,
    params: { sort: "not-a-real-sort" },
    scope: "public",
    context: {},
  });

  report(
    "unknown sort token falls back to default instead of throwing",
    unknownQuery.orderBy.length > 0,
  );
}

async function verifyWildcardEscaping(): Promise<void> {
  console.log("\n== Invariant: free-text filters escape LIKE wildcards ==");

  const withPercent = buildSearchQuery({
    definition: competitionSearchDefinition,
    params: { search: "50%" },
    scope: "public",
    context: {},
  });

  const clause = JSON.stringify(withPercent.where);

  report(
    '"50%" is escaped to "50\\%" before reaching Prisma',
    clause.includes("50\\\\%"),
    clause,
  );

  // Behavioural check against the database, not just the clause string.
  // Prisma does NOT escape LIKE wildcards itself: an unescaped `%` inside a
  // `contains` acts as a wildcard, so "<head>%<tail>" would match a title
  // that merely starts and ends that way. Escaped, it must match nothing,
  // because no title contains a literal "%".
  const sample = await prisma.competition.findFirst({
    where: { deletedAt: null, visibility: "PUBLIC" },
    select: { title: true },
  });

  if (!sample) {
    report("wildcard behaviour (needs >=1 public competition)", false, "no fixture data");
    return;
  }

  const probe = `${sample.title.slice(0, 3)}%${sample.title.slice(-3)}`;

  const unescapedMatches = await prisma.competition.count({
    where: {
      deletedAt: null,
      visibility: "PUBLIC",
      title: { contains: probe, mode: "insensitive" },
    },
  });

  const throughEngine = buildSearchQuery({
    definition: competitionSearchDefinition,
    params: { search: probe },
    scope: "public",
    context: {},
    baseClauses: [{ deletedAt: null }],
  });

  const escapedMatches = await prisma.competition.count({
    where: throughEngine.where,
  });

  report(
    `raw Prisma treats "%" in ${JSON.stringify(probe)} as a wildcard`,
    unescapedMatches > 0,
    `matched ${unescapedMatches} — if 0, this assertion no longer proves anything`,
  );

  report(
    "engine escapes it so it matches literally (0 rows)",
    escapedMatches === 0,
    `matched ${escapedMatches}`,
  );

  // ...and escaping must not break ordinary searches.
  const plain = buildSearchQuery({
    definition: competitionSearchDefinition,
    params: { search: sample.title },
    scope: "public",
    context: {},
    baseClauses: [{ deletedAt: null }],
  });

  report(
    "escaping does not break a normal search",
    (await prisma.competition.count({ where: plain.where })) > 0,
  );
}

async function verifyCodecRoundTrip(): Promise<void> {
  console.log("\n== Invariant: normalize() is idempotent on already-canonical params ==");

  const canonicalCases: RawSearchParams[] = [
    { modes: "HYBRID,ONLINE" },
    { categories: "ai,web3" },
    { search: "ETHGlobal" },
    { minTeamSize: "4" },
    { startDateFrom: new Date("2026-01-01").toISOString() },
  ];

  for (const raw of canonicalCases) {
    const once = normalizeAll(raw);
    const twice = normalizeAll(once);

    report(
      `normalize(normalize(${JSON.stringify(raw)})) === normalize(${JSON.stringify(raw)})`,
      JSON.stringify(once) === JSON.stringify(twice),
      `first=${JSON.stringify(once)} second=${JSON.stringify(twice)}`,
    );
  }
}

function normalizeAll(raw: RawSearchParams): Record<string, string | undefined> {
  const result: Record<string, string | undefined> = {};

  for (const filter of competitionSearchDefinition.filters) {
    Object.assign(result, filter.normalize(raw));
  }

  return result;
}

async function main(): Promise<void> {
  await verifyParity();
  await verifyGracefulDegradation();
  await verifyNoEmptyInOrOr();
  await verifyScopeGuardEnforcement();
  await verifyDefinitionValidation();
  await verifySortDeterminism();
  await verifyWildcardEscaping();
  await verifyCodecRoundTrip();

  console.log(`\n${checks - failures}/${checks} checks passed.`);

  await prisma.$disconnect();

  if (failures > 0) {
    process.exitCode = 1;
  }
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exitCode = 1;
});
