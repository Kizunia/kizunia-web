import {
  ProjectVisibility,
} from "@/generated/prisma";

export interface CreateProjectDto {
  title: string;

  slug: string;

  shortDescription: string;

  content: string;

  visibility: ProjectVisibility;

  logoAssetId?: string;

  coverAssetId?: string;

  categoryIds: string[];

  technologyIds: string[];

  badgeIds: string[];

  linkIds: string[];

  startDate?: Date;

  endDate?: Date;
}