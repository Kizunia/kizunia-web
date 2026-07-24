import type { HackathonMode } from "@/generated/prisma";

/**
 * Data required by the Hackathon Card.
 *
 * This DTO is consumed by the UI.
 * It intentionally hides database implementation details.
 */
export interface HackathonCardDTO {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  organizer: string;
  location: string | null;
  mode: HackathonMode;
  startDate: Date | null;
  registrationDeadline: Date | null;
  minTeamSize: number  | null;
  maxTeamSize: number  | null;
  logoUrl: string | null;
  coverUrl: string | null;
}
