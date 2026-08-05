import {
  ProjectStatus,
  ProjectVisibility,
} from "@/generated/prisma";

export interface ProjectSummaryDto {
  id: string;

  title: string;

  slug: string;

  shortDescription: string;

  logo: {
    id: string;
    url: string;
  } | null;

  visibility: ProjectVisibility;

  status: ProjectStatus;

  startDate: Date | null;

  endDate: Date | null;
}