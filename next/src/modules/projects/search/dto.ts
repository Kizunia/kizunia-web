import { ProjectStatus } from "@/generated/prisma";

export type ProjectQueryDto = {
  search?: string;

  status?: ProjectStatus;

  // Visibility is a scope enforced by the repository (always PUBLIC for
  // this listing path), not a caller-supplied filter.

  category?: string;

  technology?: string;

  sortBy: "createdAt" | "updatedAt" | "title";

  sortOrder: "asc" | "desc";

  page: number;

  pageSize: number;
};