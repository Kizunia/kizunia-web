import {
  LinkType,
  ProjectRole,
  ProjectStatus,
  ProjectVisibility,
} from "@/generated/prisma";
import type { ProjectPermissionsDTO } from "../../authorization/dto";

interface ProjectAssetDto {
  id: string;

  url: string;

  width: number | null;

  height: number | null;

  format: string | null;

  mimeType: string | null;
}

export interface ProjectDetailsDto {
  // ===========================================================================
  // Basic Information
  // ===========================================================================

  id: string;

  title: string;

  slug: string;

  shortDescription: string;

  content: string | null;

  visibility: ProjectVisibility;

  status: ProjectStatus;

  startDate: Date | null;

  endDate: Date | null;

  createdAt: Date;

  updatedAt: Date;

  // ===========================================================================
  // Assets
  // ===========================================================================

  logo: ProjectAssetDto | null;

  cover: ProjectAssetDto | null;

  // ===========================================================================
  // Members
  // ===========================================================================

  members: {
    role: ProjectRole;

    joinedAt: Date;

    user: {
      id: string;

      name: string;

      username: string | null;

      image: string | null;

      avatar: ProjectAssetDto | null;
    };
  }[];

  // ===========================================================================
  // Categories
  // ===========================================================================

  categories: {
    id: string;

    name: string;

    slug: string;
  }[];

  // ===========================================================================
  // Technologies
  // ===========================================================================

  technologies: {
    id: string;

    name: string;

    slug: string;

    iconUrl: string | null;
  }[];

  // ===========================================================================
  // Badges
  // ===========================================================================

  badges: {
    issuedAt: Date;

    badge: {
      id: string;

      name: string;

      description: string | null;

      icon: ProjectAssetDto | null;
    };
  }[];

  // ===========================================================================
  // Links
  // ===========================================================================

  links: {
    id: string;

    title: string;

    url: string;

    type: LinkType;

    order: number;
  }[];

  // ===========================================================================
  // Competitions
  // ===========================================================================

  competitions: {
    submittedAt: Date;

    competition: {
      id: string;

      title: string;

      slug: string;
    };
  }[];

  // ===========================================================================
  // Testimonials
  // ===========================================================================

  testimonials: {
    id: string;

    name: string;

    position: string | null;

    company: string | null;

    message: string;

    rating: number | null;

    displayOrder: number;

    image: ProjectAssetDto | null;
  }[];

  // ===========================================================================
  // Statistics
  // ===========================================================================

  statistics: {
    memberCount: number;

    technologyCount: number;

    categoryCount: number;

    badgeCount: number;

    testimonialCount: number;

    competitionCount: number;
  };

  // ===========================================================================
  // Permissions
  // ===========================================================================

  /**
   * The current actor's abilities on this project. Frontend components
   * should render read-only vs. editable state from this object rather
   * than inspecting roles/membership themselves.
   */
  permissions: ProjectPermissionsDTO;
}