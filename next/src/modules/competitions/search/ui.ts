/**
 * Competitions - Filter specifications (CLIENT-SAFE)
 *
 * =============================================================================
 * What lives here
 * =============================================================================
 *
 * Every Competition filter, described as the person using the page
 * experiences it: its name, the control it renders as, its options, and where
 * it sits by default.
 *
 * This module must remain importable from a `"use client"` component, which
 * means it may import only from `@/lib/search/client` and must never import
 * `@/generated/prisma`. Enum option values are therefore written out as
 * strings rather than derived from the Prisma enums.
 *
 * That is safe because `definition.ts` — which does have the enums — asserts
 * at module load that every list here matches its database enum exactly. A
 * value added to the schema and forgotten here fails on startup rather than
 * quietly disappearing from the interface. See `assertEnumSpecCoverage`.
 *
 * =============================================================================
 * Labels are product copy
 * =============================================================================
 *
 * Options are labelled the way a participant would describe them, not the way
 * the column stores them. `NON_PROFIT` reads as "Non-profit"; `REGISTRATION_OPEN`
 * reads as "Registration open". Mechanically title-casing the enum would be
 * less code and consistently worse writing, and this is the surface where the
 * platform's vocabulary is set.
 *
 * =============================================================================
 * Groups and weights are defaults, not decisions
 * =============================================================================
 *
 * `group` and `weight` say where a filter sits out of the box. A deployment
 * or a user may override both at render time through `resolveFilterLayout`, so
 * nothing here needs changing to promote a filter or reorder the quick bar.
 *
 * Quick placement follows what a participant decides on first: what it is
 * about, where it is, what it costs, how hard it is. Everything else — the
 * platform it is hosted on, the certificate it issues — is real information
 * that very few people filter by, and it belongs behind a disclosure rather
 * than in front of everyone.
 */

import {
  assertUniqueFilterParams,
  type DateRangeSpec,
  type EnumMultiSpec,
  type FilterSpec,
  type NumberBoundSpec,
  type PlaceSpec,
  type RelationMultiSpec,
  type TextAnySpec,
  type TextSpec,
} from "@/lib/search/client";

// =============================================================================
// Option value unions
// =============================================================================
//
// Declared as literal unions rather than imported enums. They are structurally
// identical to the Prisma enums, and `definition.ts` proves it on startup.

export type CompetitionModeValue = "ONLINE" | "OFFLINE" | "HYBRID";

export type CompetitionStatusValue =
  | "UPCOMING"
  | "REGISTRATION_OPEN"
  | "REGISTRATION_CLOSED"
  | "ONGOING"
  | "COMPLETED"
  | "CANCELLED";

export type RegistrationPlatformValue =
  | "KIZUNIA"
  | "UNSTOP"
  | "DEVPOST"
  | "DEVFOLIO"
  | "DORAHACKS"
  | "HACK2SKILL"
  | "HACKEREARTH"
  | "TAIKAI"
  | "LUMA"
  | "GOOGLE_FORM"
  | "TYPEFORM"
  | "CUSTOM"
  | "OFFLINE"
  | "OTHER";

export type RegistrationTypeValue = "INDIVIDUAL" | "TEAM" | "BOTH";

export type RegistrationFeeTypeValue = "FREE" | "PAID" | "CONDITIONAL";

export type OrganizerTypeValue =
  | "COLLEGE"
  | "COMPANY"
  | "COMMUNITY"
  | "GOVERNMENT"
  | "NON_PROFIT"
  | "STARTUP"
  | "INDIVIDUAL"
  | "OPEN_SOURCE";

export type DifficultyLevelValue =
  | "BEGINNER"
  | "INTERMEDIATE"
  | "ADVANCED"
  | "OPEN";

export type CertificateTypeValue = "NONE" | "PARTICIPATION" | "WINNER";

export type EligibilityTypeValue =
  | "SCHOOL"
  | "UNDERGRADUATE"
  | "POSTGRADUATE"
  | "PHD"
  | "FRESHER"
  | "PROFESSIONAL"
  | "ENGINEERING"
  | "MANAGEMENT"
  | "DESIGN"
  | "SCIENCE"
  | "COMMERCE"
  | "ARTS"
  | "MEDICAL"
  | "LAW"
  | "OPEN"
  | "OTHER";

// =============================================================================
// Quick filters
// =============================================================================

const search: TextSpec = {
  kind: "text",
  key: "search",
  label: "Search",
  placeholder: "Search competitions or organizers",
  group: "quick",
  weight: 0,
  description:
    "Matches the competition title and the organizer's name. Substring, case-insensitive.",
};

const modes: EnumMultiSpec<CompetitionModeValue> = {
  kind: "enum-multi",
  key: "modes",
  label: "Mode",
  group: "quick",
  weight: 10,
  display: "pills",
  options: [
    { value: "ONLINE", label: "Online" },
    { value: "OFFLINE", label: "In person" },
    { value: "HYBRID", label: "Hybrid" },
  ],
};

const categories: RelationMultiSpec = {
  kind: "relation-multi",
  key: "categories",
  label: "Category",
  group: "quick",
  weight: 20,
  optionsEndpoint: "/api/v1/categories",
  searchPlaceholder: "Search categories",
  description: "The themes a competition is about.",
};

const technologies: RelationMultiSpec = {
  kind: "relation-multi",
  key: "technologies",
  label: "Technology",
  group: "quick",
  weight: 30,
  optionsEndpoint: "/api/v1/technologies",
  searchPlaceholder: "Search technologies",
  description: "Tools and stacks a competition is built around.",
};

/**
 * Location.
 *
 * Owns its three parameters by explicit name because that URL contract
 * predates this spec layer and existing links must keep resolving.
 *
 * Unlike every other filter here, its clause cannot be computed from the URL
 * alone — the place id has to be resolved against the provider first. That is
 * why `definition.ts` registers it as a *resolvable* filter. To the interface
 * it is simply another filter, which is the point: nothing in the UI layer has
 * to know how its clause is produced.
 *
 * `radius` is deliberately absent. Radius search is not implemented, and the
 * shape it would take is documented on `PlaceRadiusConfig`. Adding it later
 * means setting that one field; no other module changes.
 */
const location: PlaceSpec = {
  kind: "place",
  key: "location",
  label: "Location",
  group: "quick",
  weight: 40,
  idParam: "placeId",
  labelParam: "placeLabel",
  includeOnlineParam: "includeOnline",
  includeOnlineLabel: "Including online",
  suggestEndpoint: "/api/v1/places/autocomplete",
  placeholder: "Search for a city or place",
  description:
    "Matches competitions held in the selected place or anywhere inside it. Online competitions have no location, so include them explicitly if you want both.",
};

const registrationFeeTypes: EnumMultiSpec<RegistrationFeeTypeValue> = {
  kind: "enum-multi",
  key: "registrationFeeTypes",
  label: "Entry fee",
  group: "quick",
  weight: 50,
  display: "pills",
  options: [
    { value: "FREE", label: "Free" },
    { value: "PAID", label: "Paid" },
    {
      value: "CONDITIONAL",
      label: "Conditional",
      hint: "Free for some participants",
    },
  ],
};

const difficultyLevels: EnumMultiSpec<DifficultyLevelValue> = {
  kind: "enum-multi",
  key: "difficultyLevels",
  label: "Difficulty",
  group: "quick",
  weight: 60,
  display: "pills",
  options: [
    { value: "BEGINNER", label: "Beginner" },
    { value: "INTERMEDIATE", label: "Intermediate" },
    { value: "ADVANCED", label: "Advanced" },
    { value: "OPEN", label: "All levels" },
  ],
};

const statuses: EnumMultiSpec<CompetitionStatusValue> = {
  kind: "enum-multi",
  key: "statuses",
  label: "Stage",
  group: "quick",
  weight: 70,
  display: "checkbox",
  options: [
    { value: "UPCOMING", label: "Upcoming" },
    { value: "REGISTRATION_OPEN", label: "Registration open" },
    { value: "REGISTRATION_CLOSED", label: "Registration closed" },
    { value: "ONGOING", label: "Ongoing" },
    { value: "COMPLETED", label: "Completed" },
    { value: "CANCELLED", label: "Cancelled" },
  ],
  description:
    "Where a competition is in its lifecycle. Promoted to the quick bar because “registration still open” is the single most common thing people are actually looking for.",
};

// =============================================================================
// Advanced filters
// =============================================================================

const registrationDeadline: DateRangeSpec = {
  kind: "date-range",
  key: "registrationDeadline",
  label: "Registration deadline",
  group: "advanced",
  weight: 100,
  chipPrefix: "Deadline",
  presets: [
    { id: "next-7", label: "Next 7 days", fromDays: 0, toDays: 7 },
    { id: "next-30", label: "Next 30 days", fromDays: 0, toDays: 30 },
    { id: "next-90", label: "Next 3 months", fromDays: 0, toDays: 90 },
  ],
};

const startDate: DateRangeSpec = {
  kind: "date-range",
  key: "startDate",
  label: "Starts",
  group: "advanced",
  weight: 110,
  chipPrefix: "Starts",
  presets: [
    { id: "next-30", label: "Next 30 days", fromDays: 0, toDays: 30 },
    { id: "next-90", label: "Next 3 months", fromDays: 0, toDays: 90 },
  ],
};

const endDate: DateRangeSpec = {
  kind: "date-range",
  key: "endDate",
  label: "Ends",
  group: "advanced",
  weight: 120,
  chipPrefix: "Ends",
};

const eligibilities: EnumMultiSpec<EligibilityTypeValue> = {
  kind: "enum-multi",
  key: "eligibilities",
  label: "Eligibility",
  group: "advanced",
  weight: 130,
  display: "checkbox",
  description: "Who a competition is open to.",
  options: [
    { value: "SCHOOL", label: "School students" },
    { value: "UNDERGRADUATE", label: "Undergraduates" },
    { value: "POSTGRADUATE", label: "Postgraduates" },
    { value: "PHD", label: "PhD candidates" },
    { value: "FRESHER", label: "Freshers" },
    { value: "PROFESSIONAL", label: "Working professionals" },
    { value: "ENGINEERING", label: "Engineering" },
    { value: "MANAGEMENT", label: "Management" },
    { value: "DESIGN", label: "Design" },
    { value: "SCIENCE", label: "Science" },
    { value: "COMMERCE", label: "Commerce" },
    { value: "ARTS", label: "Arts" },
    { value: "MEDICAL", label: "Medical" },
    { value: "LAW", label: "Law" },
    { value: "OPEN", label: "Open to everyone" },
    { value: "OTHER", label: "Other" },
  ],
};

const registrationTypes: EnumMultiSpec<RegistrationTypeValue> = {
  kind: "enum-multi",
  key: "registrationTypes",
  label: "Entry format",
  group: "advanced",
  weight: 140,
  display: "pills",
  options: [
    { value: "INDIVIDUAL", label: "Solo" },
    { value: "TEAM", label: "Team" },
    { value: "BOTH", label: "Either" },
  ],
};

/**
 * Team-size bounds.
 *
 * These read as constraints on the *competition's* limits, not on a team the
 * user intends to bring, and the labels say so. `minTeamSize ≥ 4` selects
 * competitions that require at least four people — which is a different
 * question from "will a team of four be allowed", and conflating the two in
 * the copy would mislead.
 */
const minTeamSize: NumberBoundSpec = {
  kind: "number-bound",
  key: "minTeamSize",
  label: "Minimum team size",
  group: "advanced",
  weight: 150,
  chipPrefix: "Min team",
  unit: "people",
  min: 1,
  max: 50,
  description: "Competitions whose minimum team size is at least this.",
};

const maxTeamSize: NumberBoundSpec = {
  kind: "number-bound",
  key: "maxTeamSize",
  label: "Maximum team size",
  group: "advanced",
  weight: 160,
  chipPrefix: "Max team",
  unit: "people",
  min: 1,
  max: 50,
  description: "Competitions whose maximum team size is at most this.",
};

const organizerTypes: EnumMultiSpec<OrganizerTypeValue> = {
  kind: "enum-multi",
  key: "organizerTypes",
  label: "Organizer type",
  group: "advanced",
  weight: 170,
  display: "checkbox",
  options: [
    { value: "COLLEGE", label: "College" },
    { value: "COMPANY", label: "Company" },
    { value: "COMMUNITY", label: "Community" },
    { value: "GOVERNMENT", label: "Government" },
    { value: "NON_PROFIT", label: "Non-profit" },
    { value: "STARTUP", label: "Startup" },
    { value: "INDIVIDUAL", label: "Individual" },
    { value: "OPEN_SOURCE", label: "Open source" },
  ],
};

const organizers: TextAnySpec = {
  kind: "text-any",
  key: "organizers",
  label: "Organizer",
  group: "advanced",
  weight: 180,
  placeholder: "Add an organizer name",
  chipPrefix: "By",
  description:
    "Matches organizer names containing what you type. Add several to match any of them.",
};

const certificateTypes: EnumMultiSpec<CertificateTypeValue> = {
  kind: "enum-multi",
  key: "certificateTypes",
  label: "Certificate",
  group: "advanced",
  weight: 190,
  display: "pills",
  options: [
    { value: "PARTICIPATION", label: "For participating" },
    { value: "WINNER", label: "For winning" },
    { value: "NONE", label: "None offered" },
  ],
};

const registrationPlatforms: EnumMultiSpec<RegistrationPlatformValue> = {
  kind: "enum-multi",
  key: "registrationPlatforms",
  label: "Hosted on",
  group: "advanced",
  weight: 200,
  display: "checkbox",
  description: "The platform registration happens through.",
  options: [
    { value: "KIZUNIA", label: "Kizunia" },
    { value: "UNSTOP", label: "Unstop" },
    { value: "DEVPOST", label: "Devpost" },
    { value: "DEVFOLIO", label: "Devfolio" },
    { value: "DORAHACKS", label: "DoraHacks" },
    { value: "HACK2SKILL", label: "Hack2skill" },
    { value: "HACKEREARTH", label: "HackerEarth" },
    { value: "TAIKAI", label: "TAIKAI" },
    { value: "LUMA", label: "Luma" },
    { value: "GOOGLE_FORM", label: "Google Form" },
    { value: "TYPEFORM", label: "Typeform" },
    { value: "CUSTOM", label: "Its own site" },
    { value: "OFFLINE", label: "In person" },
    { value: "OTHER", label: "Other" },
  ],
};

// =============================================================================
// Registry
// =============================================================================

/**
 * Every Competition filter, addressable by name.
 *
 * `definition.ts` reads from this object when declaring the server registry,
 * so a filter's key, label and options exist in exactly one place. Referencing
 * a spec that does not exist here is a compile error there.
 */
export const competitionFilterSpecs = {
  search,
  modes,
  categories,
  technologies,
  location,
  registrationFeeTypes,
  difficultyLevels,
  statuses,
  registrationDeadline,
  startDate,
  endDate,
  eligibilities,
  registrationTypes,
  minTeamSize,
  maxTeamSize,
  organizerTypes,
  organizers,
  certificateTypes,
  registrationPlatforms,
} as const;

export type CompetitionFilterKey = keyof typeof competitionFilterSpecs;

/**
 * The specs in declaration order, validated for parameter collisions.
 *
 * The assertion runs at module load, so two filters accidentally claiming the
 * same URL parameter is a startup failure rather than one silently
 * overwriting the other's value in production.
 *
 * This is the list the interface iterates. It includes location, which is
 * resolvable rather than ordinary — a distinction that matters to the query
 * layer and to nothing above it.
 */
export const COMPETITION_FILTER_SPECS: readonly FilterSpec[] =
  assertUniqueFilterParams(Object.values(competitionFilterSpecs));

/**
 * Sort options, as plain data for the sort control.
 *
 * Mirrors the keys in `definition.ts`'s sort registry, which remains the
 * authority: an unknown token degrades to the default there, so a stale entry
 * here would produce a harmless no-op rather than an error. The registry
 * cannot be exported to the client directly because its `orderBy` entries are
 * Prisma types.
 */
export const COMPETITION_SORT_OPTIONS = [
  { key: "newest", label: "Newest" },
  { key: "registration-deadline-asc", label: "Deadline soonest" },
  { key: "start-date-asc", label: "Starting soonest" },
  { key: "start-date-desc", label: "Starting latest" },
  { key: "registration-deadline-desc", label: "Deadline latest" },
  { key: "oldest", label: "Oldest" },
  { key: "alphabetical-asc", label: "Title A–Z" },
  { key: "alphabetical-desc", label: "Title Z–A" },
] as const;

/** The sort applied when the URL names none. Must match the server registry. */
export const COMPETITION_DEFAULT_SORT = "newest";
