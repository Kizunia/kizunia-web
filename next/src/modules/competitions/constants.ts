/**
 * Competitions Module - Constants
 */
// src/modules/competitions/constants.ts

import {
  CompetitionStatus,
  CompetitionVisibility,
  CompetitionMode,
  RegistrationPlatform,
  CertificateType,
  DifficultyLevel,
  OrganizerType,
  RegistrationFeeType,
} from "@/generated/prisma";

/**
 * Number of competitions displayed per page.
 */
export const COMPETITIONS_PAGE_SIZE = 12;

/**
 * Default sorting applied when the user
 * does not explicitly choose one.
 */
export const DEFAULT_COMPETITION_SORT = "start-date" as const;

/**
 * Default page number.
 */
export const DEFAULT_COMPETITION_PAGE = 1;

export const COMPETITION_STATUS_OPTIONS: {
  value: CompetitionStatus;
  label: string;
}[] = [
  {
    value: CompetitionStatus.UPCOMING,
    label: "Upcoming",
  },
  {
    value: CompetitionStatus.REGISTRATION_OPEN,
    label: "Registration Open",
  },
  {
    value: CompetitionStatus.REGISTRATION_CLOSED,
    label: "Registration Closed",
  },
  {
    value: CompetitionStatus.ONGOING,
    label: "Ongoing",
  },
  {
    value: CompetitionStatus.COMPLETED,
    label: "Completed",
  },
  {
    value: CompetitionStatus.CANCELLED,
    label: "Cancelled",
  },
] as const;

/**
 * All four values of `CompetitionVisibility`, in the order a person deciding
 * how visible to make a competition would consider them: fully public,
 * reachable only by direct link, visible to nobody but its team, and
 * retired from active use. Every consumer of this constant — the editor's
 * general tab, the admin table's inline editor, any future visibility
 * badge — gets the complete set from this one place.
 */
export const COMPETITION_VISIBILITY_OPTIONS: {
  value: CompetitionVisibility;
  label: string;
}[] = [
  {
    value: CompetitionVisibility.PUBLIC,
    label: "Public",
  },
  {
    value: CompetitionVisibility.UNLISTED,
    label: "Unlisted",
  },
  {
    value: CompetitionVisibility.PRIVATE,
    label: "Private",
  },
  {
    value: CompetitionVisibility.ARCHIVED,
    label: "Archived",
  },
] as const;

export const COMPETITION_MODE_OPTIONS: { value: CompetitionMode; label: string }[] =
  [
    {
      value: CompetitionMode.ONLINE,
      label: "Online",
    },
    {
      value: CompetitionMode.OFFLINE,
      label: "Offline",
    },
    {
      value: CompetitionMode.HYBRID,
      label: "Hybrid",
    },
  ] as const;

export const REGISTRATION_PLATFORM_OPTIONS: {
  value: RegistrationPlatform;
  label: string;
}[] = [
  {
    value: RegistrationPlatform.DEVPOST,
    label: "Devpost",
  },
  {
    value: RegistrationPlatform.UNSTOP,
    label: "Unstop",
  },
  {
    value: RegistrationPlatform.DEVFOLIO,
    label: "Devfolio",
  },
  {
    value: RegistrationPlatform.LUMA,
    label: "Luma",
  },
  {
    value: RegistrationPlatform.CUSTOM,
    label: "Custom",
  },
] as const;

export const REGISTRATION_FEE_TYPE_OPTIONS = [
  {
    value: RegistrationFeeType.FREE,
    label: "Free",
  },
  {
    value: RegistrationFeeType.PAID,
    label: "Paid",
  },
] as const;

export const ORGANIZER_TYPE_OPTIONS = [
  {
    value: OrganizerType.COLLEGE,
    label: "College",
  },
  {
    value: OrganizerType.COMPANY,
    label: "Company",
  },
  {
    value: OrganizerType.COMMUNITY,
    label: "Community",
  },
  {
    value: OrganizerType.INDIVIDUAL,
    label: "Individual",
  },
] as const;

export const DIFFICULTY_OPTIONS = [
  {
    value: DifficultyLevel.BEGINNER,
    label: "Beginner",
  },
  {
    value: DifficultyLevel.INTERMEDIATE,
    label: "Intermediate",
  },
  {
    value: DifficultyLevel.ADVANCED,
    label: "Advanced",
  },
] as const;

export const CERTIFICATE_OPTIONS = [
  {
    value: CertificateType.PARTICIPATION,
    label: "All Participants",
  },
  {
    value: CertificateType.WINNER,
    label: "Winners Only",
  },
  {
    value: CertificateType.NONE,
    label: "No Certificate",
  },
] as const;
