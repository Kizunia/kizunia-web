import { Prisma } from "@/generated/prisma";


import type { ProjectDetailsEntity, ProjectSummaryEntity } from "../repository";
import { CreateProjectDto, UpdateProjectDto } from "../dto/input";
import { ProjectSummaryDto, ProjectDetailsDto } from "../dto/output";
import type { ProjectPermissionsDTO } from "../authorization/dto";

export class ProjectMapper {
  // ===========================================================================
  // Helpers
  // ===========================================================================

  private static toAssetDto(
    asset: {
      id: string;
      secureUrl: string;
      width: number | null;
      height: number | null;
      format: string | null;
      mimeType: string | null;
    } | null,
  ) {
    if (!asset) {
      return null;
    }

    return {
      id: asset.id,
      url: asset.secureUrl,
      width: asset.width,
      height: asset.height,
      format: asset.format,
      mimeType: asset.mimeType,
    };
  }

  // ===========================================================================
  // Summary DTO
  // ===========================================================================

  static toSummaryDto(project: ProjectSummaryEntity): ProjectSummaryDto {
    return {
      id: project.id,

      title: project.title,

      slug: project.slug,

      shortDescription: project.shortDescription,

      visibility: project.visibility,

      status: project.status,

      startDate: project.startDate,

      endDate: project.endDate,

      logo: this.toAssetDto(project.logoAsset),
    };
  }

  static toSummaryDtos(projects: ProjectSummaryEntity[]): ProjectSummaryDto[] {
    return projects.map((project) => this.toSummaryDto(project));
  }

  // ===========================================================================
  // Prisma
  // ===========================================================================

  static toCreateInput(dto: CreateProjectDto): Prisma.ProjectCreateInput {
    return {
      title: dto.title,

      slug: dto.slug,

      shortDescription: dto.shortDescription,
    };
  }

  static toUpdateInput(dto: UpdateProjectDto): Prisma.ProjectUpdateInput {
    return {
      ...(dto.title !== undefined && {
        title: dto.title,
      }),

      ...(dto.slug !== undefined && {
        slug: dto.slug,
      }),

      ...(dto.shortDescription !== undefined && {
        shortDescription: dto.shortDescription,
      }),

      ...(dto.visibility !== undefined && {
        visibility: dto.visibility,
      }),

      ...(dto.startDate !== undefined && {
        startDate: dto.startDate,
      }),

      ...(dto.endDate !== undefined && {
        endDate: dto.endDate,
      }),
    };
  }

  // ===========================================================================
  // Details DTO
  // ===========================================================================

  static toDetailsDto(
    project: ProjectDetailsEntity,
    permissions: ProjectPermissionsDTO,
  ): ProjectDetailsDto {
    return {
      id: project.id,

      title: project.title,

      slug: project.slug,

      shortDescription: project.shortDescription,

      content: project.content?.content ?? null,

      visibility: project.visibility,

      status: project.status,

      startDate: project.startDate,

      endDate: project.endDate,

      createdAt: project.createdAt,

      updatedAt: project.updatedAt,

      logo: this.toAssetDto(project.logoAsset),

      cover: this.toAssetDto(project.coverAsset),

      members: project.members.map((member) => ({
        role: member.role,

        joinedAt: member.joinedAt,

        user: {
          id: member.user.id,

          name: member.user.name,

          username: member.user.username,

          image: member.user.image,

          avatar: this.toAssetDto(member.user.avatarAsset),
        },
      })),

      categories: project.categories.map(({ category }) => ({
        id: category.id,

        name: category.name,

        slug: category.slug,
      })),

      technologies: project.technologies.map(({ technology }) => ({
        id: technology.id,

        name: technology.name,

        slug: technology.slug,

        iconUrl: technology.iconUrl,
      })),

      badges: project.badges.map((projectBadge) => ({
        issuedAt: projectBadge.issuedAt,

        badge: {
          id: projectBadge.badge.id,

          name: projectBadge.badge.name,

          description: projectBadge.badge.description,

          icon: this.toAssetDto(projectBadge.badge.iconAsset),
        },
      })),

      links: project.links.map((link) => ({
        id: link.id,

        title: link.title,

        url: link.url,

        type: link.type,

        order: link.order,
      })),

      competitions: project.competitions.map((competitionProject) => ({
        submittedAt: competitionProject.submittedAt,

        competition: {
          id: competitionProject.competition.id,

          title: competitionProject.competition.title,

          slug: competitionProject.competition.slug,
        },
      })),

      testimonials: project.testimonials.map((testimonial) => ({
        id: testimonial.id,

        name: testimonial.name,

        position: testimonial.position,

        company: testimonial.company,

        message: testimonial.message,

        rating: testimonial.rating,

        displayOrder: testimonial.displayOrder,

        image: this.toAssetDto(testimonial.imageAsset),
      })),

      statistics: {
        memberCount: project.members.length,

        technologyCount: project.technologies.length,

        categoryCount: project.categories.length,

        badgeCount: project.badges.length,

        testimonialCount: project.testimonials.length,

        competitionCount: project.competitions.length,
      },

      permissions,
    };
  }
}
