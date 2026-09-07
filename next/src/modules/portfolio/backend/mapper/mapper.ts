/**
 * Portfolio Module - Mapper
 *
 * Responsible for mapping between entities and DTOs.
 */

import type { CreatePortfolioDto, PortfolioEditorDto } from "../../dtos";
import type { PortfolioPublicDto } from "../../dtos";
import type { PortfolioSummaryDto } from "../../dtos";

import type {
  PortfolioEditorEntity,
  PortfolioPublicDetailsEntity,
  PortfolioSummaryEntity,
} from "../repository";

function toPublicAssetDto(
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

export class PortfolioMapper {
  // ===========================================================================
  // Read
  // ===========================================================================

  /**
   * Maps to the public API contract. Every field is picked explicitly —
   * this must never become an entity passthrough, since the entity carries
   * internal fields (userId, deletedAt, visibility, user.id, user.name,
   * raw foreign keys) that are not part of the public contract.
   */
  static toPublicDto(
    portfolio: PortfolioPublicDetailsEntity,
  ): PortfolioPublicDto {
    if (!portfolio.user.username) {
      // Structurally unreachable: the repository's public lookup always
      // filters by a non-null username. Guarded here so the DTO's
      // `user.username: string` contract is never silently violated.
      throw new Error(
        "Cannot map a portfolio to PortfolioPublicDto without an owner username.",
      );
    }

    return {
      id: portfolio.id,

      displayName: portfolio.displayName,
      headline: portfolio.headline,
      bio: portfolio.bio,

      publicContactEmail: portfolio.publicContactEmail,
      phone: portfolio.phone,
      location: portfolio.location,

      createdAt: portfolio.createdAt,

      user: {
        username: portfolio.user.username,
        avatar: toPublicAssetDto(portfolio.user.avatarAsset),
        cover: toPublicAssetDto(portfolio.user.coverAsset),
      },

      settings: portfolio.settings
        ? {
            theme: portfolio.settings.theme,
            accentColor: portfolio.settings.accentColor,
            sectionOrder: portfolio.settings.sectionOrder,
            hiddenSections: portfolio.settings.hiddenSections,
          }
        : null,

      resumeAsset: toPublicAssetDto(portfolio.resumeAsset),

      links: portfolio.links.map((link) => ({
        id: link.id,
        url: link.url,
        title: link.title,
        type: link.type,
        order: link.order,
      })),

      technologies: portfolio.technologies.map((entry) => ({
        technology: {
          id: entry.technology.id,
          name: entry.technology.name,
          slug: entry.technology.slug,
          iconUrl: entry.technology.iconUrl,
        },
        startedUsingAt: entry.startedUsingAt,
        description: entry.description,
        displayOrder: entry.displayOrder,
      })),

      education: portfolio.education.map((entry) => ({
        id: entry.id,
        institution: entry.institution,
        degree: entry.degree,
        fieldOfStudy: entry.fieldOfStudy,
        grade: entry.grade,
        description: entry.description,
        startDate: entry.startDate,
        endDate: entry.endDate,
        currentlyStudying: entry.currentlyStudying,
        institutionLogo: toPublicAssetDto(entry.institutionLogoAsset),
        displayOrder: entry.displayOrder,
      })),

      experience: portfolio.experience.map((entry) => ({
        id: entry.id,
        company: entry.company,
        position: entry.position,
        employmentType: entry.employmentType,
        location: entry.location,
        description: entry.description,
        startDate: entry.startDate,
        endDate: entry.endDate,
        currentlyWorking: entry.currentlyWorking,
        companyLogo: toPublicAssetDto(entry.companyLogoAsset),
        displayOrder: entry.displayOrder,
      })),

      achievements: portfolio.achievements.map((entry) => ({
        id: entry.id,
        title: entry.title,
        description: entry.description,
        achievedAt: entry.achievedAt,
        asset: toPublicAssetDto(entry.asset),
        displayOrder: entry.displayOrder,
      })),

      certifications: portfolio.certifications.map((entry) => ({
        id: entry.id,
        title: entry.title,
        issuer: entry.issuer,
        issueDate: entry.issueDate,
        expiryDate: entry.expiryDate,
        credentialId: entry.credentialId,
        credentialUrl: entry.credentialUrl,
        asset: toPublicAssetDto(entry.asset),
        displayOrder: entry.displayOrder,
      })),

      testimonials: portfolio.testimonials.map((entry) => ({
        id: entry.id,
        name: entry.name,
        position: entry.position,
        company: entry.company,
        message: entry.message,
        rating: entry.rating,
        displayOrder: entry.displayOrder,
        image: toPublicAssetDto(entry.imageAsset),
      })),

      projects: portfolio.projects.map((entry) => ({
        featured: entry.featured,
        displayOrder: entry.displayOrder,
        project: {
          id: entry.project.id,
          title: entry.project.title,
          slug: entry.project.slug,
          shortDescription: entry.project.shortDescription,
          logo: toPublicAssetDto(entry.project.logoAsset),
          cover: toPublicAssetDto(entry.project.coverAsset),
          technologies: entry.project.technologies.map((tech) => ({
            id: tech.technology.id,
            name: tech.technology.name,
            slug: tech.technology.slug,
            iconUrl: tech.technology.iconUrl,
          })),
          categories: entry.project.categories.map((cat) => ({
            id: cat.category.id,
            name: cat.category.name,
            slug: cat.category.slug,
          })),
        },
      })),
    };
  }

  static toEditorDto(portfolio: PortfolioEditorEntity): PortfolioEditorDto {
    return portfolio;
  }

  static toSummaryDto(portfolio: PortfolioSummaryEntity): PortfolioSummaryDto {
    return portfolio;
  }

  static toSummaryDtos(
    portfolios: PortfolioSummaryEntity[],
  ): PortfolioSummaryDto[] {
    return portfolios.map(this.toSummaryDto);
  }

  // ===========================================================================
  // Create
  // ===========================================================================

  /**
   * Maps only the data supplied by the client.
   *
   * This intentionally does NOT return a PrismaCreateInput.
   * Relations (user, assets, etc.) are attached by the service.
   */
  static toCreateData(dto: CreatePortfolioDto) {
    return {
      displayName: dto.displayName,

      headline: dto.headline,

      bio: dto.bio,

      phone: dto.phone,

      publicContactEmail: dto.publicContactEmail,

      location: dto.location,
    };
  }
}
