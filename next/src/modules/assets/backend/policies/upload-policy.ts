import { AssetCategory, AssetPurpose } from "@/generated/prisma";

/**
 * Code-defined, per-purpose upload policy. This is the authority — the
 * frontend's `accept` attribute is a UX convenience only. See
 * docs/architecture/domain/assets/policies.md.
 *
 * Deliberately not a database table: nothing in the product requires
 * runtime-editable policies, and a table would be speculative
 * infrastructure for a fixed, code-reviewed rule set.
 */
export interface UploadPolicy {
  category: AssetCategory;
  allowedMimeTypes: readonly string[];
  /** Bytes. */
  maxSize: number;
  /** Whether this purpose expects exactly one active reference (a logo, a
   * resume) vs. many (a gallery). Informational for callers — Asset itself
   * has no opinion on ordering/count; the consuming domain owns that. */
  singleActive: boolean;
  /** Whether this purpose requires a target entity to be declared up front. */
  requiresTargetEntity: boolean;
}

const MB = 1024 * 1024;

/**
 * Numeric limits below are NOT decided anywhere in the architecture docs —
 * they are explicitly marked TBD there (see policies.md, security.md). These
 * values are a deliberately conservative V1 default, isolated here so they
 * can be changed in one place without touching any calling code. Treat them
 * as an assumption to confirm, not a settled product decision.
 */
const DEFAULT_IMAGE_MAX_SIZE = 5 * MB;
const DEFAULT_DOCUMENT_MAX_SIZE = 10 * MB;

const IMAGE_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

/**
 * Portfolio resume is explicitly scoped to PDF only for V1 — see
 * docs/architecture/domain/assets/policies.md worked example. DOCX and other
 * document formats are intentionally not enabled unless a future product
 * decision adds them.
 */
const RESUME_MIME_TYPES = ["application/pdf"] as const;

function imagePolicy(overrides?: Partial<UploadPolicy>): UploadPolicy {
  return {
    category: AssetCategory.IMAGE,
    allowedMimeTypes: IMAGE_MIME_TYPES,
    maxSize: DEFAULT_IMAGE_MAX_SIZE,
    singleActive: true,
    requiresTargetEntity: true,
    ...overrides,
  };
}

export const UPLOAD_POLICIES: Record<AssetPurpose, UploadPolicy> = {
  [AssetPurpose.USER_AVATAR]: imagePolicy({ requiresTargetEntity: false }),
  [AssetPurpose.USER_COVER]: imagePolicy({ requiresTargetEntity: false }),

  [AssetPurpose.PROJECT_LOGO]: imagePolicy(),
  [AssetPurpose.PROJECT_COVER]: imagePolicy(),

  [AssetPurpose.COMPETITION_LOGO]: imagePolicy(),
  [AssetPurpose.COMPETITION_BANNER]: imagePolicy(),
  [AssetPurpose.COMPETITION_COVER]: imagePolicy(),

  [AssetPurpose.COMPETITION_SUGGESTION_GALLERY]: imagePolicy({
    singleActive: false,
  }),

  [AssetPurpose.PORTFOLIO_RESUME]: {
    category: AssetCategory.DOCUMENT,
    allowedMimeTypes: RESUME_MIME_TYPES,
    maxSize: DEFAULT_DOCUMENT_MAX_SIZE,
    singleActive: true,
    requiresTargetEntity: false,
  },

  [AssetPurpose.PORTFOLIO_EDUCATION_LOGO]: imagePolicy(),
  [AssetPurpose.PORTFOLIO_EXPERIENCE_LOGO]: imagePolicy(),
  [AssetPurpose.PORTFOLIO_ACHIEVEMENT_ASSET]: imagePolicy(),
  [AssetPurpose.PORTFOLIO_CERTIFICATION_ASSET]: imagePolicy(),

  [AssetPurpose.TESTIMONIAL_IMAGE]: imagePolicy(),
  [AssetPurpose.BADGE_ICON]: imagePolicy({ requiresTargetEntity: false }),
};

export function getUploadPolicy(purpose: AssetPurpose): UploadPolicy {
  return UPLOAD_POLICIES[purpose];
}
