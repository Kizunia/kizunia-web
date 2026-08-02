// src/modules/competitions/schemas/search.schema.ts

import { z } from "zod";

import { CompetitionMode, CompetitionStatus } from "@/generated/prisma";
import { OrganizerSchema } from "@/lib/validation/index";

 /**
   * Depricated, use src\modules\competitions\search\schema.ts CompetitionSearchSchema
   */
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
  mode: z.string().trim().toUpperCase().pipe(z.enum(CompetitionMode)).optional(),

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
    .pipe(z.nativeEnum(CompetitionStatus))
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

 /**
   * Depricated, use src\modules\competitions\search\schema.ts CompetitionSearchSchema
   */
export type SearchCompetitionsInput = z.infer<typeof searchCompetitionsSchema>;
