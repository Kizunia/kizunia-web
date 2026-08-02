import {
  CertificateType,
  DifficultyLevel,
  CompetitionMemberRole,
  CompetitionMode,
  CompetitionStatus,
  CompetitionVisibility,
  OrganizerType,
  RegistrationFeeType,
  RegistrationPlatform,
} from "@/generated/prisma";
import { CompetitionPermissionsDTO } from "../backend/authorization/dto";


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

  mode: CompetitionMode | null;

  visibility: CompetitionVisibility;

  status: CompetitionStatus | null;

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
export interface CompetitionEditDTOWithPermissions extends CompetitionEditDTO {


  role: CompetitionMemberRole | null;

  updatedAt: Date;

  permissions: CompetitionPermissionsDTO;
}
