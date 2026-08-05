import { z } from "zod";

import { ProjectVisibility } from "@/generated/prisma";

export const UpdateProjectSchema = z.object({
  title: z.string().trim().min(1).max(150).optional(),

  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(100)
    .regex(/^[a-z0-9-]+$/)
    .optional(),

  shortDescription: z
    .string()
    .trim()
    .max(500)
    .optional(),

  content: z.string().trim().optional(),

  visibility: z
    .nativeEnum(ProjectVisibility)
    .optional(),

  logoAssetId: z.string().cuid().nullable().optional(),

  coverAssetId: z.string().cuid().nullable().optional(),

  startDate: z.coerce.date().nullable().optional(),

  endDate: z.coerce.date().nullable().optional(),
});

export type UpdateProjectDto = z.infer<
  typeof UpdateProjectSchema
>;