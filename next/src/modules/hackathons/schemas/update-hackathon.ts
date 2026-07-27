import { z } from "zod";

import {
  HackathonMode,
  HackathonStatus,
  HackathonVisibility,
  RegistrationPlatform,
} from "@/generated/prisma";
import {
  ContentSchema,
  OrganizerSchema,
  ShortDescriptionSchema,
  Slug,
  TitleSchema,
  UrlSchema,
} from "@/lib/validation/index";

export const UpdateHackathonSchema = z
  .object({
    // ---------------------------------------------------------------------
    // Basic Information
    // ---------------------------------------------------------------------

    title: TitleSchema.optional(),
    slug: Slug.optional(),
    shortDescription: ShortDescriptionSchema.optional(),
    organizer: OrganizerSchema.nullable().optional(),

    visibility: z.nativeEnum(HackathonVisibility).optional(),

    content: ContentSchema.optional(),

    // ---------------------------------------------------------------------
    // Registration
    // ---------------------------------------------------------------------

    website: UrlSchema.nullable().optional(),
    location: z.string().trim().max(150, "Location cannot exceed 150 characters.").nullable().optional(),
    registrationLink: UrlSchema.nullable().optional(),
    prizePool: z.string().trim().max(50, "Prize Pool cannot exceed 150 characters.").nullable().optional(),
    registrationPlatform:  z.nativeEnum(RegistrationPlatform).nullable().optional(),
    
    registrationFee: z.string().trim().max(50, "registrationFee cannot exceed 150 characters.").nullable().optional(),
    // ---------------------------------------------------------------------
    // Schedule
    // ---------------------------------------------------------------------

    startDate: z.coerce.date().nullable().optional(),

    endDate: z.coerce.date().nullable().optional(),

    registrationDeadline: z.coerce.date().nullable().optional(),

    // ---------------------------------------------------------------------
    // Team
    // ---------------------------------------------------------------------

    minTeamSize: z.coerce.number().int().positive().nullable().optional(),

    maxTeamSize: z.coerce.number().int().positive().nullable().optional(),

    // ---------------------------------------------------------------------
    // Settings
    // ---------------------------------------------------------------------

    mode: z.nativeEnum(HackathonMode).nullable().optional(),

    status: z.nativeEnum(HackathonStatus).nullable().optional(),
  })

  // -------------------------------------------------------------------------
  // At least one field must be provided
  // -------------------------------------------------------------------------

  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided.",
  })

  // -------------------------------------------------------------------------
  // Cross-field validation
  // -------------------------------------------------------------------------

  .superRefine((data, ctx) => {
    if (data.startDate && data.endDate && data.startDate > data.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "End date must be after the start date.",
      });
    }

    if (
      data.registrationDeadline &&
      data.startDate &&
      data.registrationDeadline > data.startDate
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["registrationDeadline"],
        message: "Registration deadline must be before the start date.",
      });
    }

    if (
      data.minTeamSize &&
      data.maxTeamSize &&
      data.minTeamSize > data.maxTeamSize
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["maxTeamSize"],
        message:
          "Maximum team size must be greater than or equal to the minimum team size.",
      });
    }
  });

export type UpdateHackathonInput = z.infer<typeof UpdateHackathonSchema>;
