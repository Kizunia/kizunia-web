import { HackathonMode } from "@/generated/prisma";

export interface HackathonCardDTO {
  id: string;
  slug: string;

  title: string;
  shortDescription: string;
  organizer: string;

  mode: HackathonMode;

  startDate: Date | null;

  logoUrl: string | null;
  coverUrl: string | null;
}