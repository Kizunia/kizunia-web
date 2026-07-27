import {
  CertificateType,
  DifficultyLevel,
  HackathonMode,
  HackathonStatus,
  HackathonVisibility,
  OrganizerType,
  RegistrationFeeType,
  RegistrationPlatform,
} from "@/generated/prisma";

export interface CompetitionEditDTO {
  id: string;

  // ---------------------------------------------------------------------------
  // Basic
  // ---------------------------------------------------------------------------

  title: string;
  slug: string;

  shortDescription: string | null;

  organizer: string | null;

  content: string;

  // ---------------------------------------------------------------------------
  // Registration
  // ---------------------------------------------------------------------------

  website: string | null;

  registrationLink: string | null;

  registrationPlatform: RegistrationPlatform | null;

  registrationFee: string | null;

  registrationFeeType: RegistrationFeeType | null;

  // ---------------------------------------------------------------------------
  // Event
  // ---------------------------------------------------------------------------

  mode: HackathonMode | null;

  visibility: HackathonVisibility;

  status: HackathonStatus | null;

  organizerType: OrganizerType | null;

  difficulty: DifficultyLevel | null;

  certificateType: CertificateType | null;

  prizePool: string | null;

  location: string | null;

  // ---------------------------------------------------------------------------
  // Schedule
  // ---------------------------------------------------------------------------

  registrationDeadline: string | null;

  startDate: string | null;

  endDate: string | null;

  // ---------------------------------------------------------------------------
  // Team
  // ---------------------------------------------------------------------------

  minTeamSize: number | null;

  maxTeamSize: number | null;

  // ---------------------------------------------------------------------------
  // Assets
  // ---------------------------------------------------------------------------

  logoAsset: {
    secureUrl: string;
  } | null;

  coverAsset: {
    secureUrl: string;
  } | null;

  bannerAsset: {
    secureUrl: string;
  } | null;

  // ---------------------------------------------------------------------------
  // Relations
  // ---------------------------------------------------------------------------

  categories: {
    id: string;
    name: string;
    slug: string;
  }[];

  technologies: {
    id: string;
    name: string;
    slug: string;
  }[];
}
