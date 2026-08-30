/**
 * Standing regression suite for the Competition search engine
 * (`src/lib/search` + `competitionSearchDefinition`), which is now the
 * production implementation behind `/competitions`, `/admin/competitions`,
 * and the `/api/v1/competitions*` routes — the legacy hand-written
 * `CompetitionWhereBuilder` pipeline this replaced has been deleted.
 *
 * Before deletion, this script instead ran the legacy pipeline and the new
 * engine side by side against the real database and diffed row-id
 * sequences (65/65 passed — see
 * docs/project/feature-specification/search/07-implementation-design.md §7
 * and the git history of this file for that comparison). With no legacy
 * implementation left to compare against, this script now asserts the
 * engine's own behavioural invariants directly against the database instead.
 *
 * There is no test runner in this repository yet (see 07 §8), so this
 * remains a standalone script rather than a `describe`/`it` suite. Run with:
 *
 *   pnpm exec tsx scripts/verify-search-parity.ts
 *
 * Invariants asserted:
 *   - text filters match case-insensitively (the exact defect a prior
 *     version of this suite could not catch, because its only case came
 *     from a fixture whose casing happened to match)
 *   - no filter ever reaches Prisma as an empty `in`/`OR` (both match 0 rows)
 *   - scope guards cannot be bypassed by a same-named filter
 *   - defineSearch() rejects malformed registries (6 cases)
 *   - every resolved sort ends in the tiebreaker; unknown sorts degrade
 *   - free-text filters escape LIKE wildcards, verified against the DB
 *   - normalize() is idempotent (canonical URLs are stable)
 *   - inputs that used to 400 the legacy schema now degrade gracefully
 */

import { PrismaClient } from "../src/generated/prisma";
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

async function runEngine(
  raw: RawSearchParams,
  scope: string = "public",
  context: CompetitionSearchContext = {},
) {
  const query = buildSearchQuery({
    definition: competitionSearchDefinition,
    params: raw,
    scope,
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

// =============================================================================
// Case-insensitivity — the exact class of bug a naive parity check missed
// =============================================================================

async function verifyCaseInsensitivity(): Promise<void> {
  console.log("\n== Invariant: text filters match case-insensitively ==");

  const sample = await prisma.competition.findFirst({
    where: { deletedAt: null, visibility: "PUBLIC", location: { not: null } },
    select: { location: true },
  });

  if (!sample?.location) {
    report("location case-insensitivity (needs fixture data)", false, "no public competition has a location");
  } else {
    const [lower, upper, exact] = await Promise.all([
      runEngine({ location: sample.location.toLowerCase() }),
      runEngine({ location: sample.location.toUpperCase() }),
      runEngine({ location: sample.location }),
    ]);

    report(
      `location matches regardless of case (fixture: ${JSON.stringify(sample.location)})`,
      lower.length > 0 &&
        JSON.stringify(lower) === JSON.stringify(upper) &&
        JSON.stringify(lower) === JSON.stringify(exact),
      `lower=${lower.length} upper=${upper.length} exact=${exact.length} rows`,
    );
  }

  const org = await prisma.competition.findFirst({
    where: { deletedAt: null, visibility: "PUBLIC", organizer: { not: null } },
    select: { organizer: true },
  });

  if (!org?.organizer) {
    report("search/organizer case-insensitivity (needs fixture data)", false, "no public competition has an organizer");
    return;
  }

  const [searchLower, searchUpper] = await Promise.all([
    runEngine({ search: org.organizer.toLowerCase() }),
    runEngine({ search: org.organizer.toUpperCase() }),
  ]);

  report(
    `free-text search matches regardless of case (fixture: ${JSON.stringify(org.organizer)})`,
    searchLower.length > 0 && JSON.stringify(searchLower) === JSON.stringify(searchUpper),
    `lower=${searchLower.length} upper=${searchUpper.length} rows`,
  );

  const [orgLower, orgUpper] = await Promise.all([
    runEngine({ organizers: org.organizer.toLowerCase() }),
    runEngine({ organizers: org.organizer.toUpperCase() }),
  ]);

  report(
    `organizers filter matches regardless of case (fixture: ${JSON.stringify(org.organizer)})`,
    orgLower.length > 0 && JSON.stringify(orgLower) === JSON.stringify(orgUpper),
    `lower=${orgLower.length} upper=${orgUpper.length} rows`,
  );
}

// =============================================================================
// Inputs that used to 400 the legacy Zod schema — must now degrade gracefully
// =============================================================================

async function verifyGracefulDegradation(): Promise<void> {
  console.log("\n== Invariant: malformed input degrades instead of failing the request ==");

  const cases: Array<{ name: string; raw: RawSearchParams }> = [
    { name: "invalid enum value", raw: { modes: "BANANA" } },
    { name: "repeated param (array)", raw: { modes: ["ONLINE", "HYBRID"] } },
    { name: "out-of-range page", raw: { page: "0" } },
    { name: "out-of-range limit", raw: { limit: "1000" } },
    { name: "garbage date", raw: { startDateFrom: "not-a-date" } },
    { name: "mixed valid/invalid enum tokens", raw: { modes: "ONLINE,BANANA" } },
  ];

  for (const testCase of cases) {
    let threw = false;
    let ids: string[] = [];

    try {
      ids = await runEngine(testCase.raw);
    } catch {
      threw = true;
    }

    report(
      testCase.name,
      !threw,
      threw ? "engine threw instead of degrading" : `returned ${ids.length} rows`,
    );
  }
}

// =============================================================================
// No filter ever reaches Prisma as an empty `in`/`OR`
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

  const filterKeys = new Set(
    competitionSearchDefinition.filters.map((f) => f.key),
  );

  report(
    '"visibility" is not a registered filter key',
    !filterKeys.has("visibility"),
  );

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

  // Every scope actually restricts what it claims to. Public rows must
  // never include a non-PUBLIC visibility; admin may return any.
  const publicRows = await prisma.competition.findMany({
    where: buildSearchQuery({
      definition: competitionSearchDefinition,
      params: {},
      scope: "public",
      context: {},
      baseClauses: [{ deletedAt: null }],
    }).where,
    select: { visibility: true },
  });

  report(
    "public scope never returns a non-PUBLIC row",
    publicRows.every((r) => r.visibility === "PUBLIC"),
    `visibilities seen: ${JSON.stringify([...new Set(publicRows.map((r) => r.visibility))])}`,
  );
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
  await verifyCaseInsensitivity();
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
