import {
  HackathonMode,
  HackathonStatus,
  HackathonVisibility,
} from "@/generated/prisma";

export interface UpdateCompetitionRequestDTO {
  title?: string;

  shortDescription?: string | null;

  organizer?: string | null;

  website?: string | null;

  registrationLink?: string | null;

  content?: string;

  mode?: HackathonMode;

  visibility?: HackathonVisibility;

  status?: HackathonStatus;

  location?: string | null;

  prizePool?: string | null;

  minTeamSize?: number | null;

  maxTeamSize?: number | null;

  registrationOpen?: string | null;

  registrationDeadline?: string | null;

  startDate?: string | null;

  endDate?: string | null;
}