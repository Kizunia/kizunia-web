import { z } from "zod";

import {
  ProjectStatus,
  ProjectVisibility,
} from "@/generated/prisma";

export const ProjectQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),

  status: z
    .string()
    .trim()
    .toUpperCase()
    .pipe(z.nativeEnum(ProjectStatus))
    .optional(),

  visibility: z
    .string()
    .trim()
    .toUpperCase()
    .pipe(z.nativeEnum(ProjectVisibility))
    .optional(),

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