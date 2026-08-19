export const ProjectErrorCode = {
  NOT_FOUND: "PROJECT_NOT_FOUND",
  DUPLICATE_SLUG: "PROJECT_DUPLICATE_SLUG",
  DELETED: "PROJECT_DELETED",
} as const;

export type ProjectErrorCode =
  (typeof ProjectErrorCode)[keyof typeof ProjectErrorCode];