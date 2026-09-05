/**
 * Storage Provider Contract
 *
 * Provider-neutral boundary between the Asset application layer and whatever
 * actually stores the bytes (Cloudinary today). Nothing outside
 * `storage/cloudinary.provider.ts` may import the `cloudinary` SDK or
 * reference Cloudinary-specific concepts (public_id semantics, resource
 * types, transformation syntax, etc).
 *
 * See docs/architecture/domain/assets/storage.md.
 */

import type { AssetCategory } from "@/generated/prisma";

export interface StorageUploadAuthorization {
  /** Which provider this authorization is for. Informational only. */
  provider: "CLOUDINARY";

  /** Where the client must submit the upload directly. */
  uploadUrl: string;

  /**
   * The exact, server-decided parameters the client must submit unmodified.
   * The client cannot choose its own public id, folder, or resource type —
   * these are fixed by the provider adapter for this one authorized upload.
   */
  params: Record<string, string | number>;
}

export interface StorageAuthorizeUploadInput {
  /**
   * Server-generated identifier for this upload attempt. Used as the
   * provider-side object identifier so the eventual result can be securely
   * correlated back to the UploadIntent that authorized it.
   */
  correlationId: string;

  category: AssetCategory;

  /**
   * The policy-validated MIME type this upload was authorized for.
   *
   * The provider needs it because some providers derive part of the stored
   * object's identity from the file kind, so the identifier must be built
   * the same way at authorize time and at confirm time. Always one of the
   * purpose policy's allowed types — never a raw client value.
   */
  declaredMimeType: string;

  /** Policy-enforced ceiling communicated to the provider where supported. */
  maxBytes: number;
}

export interface StorageConfirmUploadInput {
  correlationId: string;
  category: AssetCategory;
  /** Must match the value given to `authorizeUpload` for this correlation id. */
  declaredMimeType: string;
}

/**
 * Authoritative metadata read back from the provider — never trusted from
 * the client. See docs/architecture/domain/assets/security.md.
 */
export interface StorageConfirmedObject {
  providerObjectId: string;
  secureUrl: string;
  format: string | null;
  mimeType: string | null;
  width: number | null;
  height: number | null;
  bytes: number | null;
  checksum: string | null;
}

export interface StorageProvider {
  /** Prepares a scoped, single-use authorization for one upload attempt. */
  authorizeUpload(
    input: StorageAuthorizeUploadInput,
  ): Promise<StorageUploadAuthorization>;

  /**
   * Confirms a completed upload by asking the provider directly what it
   * actually holds for this correlation id — never the client's own report.
   * Throws if the provider has no matching object.
   */
  confirmUpload(
    input: StorageConfirmUploadInput,
  ): Promise<StorageConfirmedObject>;

  /** Physically removes the stored object. Idempotent: a missing object is not an error. */
  deleteObject(providerObjectId: string, category: AssetCategory): Promise<void>;
}
