/**
 * Competitions - Search definition (Phase 1 core migration)
 *
 * The Competition entity's registry on the shared `src/lib/search` engine.
 * Filters are declared in the exact same order as the legacy
 * `CompetitionWhereBuilder`'s pipeline (search → competition scalars →
 * organizer → categories → technologies → eligibility → team → dates →
 * location), so the two produce the same clauses in the same sequence.
 *
 * `scripts/verify-search-parity.ts` proves equivalence by running both
 * against the real database and comparing the resulting row-id sequences —
 * not by comparing object shape, because the engine flattens `AND` where
 * the legacy scope builders nest it. Same rows, different tree.
 *
 * This module is server-only: it imports Prisma enum values, which must
 * not reach a client bundle. The `server-only` package (which would make
 * that a build-time error rather than a convention) is not currently a
 * dependency of this project — worth adding when Phase 2 introduces client
 * components that could accidentally import from here. A client-safe
 * `ui.ts` split (see docs/.../02-core-architecture.md §10) is likewise
 * deferred until Phase 2 actually needs it — introducing it now would be
 * speculative.
 */

import {
  CertificateType,
  CompetitionMode,
  CompetitionStatus,
  DifficultyLevel,
  EligibilityType,
  OrganizerType,
  Prisma,
  RegistrationFeeType,
  RegistrationPlatform,
  RegistrationType,
} from "@/generated/prisma";

import {
  bindFilter,
  defineScope,
  defineSearch,
  defineSortRegistry,
  dateRangeFilter,
  enumMultiFilter,
  enumRelationMultiFilter,
  multiFieldTextFilter,
  numberBoundFilter,
  relationSlugMultiFilter,
  textContainsAnyFilter,
} from "@/lib/search";

type CompetitionWhere = Prisma.CompetitionWhereInput;
type CompetitionOrderBy = Prisma.CompetitionOrderByWithRelationInput;

export interface CompetitionSearchContext {
  /** Required by the "management" scope; unused by "public" and "admin". */
  readonly actorId?: string;
}

// =============================================================================
// Filters — declared in the legacy pipeline's exact order
// =============================================================================

const search = multiFieldTextFilter<CompetitionWhere>({
  key: "search",
  toWhere: (value) => ({
    OR: [
      { title: { contains: value, mode: "insensitive" } },
      { organizer: { contains: value, mode: "insensitive" } },
    ],
  }),
  ui: { label: "Search", group: "quick", weight: 0 },
});

const modes = enumMultiFilter<CompetitionWhere, CompetitionMode>({
  key: "modes",
  values: Object.values(CompetitionMode),
  toWhere: (values) => ({ mode: { in: values } }),
  ui: {
    label: "Mode",
    group: "quick",
    weight: 10,
    options: Object.values(CompetitionMode).map((value) => ({
      value,
      label: titleCase(value),
    })),
  },
});

const statuses = enumMultiFilter<CompetitionWhere, CompetitionStatus>({
  key: "statuses",
  values: Object.values(CompetitionStatus),
  toWhere: (values) => ({ status: { in: values } }),
  ui: { label: "Status", group: "advanced", weight: 60 },
});

const registrationPlatforms = enumMultiFilter<
  CompetitionWhere,
  RegistrationPlatform
>({
  key: "registrationPlatforms",
  values: Object.values(RegistrationPlatform),
  toWhere: (values) => ({ registrationPlatform: { in: values } }),
  ui: { label: "Registration Platform", group: "advanced", weight: 70 },
});

const registrationTypes = enumMultiFilter<CompetitionWhere, RegistrationType>({
  key: "registrationTypes",
  values: Object.values(RegistrationType),
  toWhere: (values) => ({ registrationType: { in: values } }),
  ui: { label: "Registration Type", group: "advanced", weight: 71 },
});

const registrationFeeTypes = enumMultiFilter<
  CompetitionWhere,
  RegistrationFeeType
>({
  key: "registrationFeeTypes",
  values: Object.values(RegistrationFeeType),
  toWhere: (values) => ({ registrationFeeType: { in: values } }),
  ui: { label: "Fee", group: "quick", weight: 40 },
});

const organizerTypes = enumMultiFilter<CompetitionWhere, OrganizerType>({
  key: "organizerTypes",
  values: Object.values(OrganizerType),
  toWhere: (values) => ({ organizerType: { in: values } }),
  ui: { label: "Organizer Type", group: "advanced", weight: 72 },
});

const difficultyLevels = enumMultiFilter<CompetitionWhere, DifficultyLevel>({
  key: "difficultyLevels",
  values: Object.values(DifficultyLevel),
  toWhere: (values) => ({ difficulty: { in: values } }),
  ui: { label: "Difficulty", group: "quick", weight: 30 },
});

const certificateTypes = enumMultiFilter<CompetitionWhere, CertificateType>({
  key: "certificateTypes",
  values: Object.values(CertificateType),
  toWhere: (values) => ({ certificateType: { in: values } }),
  ui: { label: "Certificate", group: "advanced", weight: 73 },
});

const organizers = textContainsAnyFilter<CompetitionWhere>({
  key: "organizers",
  toWhere: (values) => ({
    OR: values.map((organizer) => ({
      organizer: { contains: organizer, mode: "insensitive" as const },
    })),
  }),
  ui: { label: "Organizer", group: "advanced", weight: 74 },
});

const categories = relationSlugMultiFilter<CompetitionWhere>({
  key: "categories",
  toWhere: (slugs) => ({
    categories: { some: { category: { slug: { in: slugs } } } },
  }),
  ui: { label: "Category", group: "quick", weight: 11 },
});

const technologies = relationSlugMultiFilter<CompetitionWhere>({
  key: "technologies",
  toWhere: (slugs) => ({
    technologies: { some: { technology: { slug: { in: slugs } } } },
  }),
  ui: { label: "Technology", group: "quick", weight: 12 },
});

const eligibilities = enumRelationMultiFilter<CompetitionWhere, EligibilityType>({
  key: "eligibilities",
  values: Object.values(EligibilityType),
  toWhere: (values) => ({ eligibilities: { some: { type: { in: values } } } }),
  ui: { label: "Eligibility", group: "advanced", weight: 75 },
});

const minTeamSize = numberBoundFilter<CompetitionWhere>({
  key: "minTeamSize",
  toWhere: (value) => ({ minTeamSize: { gte: value } }),
  ui: { label: "Min Team Size", group: "advanced", weight: 80 },
});

const maxTeamSize = numberBoundFilter<CompetitionWhere>({
  key: "maxTeamSize",
  toWhere: (value) => ({ maxTeamSize: { lte: value } }),
  ui: { label: "Max Team Size", group: "advanced", weight: 81 },
});

const startDate = dateRangeFilter<CompetitionWhere>({
  key: "startDate",
  toWhere: (range) => ({ startDate: dateBounds(range) }),
  ui: { label: "Start Date", group: "advanced", weight: 90 },
});

const endDate = dateRangeFilter<CompetitionWhere>({
  key: "endDate",
  toWhere: (range) => ({ endDate: dateBounds(range) }),
  ui: { label: "End Date", group: "advanced", weight: 91 },
});

const registrationDeadline = dateRangeFilter<CompetitionWhere>({
  key: "registrationDeadline",
  toWhere: (range) => ({ registrationDeadline: dateBounds(range) }),
  ui: { label: "Registration Deadline", group: "advanced", weight: 92 },
});

/**
 * Location is deliberately NOT a filter in this registry.
 *
 * The engine drops any filter whose `decode` returns `undefined`, and
 * `normalizeList` maps an empty list to `undefined` by design — "empty is
 * indistinguishable from absent". That is right for every other filter, but
 * fatal here: a user selecting a real place with no competitions resolves to
 * zero search areas, and a dropped filter would return *every* competition
 * instead of none.
 *
 * So the location condition is passed to `buildSearchQuery` as a base clause
 * instead, alongside `deletedAt: null`. Base clauses are applied
 * unconditionally, so "matched nothing" cannot decay into "no restriction".
 * `buildLocationClause` in `search/location-clause.ts` builds it, and
 * `CompetitionService` resolves the place before any query is built — the
 * engine stays synchronous and pure, unable to call a provider or the database
 * from inside a filter.
 */

function dateBounds(range: {
  from?: Date;
  to?: Date;
}): Prisma.DateTimeFilter {
  const bounds: Prisma.DateTimeFilter = {};

  if (range.from) bounds.gte = range.from;
  if (range.to) bounds.lte = range.to;

  return bounds;
}

function titleCase(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

// =============================================================================
// Sorting
// =============================================================================

export const CompetitionSort = {
  NEWEST: "newest",
  OLDEST: "oldest",
  START_DATE_ASC: "start-date-asc",
  START_DATE_DESC: "start-date-desc",
  REGISTRATION_DEADLINE_ASC: "registration-deadline-asc",
  REGISTRATION_DEADLINE_DESC: "registration-deadline-desc",
  ALPHABETICAL_ASC: "alphabetical-asc",
  ALPHABETICAL_DESC: "alphabetical-desc",
} as const;

export type CompetitionSort = (typeof CompetitionSort)[keyof typeof CompetitionSort];

const sorts = defineSortRegistry<CompetitionOrderBy>({
  defaultKey: CompetitionSort.NEWEST,
  tiebreaker: { id: "asc" },
  options: [
    { key: CompetitionSort.NEWEST, label: "Newest", orderBy: [{ createdAt: "desc" }] },
    { key: CompetitionSort.OLDEST, label: "Oldest", orderBy: [{ createdAt: "asc" }] },
    {
      key: CompetitionSort.START_DATE_ASC,
      label: "Start date (soonest)",
      orderBy: [{ startDate: "asc" }],
    },
    {
      key: CompetitionSort.START_DATE_DESC,
      label: "Start date (latest)",
      orderBy: [{ startDate: "desc" }],
    },
    {
      key: CompetitionSort.REGISTRATION_DEADLINE_ASC,
      label: "Registration deadline (soonest)",
      orderBy: [{ registrationDeadline: "asc" }],
    },
    {
      key: CompetitionSort.REGISTRATION_DEADLINE_DESC,
      label: "Registration deadline (latest)",
      orderBy: [{ registrationDeadline: "desc" }],
    },
    {
      key: CompetitionSort.ALPHABETICAL_ASC,
      label: "Title (A–Z)",
      orderBy: [{ title: "asc" }],
    },
    {
      key: CompetitionSort.ALPHABETICAL_DESC,
      label: "Title (Z–A)",
      orderBy: [{ title: "desc" }],
    },
  ],
});

// =============================================================================
// Scopes
// =============================================================================

const publicScope = defineScope<CompetitionWhere, CompetitionSearchContext>({
  id: "public",
  allowedFilters: "all",
  guardedKeys: ["visibility"],
  guard: () => [{ visibility: "PUBLIC" }],
});

const managementScope = defineScope<CompetitionWhere, CompetitionSearchContext>({
  id: "management",
  allowedFilters: "all",
  guard: (context) => {
    if (!context.actorId) {
      throw new Error(
        "Competition management scope requires an authenticated actorId.",
      );
    }

    return [{ members: { some: { userId: context.actorId } } }];
  },
});

const adminScope = defineScope<CompetitionWhere, CompetitionSearchContext>({
  id: "admin",
  allowedFilters: "all",
  guard: () => [],
  requiresPlatformAction: "VIEW_ALL_COMPETITIONS",
});

// =============================================================================
// Definition
// =============================================================================

export const competitionSearchDefinition = defineSearch<
  CompetitionWhere,
  CompetitionOrderBy,
  CompetitionSearchContext
>({
  entity: "Competition",

  // Bound individually rather than via `.map(bindFilter)`: passed as an
  // array, TypeScript instantiates the generic `bindFilter` once for the
  // whole (unioned) element type instead of once per literal, which loses
  // the per-filter `TValue`.
  filters: [
    bindFilter(search),
    bindFilter(modes),
    bindFilter(statuses),
    bindFilter(registrationPlatforms),
    bindFilter(registrationTypes),
    bindFilter(registrationFeeTypes),
    bindFilter(organizerTypes),
    bindFilter(difficultyLevels),
    bindFilter(certificateTypes),
    bindFilter(organizers),
    bindFilter(categories),
    bindFilter(technologies),
    bindFilter(eligibilities),
    bindFilter(minTeamSize),
    bindFilter(maxTeamSize),
    bindFilter(startDate),
    bindFilter(endDate),
    bindFilter(registrationDeadline),
    ],

  sorts,

  scopes: {
    public: publicScope,
    management: managementScope,
    admin: adminScope,
  },
});
