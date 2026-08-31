import { z } from "zod";

import {
  CertificateType,
  DifficultyLevel,
  EligibilityType,
  CompetitionMode,
  CompetitionStatus,
  OrganizerType,
  RegistrationFeeType,
  RegistrationPlatform,
  RegistrationType,
} from "@/generated/prisma";

import { CompetitionSort } from "./sort";

const csv = z.string().transform((value) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean),
);

const csvUppercase = csv.transform((items) =>
  items.map((item) => item.toUpperCase()),
);

export const CompetitionSearchSchema = z.object({
  // ---------------------------------------------------------------------------
  // Search
  // ---------------------------------------------------------------------------

  search: z.string().trim().min(1).optional(),

  // ---------------------------------------------------------------------------
  // Pagination
  // ---------------------------------------------------------------------------

  page: z.coerce.number().int().positive().default(1),

  limit: z.coerce.number().int().positive().max(100).default(20),

  // ---------------------------------------------------------------------------
  // Sorting
  // ---------------------------------------------------------------------------

  sort: z
    .nativeEnum(CompetitionSort)
    .default(CompetitionSort.NEWEST),

  // ---------------------------------------------------------------------------
  // Competition
  // ---------------------------------------------------------------------------

  modes: csvUppercase.pipe(
    z.array(z.nativeEnum(CompetitionMode)),
  ).optional(),

  statuses: csv.pipe(
    z.array(z.nativeEnum(CompetitionStatus)),
  ).optional(),

  difficultyLevels: csv.pipe(
    z.array(z.nativeEnum(DifficultyLevel)),
  ).optional(),

  // ---------------------------------------------------------------------------
  // Categories
  // ---------------------------------------------------------------------------

  categories: csv.pipe(
    z.array(z.string().trim().toLowerCase()),
  ).optional(),

  technologies: csv.pipe(
    z.array(z.string().trim().toLowerCase()),
  ).optional(),

  // ---------------------------------------------------------------------------
  // Registration
  // ---------------------------------------------------------------------------

  registrationPlatforms: csv.pipe(
    z.array(z.nativeEnum(RegistrationPlatform)),
  ).optional(),

  registrationTypes: csv.pipe(
    z.array(z.nativeEnum(RegistrationType)),
  ).optional(),

  registrationFeeTypes: csv.pipe(
    z.array(z.nativeEnum(RegistrationFeeType)),
  ).optional(),

  // ---------------------------------------------------------------------------
  // Organizer
  // ---------------------------------------------------------------------------

  organizerTypes: csv.pipe(
    z.array(z.nativeEnum(OrganizerType)),
  ).optional(),

  // organizer: z.string().trim().optional(),
  organizers: csv.pipe(
    z.array(z.string().trim()),
).optional(),

  // ---------------------------------------------------------------------------
  // Eligibility
  // ---------------------------------------------------------------------------

  eligibilities: csv.pipe(
    z.array(z.nativeEnum(EligibilityType)),
  ).optional(),

  // ---------------------------------------------------------------------------
  // Team
  // ---------------------------------------------------------------------------

  minTeamSize: z.coerce.number().int().positive().optional(),

  maxTeamSize: z.coerce.number().int().positive().optional(),

  // ---------------------------------------------------------------------------
  // Dates
  // ---------------------------------------------------------------------------

  startDateFrom: z.coerce.date().optional(),

  startDateTo: z.coerce.date().optional(),

  endDateFrom: z.coerce.date().optional(),

  endDateTo: z.coerce.date().optional(),

  registrationDeadlineFrom: z.coerce.date().optional(),

  registrationDeadlineTo: z.coerce.date().optional(),

  // ---------------------------------------------------------------------------
  // Location
  // ---------------------------------------------------------------------------

  // Free text, matched against a location's display name, city, state, and
  // country so "Pune", "Maharashtra", and "India" all work without the caller
  // knowing which level of the hierarchy was actually recorded.
  location: z.string().trim().optional(),

  // Structured filters. Values within a list are OR-ed; separate lists are
  // AND-ed, and every condition must be satisfied by the *same* location — a
  // competition with a Pune qualifier and a Delhi final is not "in Pune, India
  // and Delhi, India" arbitrarily recombined.
  countries: csv.optional(),

  states: csv.optional(),

  cities: csv.optional(),

  // ---------------------------------------------------------------------------
  // Certificate
  // ---------------------------------------------------------------------------

  certificateTypes: csv.pipe(
    z.array(z.nativeEnum(CertificateType)),
  ).optional(),
});

export type CompetitionSearchInput =
  z.infer<typeof CompetitionSearchSchema>;