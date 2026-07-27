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

  content?: string | null;

  mode?: HackathonMode | null;

  visibility?: HackathonVisibility | null;

  status?: HackathonStatus | null;

  location?: string | null;

  prizePool?: string | null;

  minTeamSize?: number | null;

  maxTeamSize?: number | null;

  registrationOpen?: string | null;

  registrationDeadline?: string | null;

  startDate?: string | null;

  endDate?: string | null;
}