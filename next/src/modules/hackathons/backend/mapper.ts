/**
 * Hackathons Module - Mapper
 *
 * Responsible for converting between database models and DTOs.
 * Prisma models should never be returned directly.
 */
import { RegistrationPlatform, type Prisma } from "@/generated/prisma";
import type { CompetitionEditDTO } from "../types/edit-dto";
import type {
  CompetitionDetailDTO,
  CompetitionWithRelations,
  HackathonCardDTO,
} from "../types/dto";
import { CompetitionRepository } from "./repository";

/**
 * Prisma payload used when loading Hackathon cards.
 *
 * Keep this type in sync with the repository's `include` clause.
 */
type HackathonWithAssets = Prisma.HackathonGetPayload<{
  include: {
    logoAsset: true;
    coverAsset: true;
  };
}>;

export class CompetitionMapper {
  /**
   * Converts a Prisma Hackathon model into a UI-friendly public DTO.\
   */
  toCardDTO(hackathon: HackathonWithAssets): HackathonCardDTO {
    return {
      id: hackathon.id,
      slug: hackathon.slug,
      title: hackathon.title,
      shortDescription: hackathon.shortDescription,
      organizer: hackathon.organizer,
      registrationPlatform: hackathon.registrationPlatform,
      mode: hackathon.mode,
      startDate: hackathon.startDate,
      logoUrl: hackathon.logoAsset?.secureUrl ?? null,
      coverUrl: hackathon.coverAsset?.secureUrl ?? null,
      location: hackathon.location,
      registrationDeadline: hackathon.registrationDeadline,
      minTeamSize: hackathon.minTeamSize,
      maxTeamSize: hackathon.maxTeamSize,
      status: hackathon.status,
      registrationFeeType: hackathon.registrationFeeType,
    };
  }

  toDetailDTO(hackathon: CompetitionWithRelations): CompetitionDetailDTO {
    // public DTO for competition details
    return {
      ...hackathon,
    };
  }

  /**
   * Converts multiple Hackathons.
   */
  toCardDTOs(hackathons: HackathonWithAssets[]): HackathonCardDTO[] {
    return hackathons.map((hackathon) => this.toCardDTO(hackathon));
  }

  toEditDTO(
    // admin DTO for competition edit
    hackathon: Awaited<
      ReturnType<typeof CompetitionRepository.findByIdForEdit>
    >,
  ): CompetitionEditDTO {
    return {
      id: hackathon.id,

      title: hackathon.title,
      slug: hackathon.slug,
      shortDescription: hackathon.shortDescription,

      organizer: hackathon.organizer,

      website: hackathon.website,

      registrationLink: hackathon.registrationLink,

      content: hackathon.content?.content ?? "",

      mode: hackathon.mode,

      visibility: hackathon.visibility,

      status: hackathon.status,

      location: hackathon.location,

      prizePool: hackathon.prizePool?.toString() ?? null,

      minTeamSize: hackathon.minTeamSize,

      maxTeamSize: hackathon.maxTeamSize,

      registrationDeadline:
        hackathon.registrationDeadline?.toISOString() ?? null,

      startDate: hackathon.startDate?.toISOString() ?? null,

      endDate: hackathon.endDate?.toISOString() ?? null,

      registrationPlatform: hackathon.registrationPlatform,

      registrationFee: hackathon.registrationFee,

      registrationFeeType: hackathon.registrationFeeType,

      organizerType: hackathon.organizerType,

      difficulty: hackathon.difficulty,

      certificateType: hackathon.certificateType,
     

      logoAsset: hackathon.logoAsset
        ? {
            secureUrl: hackathon.logoAsset.secureUrl,
          }
        : null,

      coverAsset: hackathon.coverAsset
        ? {
            secureUrl: hackathon.coverAsset.secureUrl,
          }
        : null,

      bannerAsset: hackathon.bannerAsset
        ? {
            secureUrl: hackathon.bannerAsset.secureUrl,
          }
        : null,

      categories: hackathon.categories.map((c) => ({
        id: c.category.id,
        name: c.category.name,
        slug: c.category.slug,
      })),

      technologies: hackathon.technologies.map((t) => ({
        id: t.technology.id,
        name: t.technology.name,
        slug: t.technology.slug,
      })),
    };
  }
}

export const competitionMapper = new CompetitionMapper();
