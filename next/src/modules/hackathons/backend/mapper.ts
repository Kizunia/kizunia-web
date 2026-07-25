/**
 * Hackathons Module - Mapper
 *
 * Responsible for converting between database models and DTOs.
 * Prisma models should never be returned directly.
 */
import type { Prisma } from "@/generated/prisma";

import type { CompetitionDetailDTO, CompetitionWithRelations, HackathonCardDTO } from "../types/dto";

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

  toDetailDTO(hackathon: CompetitionWithRelations): CompetitionDetailDTO { // public DTO for competition details
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
}

export const competitionMapper = new CompetitionMapper();
