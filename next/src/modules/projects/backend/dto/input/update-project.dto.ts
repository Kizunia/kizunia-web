import {
  ProjectVisibility,
} from "@/generated/prisma";

/**
 * @deprecated Use UpdateProjectProfileDto or similar instead.
 *  */
export interface UpdateProjectDto {
  title?: string;

  slug?: string;

  shortDescription?: string;

  content?: string;

  visibility?: ProjectVisibility;

  logoAssetId?: string | null;

  coverAssetId?: string | null;

  categoryIds?: string[];

  technologyIds?: string[];

  badgeIds?: string[];

//   linkIds?: string[];

  startDate?: Date | null;

  endDate?: Date | null;
}