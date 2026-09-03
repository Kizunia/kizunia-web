import { z } from "zod";

/**
 * Query for a taxonomy option list.
 *
 * `q` narrows by name for a searchable picker; omitted, the full list is
 * returned. `limit` is capped because this endpoint is public and unauthenticated.
 */
export const TaxonomyQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),

  limit: z.coerce.number().int().min(1).max(200).default(200),

  /**
   * Include options no public competition currently uses.
   *
   * Off by default: an option that can only ever return zero results is a
   * dead end in a filter, and offering it wastes the user's time. Admin
   * surfaces that need the complete vocabulary can ask for it.
   */
  includeEmpty: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

export type TaxonomyQuery = z.infer<typeof TaxonomyQuerySchema>;
