import { z } from "zod";

import { ProjectVisibility } from "@/generated/prisma";

export const CreateProjectSchema = z.object({
  title: z.string().trim().min(1).max(150),

  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(100)
    .regex(/^[a-z0-9-]+$/),

  shortDescription: z
    .string()
    .trim()
    .min(1)
    .max(500),

  content: z.string().trim().min(1),

  visibility: z
    .nativeEnum(ProjectVisibility)
    .default(ProjectVisibility.PUBLIC),

  logoAssetId: z.string().cuid().optional(),

  coverAssetId: z.string().cuid().optional(),

  startDate: z.coerce.date().nullable().optional(),

  endDate: z.coerce.date().nullable().optional(),
});

export type CreateProjectDto = z.infer<
  typeof CreateProjectSchema
>;