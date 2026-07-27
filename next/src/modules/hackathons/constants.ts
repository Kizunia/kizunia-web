/**
 * Hackathons Module - Constants
 */
// src/modules/hackathons/constants.ts

import {
  HackathonStatus,
  HackathonVisibility,
  HackathonMode,
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

export const HACKATHON_STATUS_OPTIONS: {
  value: HackathonStatus;
  label: string;
}[] = [
  {
    value: HackathonStatus.UPCOMING,
    label: "Upcoming",
  },
  {
    value: HackathonStatus.REGISTRATION_OPEN,
    label: "Registration Open",
  },
  {
    value: HackathonStatus.REGISTRATION_CLOSED,
    label: "Registration Closed",
  },
  {
    value: HackathonStatus.ONGOING,
    label: "Ongoing",
  },
  {
    value: HackathonStatus.COMPLETED,
    label: "Completed",
  },
  {
    value: HackathonStatus.CANCELLED,
    label: "Cancelled",
  },
] as const;

export const HACKATHON_VISIBILITY_OPTIONS: {
  value: HackathonVisibility;
  label: string;
}[] = [
  {
    value: HackathonVisibility.PUBLIC,
    label: "Public",
  },
  {
    value: HackathonVisibility.PRIVATE,
    label: "Private",
  },
] as const;

export const HACKATHON_MODE_OPTIONS: { value: HackathonMode; label: string }[] =
  [
    {
      value: HackathonMode.ONLINE,
      label: "Online",
    },
    {
      value: HackathonMode.OFFLINE,
      label: "Offline",
    },
    {
      value: HackathonMode.HYBRID,
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
