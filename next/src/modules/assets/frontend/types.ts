/**
 * Frontend-only Asset types. Deliberately NOT imported from
 * `@/generated/prisma` — frontend code in this repo does not depend on
 * Prisma-generated types, and these mirror the backend enums exactly.
 */

export type AssetPurpose =
  | "USER_AVATAR"
  | "USER_COVER"
  | "PROJECT_LOGO"
  | "PROJECT_COVER"
  | "COMPETITION_LOGO"
  | "COMPETITION_BANNER"
  | "COMPETITION_COVER"
  | "COMPETITION_SUGGESTION_GALLERY"
  | "PORTFOLIO_RESUME"
  | "PORTFOLIO_EDUCATION_LOGO"
  | "PORTFOLIO_EXPERIENCE_LOGO"
  | "PORTFOLIO_ACHIEVEMENT_ASSET"
  | "PORTFOLIO_CERTIFICATION_ASSET"
  | "TESTIMONIAL_IMAGE"
  | "BADGE_ICON";

export type AssetStatus = "ACTIVE" | "DETACHED" | "DELETING" | "DELETED";

export type AssetCategory = "IMAGE" | "VIDEO" | "DOCUMENT";

/**
 * The finalized Asset as returned by the backend. Provider-neutral — no
 * Cloudinary-specific field ever appears here (see
 * docs/architecture/domain/assets/storage.md).
 */
export interface AssetDTO {
  id: string;
  secureUrl: string;
  publicId: string;
  format: string | null;
  mimeType: string | null;
  width: number | null;
  height: number | null;
  bytes: number | null;
  originalFilename: string | null;
  status: AssetStatus;
  category: AssetCategory;
}
