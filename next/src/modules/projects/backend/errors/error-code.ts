export const ProjectErrorCode = {
  NOT_FOUND: "PROJECT_NOT_FOUND",
  DUPLICATE_SLUG: "PROJECT_DUPLICATE_SLUG",
  DELETED: "PROJECT_DELETED",
  LINK_NOT_FOUND: "PROJECT_LINK_NOT_FOUND",
  LINK_REORDER_MISMATCH: "PROJECT_LINK_REORDER_MISMATCH",
} as const;

export type ProjectErrorCode =
  (typeof ProjectErrorCode)[keyof typeof ProjectErrorCode];