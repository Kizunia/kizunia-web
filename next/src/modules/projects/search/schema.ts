import { z } from "zod";

import {
  ProjectStatus,
} from "@/generated/prisma";

export const ProjectQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),

  status: z
    .string()
    .trim()
    .toUpperCase()
    .pipe(z.nativeEnum(ProjectStatus))
    .optional(),

  // Visibility is not a caller-supplied filter — the public findMany()
  // path is always scoped to PUBLIC projects in the repository. Accepting
  // it here would let a caller request non-public projects directly.

  category: z
    .string()
    .trim()
    .toLowerCase()
    .optional(),

  technology: z
    .string()
    .trim()
    .toLowerCase()
    .optional(),

  sortBy: z
    .enum([
      "createdAt",
      "updatedAt",
      "title",
    ])
    .default("createdAt"),

  sortOrder: z
    .enum([
      "asc",
      "desc",
    ])
    .default("desc"),

  page: z.coerce
    .number()
    .int()
    .positive()
    .default(1),

  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20),
});

export type ProjectQueryInput =
  z.infer<typeof ProjectQuerySchema>;