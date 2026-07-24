// src/modules/hackathons/schemas/search.schema.ts

import { z } from "zod";

import { HackathonMode, HackathonStatus } from "@/generated/prisma";
import { OrganizerSchema } from "@/lib/validation/index";

export const searchCompetitionsSchema = z.object({
  /**
   * Search query
   *
   * Example:
   * ?search=google
   */
  search: z.string().trim().min(1).optional(),

  /**
   * Online / Offline / Hybrid
   *
   * Example:
   * ?mode=ONLINE
   */
  mode: z.string().trim().toUpperCase().pipe(z.enum(HackathonMode)).optional(),

  /**
   * Competition lifecycle
   *
   * Example:
   * ?status=REGISTRATION_OPEN
   */
  status: z
    .string()
    .trim()
    .toUpperCase()
    .pipe(z.nativeEnum(HackathonStatus))
    .optional(),

  /**
   * Category slug
   *
   * Example:
   * ?category=ai
   */
  category: z.string().trim().toLowerCase().optional(),

  technology: z.string().trim().toLowerCase().optional(),

  minTeamSize: z.coerce.number().int().positive().optional(),

  maxTeamSize: z.coerce.number().int().positive().optional(),

  organizer: OrganizerSchema.optional(),
  
  startDate: z.coerce.date().optional(),

  endDate: z.coerce.date().optional(),

  /**
   * Sorting
   */
  sort: z.enum(["start-date", "deadline", "newest"]).default("start-date"),

  /**
   * Pagination
   */
  page: z.coerce.number().int().positive().default(1),
});

export type SearchCompetitionsInput = z.infer<typeof searchCompetitionsSchema>;
