/**
 * Cloudinary Storage Provider Adapter
 *
 * The ONLY server-side module allowed to import the `cloudinary` SDK or
 * reference Cloudinary-specific concepts. Implements the provider-neutral
 * `StorageProvider` contract — see storage-provider.ts and
 * docs/architecture/domain/assets/storage.md.
 *
 * Upload authorization is fully server-decided: the client receives exactly
 * the params below and cannot choose its own public id, folder, or resource
 * type. Confirmation re-fetches the object from Cloudinary's Admin API
 * rather than trusting anything the client reports.
 */

import { v2 as cloudinary } from "cloudinary";

import { AssetCategory } from "@/generated/prisma";
import { ExternalServiceError } from "@/lib/errors";

import type {
  StorageAuthorizeUploadInput,
  StorageConfirmUploadInput,
  StorageConfirmedObject,
  StorageProvider,
  StorageUploadAuthorization,
} from "./storage-provider";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const UPLOAD_FOLDER = "kizunia/assets";

/**
 * Cloudinary resource type per Asset category. Isolated here — nothing
 * outside this file should ever need to know these strings.
 */
function resourceTypeFor(category: AssetCategory): "image" | "video" | "raw" {
  switch (category) {
    case AssetCategory.IMAGE:
      return "image";
    case AssetCategory.VIDEO:
      return "video";
    case AssetCategory.DOCUMENT:
      return "raw";
  }
}

/**
 * Cloudinary reports a bare format ("png", "pdf", ...), not a MIME type.
 * Policies are expressed in real MIME types (see policies/upload-policy.ts),
 * so the confirmed result has to be translated here — the one place that's
 * allowed to know Cloudinary's format vocabulary — rather than synthesized
 * from the resource type string, which would produce nonsense like
 * "raw/pdf" instead of "application/pdf".
 */
const FORMAT_TO_MIME_TYPE: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  pdf: "application/pdf",
  mp4: "video/mp4",
};

const MIME_TYPE_TO_EXTENSION: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "application/pdf": "pdf",
  "video/mp4": "mp4",
};

function mimeTypeFromFormat(format: string | undefined): string | null {
  if (!format) {
    return null;
  }

  return FORMAT_TO_MIME_TYPE[format.toLowerCase()] ?? null;
}

/**
 * Builds the full, final Cloudinary public id for an upload.
 *
 * This must produce the identical value at authorize time and at confirm
 * time, because it is both what gets signed and what gets looked up.
 *
 * Two Cloudinary behaviours make that non-obvious:
 *
 * 1. Passing a separate `folder` upload param makes Cloudinary store the
 *    object at `{folder}/{public_id}` — so the id it reports back is NOT
 *    the `public_id` that was signed. The folder is therefore baked into
 *    the public id here instead of being sent as its own parameter, which
 *    keeps signed id === stored id === looked-up id.
 *
 * 2. For `raw` resources (documents), Cloudinary makes the file extension
 *    part of the public id. Signing `.../{id}` and then looking up
 *    `.../{id}` fails, because the object is actually stored at
 *    `.../{id}.pdf`. Including the extension up front makes it stable.
 *    Image/video keep the extension in `format`, not in the public id.
 */
function buildObjectId(
  correlationId: string,
  category: AssetCategory,
  declaredMimeType: string,
): string {
  const base = `${UPLOAD_FOLDER}/${correlationId}`;

  if (resourceTypeFor(category) !== "raw") {
    return base;
  }

  const extension = MIME_TYPE_TO_EXTENSION[declaredMimeType.toLowerCase()];

  return extension ? `${base}.${extension}` : base;
}

/**
 * Extracts the useful parts of a Cloudinary SDK error for server-side logs.
 * The SDK nests its real status/message under `error`, so an unwrapped
 * throw reads as an opaque object in logs.
 */
function describeProviderError(error: unknown): {
  httpCode: number | undefined;
  message: string | undefined;
} {
  const candidate = error as
    | { error?: { http_code?: number; message?: string }; message?: string }
    | undefined;

  return {
    httpCode: candidate?.error?.http_code,
    message: candidate?.error?.message ?? candidate?.message,
  };
}

function requireCloudName(): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (!cloudName) {
    throw new ExternalServiceError({
      code: "CLOUDINARY_NOT_CONFIGURED",
      message: "Cloudinary cloud name is not configured.",
    });
  }

  return cloudName;
}

function requireApiKey(): string {
  const apiKey = process.env.CLOUDINARY_API_KEY;

  if (!apiKey) {
    throw new ExternalServiceError({
      code: "CLOUDINARY_NOT_CONFIGURED",
      message: "Cloudinary API key is not configured.",
    });
  }

  return apiKey;
}

function requireApiSecret(): string {
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!apiSecret) {
    throw new ExternalServiceError({
      code: "CLOUDINARY_NOT_CONFIGURED",
      message: "Cloudinary API secret is not configured.",
    });
  }

  return apiSecret;
}

export class CloudinaryStorageProvider implements StorageProvider {
  async authorizeUpload(
    input: StorageAuthorizeUploadInput,
  ): Promise<StorageUploadAuthorization> {
    const resourceType = resourceTypeFor(input.category);

    const timestamp = Math.floor(Date.now() / 1_000);

    // Only these parameters are ever signed. The client cannot add,
    // remove, or override any of them — Cloudinary rejects the upload if
    // the submitted params don't match what was signed.
    //
    // The upload folder is part of `public_id` rather than a separate
    // `folder` param on purpose — see buildObjectId().
    const paramsToSign = {
      public_id: buildObjectId(
        input.correlationId,
        input.category,
        input.declaredMimeType,
      ),
      timestamp,
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      requireApiSecret(),
    );

    return {
      provider: "CLOUDINARY",

      uploadUrl: `https://api.cloudinary.com/v1_1/${requireCloudName()}/${resourceType}/upload`,

      params: {
        ...paramsToSign,
        api_key: requireApiKey(),
        signature,
      },
    };
  }

  async confirmUpload(
    input: StorageConfirmUploadInput,
  ): Promise<StorageConfirmedObject> {
    const resourceType = resourceTypeFor(input.category);

    const objectId = buildObjectId(
      input.correlationId,
      input.category,
      input.declaredMimeType,
    );

    try {
      const resource = await cloudinary.api.resource(objectId, {
        resource_type: resourceType,
      });

      return {
        providerObjectId: resource.public_id,
        secureUrl: resource.secure_url,
        format: resource.format ?? null,
        mimeType: mimeTypeFromFormat(resource.format),
        width: resource.width ?? null,
        height: resource.height ?? null,
        bytes: resource.bytes ?? null,
        checksum: resource.etag ?? null,
      };
    } catch (error) {
      // Logged server-side so a confirmation failure is diagnosable without
      // a reproduction script. Deliberately not put on the error's
      // `details`, which is serialized to the client — provider internals
      // must not leak past this adapter.
      const provider = describeProviderError(error);

      console.error("Cloudinary confirmUpload failed", {
        objectId,
        resourceType,
        providerStatus: provider.httpCode,
        providerMessage: provider.message,
      });

      throw new ExternalServiceError({
        code: "CLOUDINARY_CONFIRM_FAILED",
        message: "Could not confirm the upload with the storage provider.",
        cause: error,
      });
    }
  }

  async deleteObject(
    providerObjectId: string,
    category: AssetCategory,
  ): Promise<void> {
    const resourceType = resourceTypeFor(category);

    try {
      await cloudinary.uploader.destroy(providerObjectId, {
        resource_type: resourceType,
      });
    } catch (error) {
      throw new ExternalServiceError({
        code: "CLOUDINARY_DELETE_FAILED",
        message: "Could not delete the object from the storage provider.",
        cause: error,
      });
    }
  }
}
