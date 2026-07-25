import type {
  HackathonMode,
  RegistrationPlatform,
  RegistrationFeeType,
  Hackathon,
  Asset,
  HackathonTechnology,
  HackathonCategory,
  Prisma,
} from "@/generated/prisma";

/**
 * Data required by the Hackathon Card.
 *
 * This DTO is consumed by the UI.
 * It intentionally hides database implementation details.
 */
export interface HackathonCardDTO {
  id: string;
  slug: string;
  title: string;
  shortDescription: string | null;
  organizer: string | null;
  registrationPlatform: RegistrationPlatform | null;
  location: string | null;
  mode: HackathonMode | null;
  status: string | null;
  startDate: Date | null;
  registrationDeadline: Date | null;
  registrationFeeType: RegistrationFeeType | null;
  minTeamSize: number | null;
  maxTeamSize: number | null;
  logoUrl: string | null;
  coverUrl: string | null;
}

// export interface CompetitionDetailDTO extends Hackathon {
//   //TODO: remove some of these fields that are not needed in the UI, and add any additional fields that are needed for the UI.
//   logoAsset: Asset | null;
//   coverAsset: Asset | null;
//   technologies: Technology[];
//   categories: Category[];
// }

export type CompetitionDetailDTO = Prisma.HackathonGetPayload<{
  include: {
    logoAsset: true;
    coverAsset: true;
    bannerAsset: true;

    categories: {
      include: {
        category: true;
      };
    };

    technologies: {
      include: {
        technology: true;
      };
    };

    eligibilities: true;
  };
}>;

export type CompetitionWithRelations = CompetitionDetailDTO;
