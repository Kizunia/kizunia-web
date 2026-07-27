import { z } from "zod";

export const CreateAssetSchema = z.object({
  publicId: z.string().min(1),

  secureUrl: z.string().url(),

  format: z.string().nullable(),

  mimeType: z.string().nullable(),

  width: z.number().int().positive().nullable(),

  height: z.number().int().positive().nullable(),

  bytes: z.number().int().nonnegative().nullable(),

  checksum: z.string().nullable(),

  originalFilename: z.string().nullable(),
});

export type CreateAssetInput = z.infer<typeof CreateAssetSchema>;