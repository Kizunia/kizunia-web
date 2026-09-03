/**
 * Competitions - Search definition (SERVER ONLY)
 *
 * =============================================================================
 * What this module owns, and what it no longer owns
 * =============================================================================
 *
 * It owns the half of a filter that cannot leave the server: the translation
 * from a decoded value into a Prisma clause, the scope guards, and the sort
 * registry.
 *
 * It no longer owns labels, options, groups or weights. Those live in
 * `./ui.ts`, which is client-safe, and this module *consumes* them. The
 * dependency deliberately points from server to client: if it pointed the
 * other way, a client component reading a filter's label would drag the
 * generated Prisma client into the browser bundle, and the two halves would be
 * free to describe different filters.
 *
 * Practically, that means a filter is declared once. Adding one is a spec in
 * `ui.ts` plus a `toWhere` here — never a third place where the two are
 * reconciled.
 *
 * =============================================================================
 * Enum coverage
 * =============================================================================
 *
 * Because `ui.ts` may not import the Prisma enums, it lists their values as
 * strings. Every `enumMultiFilter` below passes the real enum alongside the
 * spec, and `assertEnumSpecCoverage` compares them at module load. A value
 * added to the schema and forgotten in the spec fails on startup instead of
 * quietly vanishing from the interface.
 *
 * =============================================================================
 * Location
 * =============================================================================
 *
 * Location is registered as a *resolvable* filter rather than an ordinary one.
 * Its clause depends on a provider lookup, and — critically — a place that
 * resolves to nothing must still restrict the results. An ordinary filter
 * decoding to an empty set is dropped by the engine, which would turn "this
 * town has no competitions" into "here is every competition on the platform".
 *
 * See `./location-filter.ts` for the full reasoning, and
 * `src/lib/search/resolve.ts` for the mechanism.
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
  dateRangeFilter,
  defineScope,
  defineSearch,
  defineSortRegistry,
  enumMultiFilter,
  enumRelationMultiFilter,
  multiFieldTextFilter,
  numberBoundFilter,
  relationMultiFilter,
  textAnyFilter,
  type ResolvedDateRange,
} from "@/lib/search";

import { competitionLocationFilter } from "./location-filter";
import { competitionFilterSpecs as specs } from "./ui";

type CompetitionWhere = Prisma.CompetitionWhereInput;
type CompetitionOrderBy = Prisma.CompetitionOrderByWithRelationInput;

export interface CompetitionSearchContext {
  /** Required by the "management" scope; unused by "public" and "admin". */
  readonly actorId?: string;
}

// =============================================================================
// Ordinary filters
// =============================================================================

const search = multiFieldTextFilter<CompetitionWhere>({
  spec: specs.search,
  toWhere: (value) => ({
    OR: [
      { title: { contains: value, mode: "insensitive" } },
      { organizer: { contains: value, mode: "insensitive" } },
    ],
  }),
});

const modes = enumMultiFilter<CompetitionWhere, CompetitionMode>({
  spec: specs.modes,
  values: Object.values(CompetitionMode),
  toWhere: (values) => ({ mode: { in: values } }),
});

const categories = relationMultiFilter<CompetitionWhere>({
  spec: specs.categories,
  toWhere: (slugs) => ({
    categories: { some: { category: { slug: { in: slugs } } } },
  }),
});

const technologies = relationMultiFilter<CompetitionWhere>({
  spec: specs.technologies,
  toWhere: (slugs) => ({
    technologies: { some: { technology: { slug: { in: slugs } } } },
  }),
});

const registrationFeeTypes = enumMultiFilter<
  CompetitionWhere,
  RegistrationFeeType
>({
  spec: specs.registrationFeeTypes,
  values: Object.values(RegistrationFeeType),
  toWhere: (values) => ({ registrationFeeType: { in: values } }),
});

const difficultyLevels = enumMultiFilter<CompetitionWhere, DifficultyLevel>({
  spec: specs.difficultyLevels,
  values: Object.values(DifficultyLevel),
  toWhere: (values) => ({ difficulty: { in: values } }),
});

const statuses = enumMultiFilter<CompetitionWhere, CompetitionStatus>({
  spec: specs.statuses,
  values: Object.values(CompetitionStatus),
  toWhere: (values) => ({ status: { in: values } }),
});

const registrationDeadline = dateRangeFilter<CompetitionWhere>({
  spec: specs.registrationDeadline,
  toWhere: (range) => ({ registrationDeadline: dateBounds(range) }),
});

const startDate = dateRangeFilter<CompetitionWhere>({
  spec: specs.startDate,
  toWhere: (range) => ({ startDate: dateBounds(range) }),
});

const endDate = dateRangeFilter<CompetitionWhere>({
  spec: specs.endDate,
  toWhere: (range) => ({ endDate: dateBounds(range) }),
});

const eligibilities = enumRelationMultiFilter<
  CompetitionWhere,
  EligibilityType
>({
  spec: specs.eligibilities,
  values: Object.values(EligibilityType),
  toWhere: (values) => ({ eligibilities: { some: { type: { in: values } } } }),
});

const registrationTypes = enumMultiFilter<CompetitionWhere, RegistrationType>({
  spec: specs.registrationTypes,
  values: Object.values(RegistrationType),
  toWhere: (values) => ({ registrationType: { in: values } }),
});

const minTeamSize = numberBoundFilter<CompetitionWhere>({
  spec: specs.minTeamSize,
  toWhere: (value) => ({ minTeamSize: { gte: value } }),
});

const maxTeamSize = numberBoundFilter<CompetitionWhere>({
  spec: specs.maxTeamSize,
  toWhere: (value) => ({ maxTeamSize: { lte: value } }),
});

const organizerTypes = enumMultiFilter<CompetitionWhere, OrganizerType>({
  spec: specs.organizerTypes,
  values: Object.values(OrganizerType),
  toWhere: (values) => ({ organizerType: { in: values } }),
});

const organizers = textAnyFilter<CompetitionWhere>({
  spec: specs.organizers,
  toWhere: (values) => ({
    OR: values.map((organizer) => ({
      organizer: { contains: organizer, mode: "insensitive" as const },
    })),
  }),
});

const certificateTypes = enumMultiFilter<CompetitionWhere, CertificateType>({
  spec: specs.certificateTypes,
  values: Object.values(CertificateType),
  toWhere: (values) => ({ certificateType: { in: values } }),
});

const registrationPlatforms = enumMultiFilter<
  CompetitionWhere,
  RegistrationPlatform
>({
  spec: specs.registrationPlatforms,
  values: Object.values(RegistrationPlatform),
  toWhere: (values) => ({ registrationPlatform: { in: values } }),
});

/**
 * Converts a resolved range into a Prisma comparison.
 *
 * Both bounds are optional and at least one is always present — the range
 * filter does not produce a value otherwise — so this never yields an empty
 * comparison object.
 */
function dateBounds(range: ResolvedDateRange): Prisma.DateTimeFilter {
  const bounds: Prisma.DateTimeFilter = {};

  if (range.from) bounds.gte = range.from;
  if (range.to) bounds.lte = range.to;

  return bounds;
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

export type CompetitionSort =
  (typeof CompetitionSort)[keyof typeof CompetitionSort];

export const competitionSortRegistry = defineSortRegistry<CompetitionOrderBy>({
  defaultKey: CompetitionSort.NEWEST,
  tiebreaker: { id: "asc" },
  options: [
    {
      key: CompetitionSort.NEWEST,
      label: "Newest",
      orderBy: [{ createdAt: "desc" }],
    },
    {
      key: CompetitionSort.REGISTRATION_DEADLINE_ASC,
      label: "Deadline soonest",
      orderBy: [{ registrationDeadline: "asc" }],
    },
    {
      key: CompetitionSort.START_DATE_ASC,
      label: "Starting soonest",
      orderBy: [{ startDate: "asc" }],
    },
    {
      key: CompetitionSort.START_DATE_DESC,
      label: "Starting latest",
      orderBy: [{ startDate: "desc" }],
    },
    {
      key: CompetitionSort.REGISTRATION_DEADLINE_DESC,
      label: "Deadline latest",
      orderBy: [{ registrationDeadline: "desc" }],
    },
    {
      key: CompetitionSort.OLDEST,
      label: "Oldest",
      orderBy: [{ createdAt: "asc" }],
    },
    {
      key: CompetitionSort.ALPHABETICAL_ASC,
      label: "Title A–Z",
      orderBy: [{ title: "asc" }],
    },
    {
      key: CompetitionSort.ALPHABETICAL_DESC,
      label: "Title Z–A",
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

const managementScope = defineScope<
  CompetitionWhere,
  CompetitionSearchContext
>({
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

  // Bound individually rather than via `.map(bindFilter)`: passed as an array,
  // TypeScript instantiates the generic `bindFilter` once for the whole
  // unioned element type instead of once per literal, which loses each
  // filter's own value type.
  filters: [
    bindFilter(search),
    bindFilter(modes),
    bindFilter(categories),
    bindFilter(technologies),
    bindFilter(registrationFeeTypes),
    bindFilter(difficultyLevels),
    bindFilter(statuses),
    bindFilter(registrationDeadline),
    bindFilter(startDate),
    bindFilter(endDate),
    bindFilter(eligibilities),
    bindFilter(registrationTypes),
    bindFilter(minTeamSize),
    bindFilter(maxTeamSize),
    bindFilter(organizerTypes),
    bindFilter(organizers),
    bindFilter(certificateTypes),
    bindFilter(registrationPlatforms),
  ],

  // Applied in every scope, because it is registered rather than wired into
  // one service method. That is the fix for location previously being honoured
  // by the public listing and silently ignored by the management and admin
  // ones.
  resolvableFilters: [competitionLocationFilter],

  sorts: competitionSortRegistry,

  scopes: {
    public: publicScope,
    management: managementScope,
    admin: adminScope,
  },
});
