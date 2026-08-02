import {
  CertificateType,
  DifficultyLevel,
  CompetitionMode,
  CompetitionStatus,
  CompetitionVisibility,
  OrganizerType,
  RegistrationFeeType,
  RegistrationPlatform,
} from "@/generated/prisma";


export interface UpdateCompetitionRequestDTO {
  title?: string;
  slug?: string;

  shortDescription?: string | null;

  organizer?: string | null;

  content?: string;

  website?: string | null;

  registrationLink?: string | null;

  registrationPlatform?: RegistrationPlatform | null;

  registrationFee?: string | null;

  registrationFeeType?: RegistrationFeeType | null;

  organizerType?: OrganizerType | null;

  difficulty?: DifficultyLevel | null;

  certificateType?: CertificateType | null;

  mode?: CompetitionMode | null;

  visibility?: CompetitionVisibility;

  status?: CompetitionStatus | null;

  prizePool?: string | null;

  location?: string | null;

  registrationDeadline?: string | null;

  startDate?: string | null;

  endDate?: string | null;

  minTeamSize?: number | null;

  maxTeamSize?: number | null;
}
