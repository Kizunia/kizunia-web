import { z } from "zod";

import {
  CertificateType,
  DifficultyLevel,
  CompetitionMode,
  CompetitionStatus,
  CompetitionVisibility,
  OrganizerType,
  RegistrationFeeType,
  RegistrationPlatform,
} from "@/generated/prisma";
import {
  ContentSchema,
  OrganizerSchema,
  ShortDescriptionSchema,
  SlugSchema,
  TitleSchema,
  UrlSchema,
} from "@/lib/validation/index";

export const UpdateCompetitionSchema = z
  .object({
    // ---------------------------------------------------------------------
    // Basic Information
    // ---------------------------------------------------------------------

    title: TitleSchema.optional(),
    slug: SlugSchema.optional(),
    shortDescription: ShortDescriptionSchema.nullable().optional(),
    organizer: OrganizerSchema.nullable().optional(),

    visibility: z.nativeEnum(CompetitionVisibility).optional(),

    content: ContentSchema.optional(),

    // ---------------------------------------------------------------------
    // Registration
    // ---------------------------------------------------------------------

    website: UrlSchema.nullable().optional(),
    // Locations are not part of this payload — they are managed through
    // /admin/competitions/[id]/locations, which owns their ordering and dates.
    registrationLink: UrlSchema.nullable().optional(),
    prizePool: z
      .string()
      .trim()
      .max(50, "Prize Pool cannot exceed 150 characters.")
      .nullable()
      .optional(),
    registrationPlatform: z
      .nativeEnum(RegistrationPlatform)
      .nullable()
      .optional(),
    registrationFeeType: z
      .nativeEnum(RegistrationFeeType)
      .nullable()
      .optional(),

    organizerType: z.nativeEnum(OrganizerType).nullable().optional(),

    difficulty: z.nativeEnum(DifficultyLevel).nullable().optional(),

    certificateType: z.nativeEnum(CertificateType).nullable().optional(),

    registrationFee: z
      .string()
      .trim()
      .max(50, "registrationFee cannot exceed 150 characters.")
      .nullable()
      .optional(),
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

    mode: z.nativeEnum(CompetitionMode).nullable().optional(),

    status: z.nativeEnum(CompetitionStatus).nullable().optional(),
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

export type UpdateCompetitionInput = z.infer<typeof UpdateCompetitionSchema>;
