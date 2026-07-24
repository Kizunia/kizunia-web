import { z } from "zod";

import {
    HackathonMode,
    HackathonStatus,
    HackathonVisibility,
} from "@/generated/prisma";
import { DocumentationSchema, OrganizerSchema, ShortDescriptionSchema, Slug, TitleSchema, UrlSchema } from "@/lib/validation/index";


export const UpdateHackathonSchema = z
    .object({
        // ---------------------------------------------------------------------
        // Basic Information
        // ---------------------------------------------------------------------

        title: TitleSchema.optional(),
        slug: Slug.optional(),
        shortDescription: ShortDescriptionSchema.optional(),

        organizer: OrganizerSchema.optional(),

        documentation: DocumentationSchema.optional(),

        // ---------------------------------------------------------------------
        // Registration
        // ---------------------------------------------------------------------

        website: UrlSchema.optional(),

        registrationLink: UrlSchema.optional(),

        // ---------------------------------------------------------------------
        // Schedule
        // ---------------------------------------------------------------------

        startDate: z.coerce.date().optional(),

        endDate: z.coerce.date().optional(),

        registrationDeadline: z.coerce.date().optional(),

        // ---------------------------------------------------------------------
        // Team
        // ---------------------------------------------------------------------

        minTeamSize: z.coerce.number().int().positive().optional(),

        maxTeamSize: z.coerce.number().int().positive().optional(),

        // ---------------------------------------------------------------------
        // Settings
        // ---------------------------------------------------------------------

        mode: z.nativeEnum(HackathonMode).optional(),

        status: z.nativeEnum(HackathonStatus).optional(),

        visibility: z.nativeEnum(HackathonVisibility).optional(),
    })

    // -------------------------------------------------------------------------
    // At least one field must be provided
    // -------------------------------------------------------------------------

    .refine(
        (data) => Object.keys(data).length > 0,
        {
            message: "At least one field must be provided.",
        },
    )

    // -------------------------------------------------------------------------
    // Cross-field validation
    // -------------------------------------------------------------------------

    .superRefine((data, ctx) => {
        if (
            data.startDate &&
            data.endDate &&
            data.startDate > data.endDate
        ) {
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
                message:
                    "Registration deadline must be before the start date.",
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