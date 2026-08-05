import { ProjectStatus, ProjectVisibility } from "@/generated/prisma";

export type ProjectQueryDto = {
  search?: string;

  status?: ProjectStatus;

  visibility?: ProjectVisibility;

  category?: string;

  technology?: string;

  sortBy: "createdAt" | "updatedAt" | "title";

  sortOrder: "asc" | "desc";

  page: number;

  pageSize: number;
};