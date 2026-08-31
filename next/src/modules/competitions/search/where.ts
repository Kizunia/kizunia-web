import type { Prisma } from "@/generated/prisma";

import type { CompetitionSearchInput } from "./schema";

export class CompetitionWhereBuilder {
  static build(filters: CompetitionSearchInput): Prisma.CompetitionWhereInput {
    const AND: Prisma.CompetitionWhereInput[] = [];

    AND.push({
      deletedAt: null,
      // visibility: "PUBLIC",
    });

    this.buildSearch(filters, AND);

    this.buildCompetition(filters, AND);

    this.buildOrganizer(filters, AND);

    this.buildCategories(filters, AND);

    this.buildTechnologies(filters, AND);

    this.buildEligibility(filters, AND);

    this.buildTeam(filters, AND);

    this.buildDates(filters, AND);

    this.buildLocation(filters, AND);

    return {
      AND,
    };
  }

  // ===========================================================================
  // Search
  // ===========================================================================

  private static buildSearch(
    filters: CompetitionSearchInput,
    AND: Prisma.CompetitionWhereInput[],
  ) {
    if (!filters.search) return;

    AND.push({
      OR: [
        {
          title: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
        {
          organizer: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
      ],
    });
  }

  // ===========================================================================
  // Competition
  // ===========================================================================

  private static buildCompetition(
    filters: CompetitionSearchInput,
    AND: Prisma.CompetitionWhereInput[],
  ) {
    if (filters.modes?.length) {
      AND.push({
        mode: {
          in: filters.modes,
        },
      });
    }

    if (filters.statuses?.length) {
      AND.push({
        status: {
          in: filters.statuses,
        },
      });
    }

    if (filters.registrationPlatforms?.length) {
      AND.push({
        registrationPlatform: {
          in: filters.registrationPlatforms,
        },
      });
    }

    if (filters.registrationTypes?.length) {
      AND.push({
        registrationType: {
          in: filters.registrationTypes,
        },
      });
    }

    if (filters.registrationFeeTypes?.length) {
      AND.push({
        registrationFeeType: {
          in: filters.registrationFeeTypes,
        },
      });
    }

    if (filters.organizerTypes?.length) {
      AND.push({
        organizerType: {
          in: filters.organizerTypes,
        },
      });
    }

    if (filters.difficultyLevels?.length) {
      AND.push({
        difficulty: {
          in: filters.difficultyLevels,
        },
      });
    }

    if (filters.certificateTypes?.length) {
      AND.push({
        certificateType: {
          in: filters.certificateTypes,
        },
      });
    }
  }

  // ===========================================================================
  // Organizer
  // ===========================================================================

  private static buildOrganizer(
    filters: CompetitionSearchInput,
    AND: Prisma.CompetitionWhereInput[],
  ) {
    if (filters.organizers?.length) {
      AND.push({
        OR: filters.organizers.map((organizer) => ({
          organizer: {
            contains: organizer,
            mode: "insensitive",
          },
        })),
      });
    }
  }

  // ===========================================================================
  // Categories
  // ===========================================================================

  private static buildCategories(
    filters: CompetitionSearchInput,
    AND: Prisma.CompetitionWhereInput[],
  ) {
    if (!filters.categories?.length) return;

    AND.push({
      categories: {
        some: {
          category: {
            slug: {
              in: filters.categories,
            },
          },
        },
      },
    });
  }

  // ===========================================================================
  // Technologies
  // ===========================================================================

  private static buildTechnologies(
    filters: CompetitionSearchInput,
    AND: Prisma.CompetitionWhereInput[],
  ) {
    if (!filters.technologies?.length) return;

    AND.push({
      technologies: {
        some: {
          technology: {
            slug: {
              in: filters.technologies,
            },
          },
        },
      },
    });
  }

  // ===========================================================================
  // Eligibility
  // ===========================================================================

  private static buildEligibility(
    filters: CompetitionSearchInput,
    AND: Prisma.CompetitionWhereInput[],
  ) {
    if (!filters.eligibilities?.length) return;

    AND.push({
      eligibilities: {
        some: {
          type: {
            in: filters.eligibilities,
          },
        },
      },
    });
  }

  // ===========================================================================
  // Team
  // ===========================================================================

  private static buildTeam(
    filters: CompetitionSearchInput,
    AND: Prisma.CompetitionWhereInput[],
  ) {
    if (filters.minTeamSize) {
      AND.push({
        minTeamSize: {
          gte: filters.minTeamSize,
        },
      });
    }

    if (filters.maxTeamSize) {
      AND.push({
        maxTeamSize: {
          lte: filters.maxTeamSize,
        },
      });
    }
  }

  // ===========================================================================
  // Dates
  // ===========================================================================

  private static buildDates(
    filters: CompetitionSearchInput,
    AND: Prisma.CompetitionWhereInput[],
  ) {
    if (filters.startDateFrom || filters.startDateTo) {
      const startDate: Prisma.DateTimeFilter = {};

      if (filters.startDateFrom) {
        startDate.gte = filters.startDateFrom;
      }

      if (filters.startDateTo) {
        startDate.lte = filters.startDateTo;
      }

      AND.push({
        startDate,
      });
    }

    if (filters.endDateFrom || filters.endDateTo) {
      const endDate: Prisma.DateTimeFilter = {};

      if (filters.endDateFrom) {
        endDate.gte = filters.endDateFrom;
      }

      if (filters.endDateTo) {
        endDate.lte = filters.endDateTo;
      }

      AND.push({
        endDate,
      });
    }

    if (filters.registrationDeadlineFrom || filters.registrationDeadlineTo) {
      const registrationDeadline: Prisma.DateTimeFilter = {};

      if (filters.registrationDeadlineFrom) {
        registrationDeadline.gte = filters.registrationDeadlineFrom;
      }

      if (filters.registrationDeadlineTo) {
        registrationDeadline.lte = filters.registrationDeadlineTo;
      }

      AND.push({
        registrationDeadline,
      });
    }
  }

  // ===========================================================================
  // Location
  // ===========================================================================

  /**
   * Filters competitions by the places they are held at.
   *
   * All conditions are collected into a single `some`, so they must be met by
   * one location rather than spread across several. Filtering a multi-city
   * competition by "Pune" should surface it because it genuinely runs in Pune —
   * not because it runs in Maharashtra and, separately, somewhere named Pune.
   *
   * A competition with no locations never matches a location filter. That is
   * correct: the platform does not know where it is, and guessing would be
   * worse than omitting it.
   */
  private static buildLocation(
    filters: CompetitionSearchInput,
    AND: Prisma.CompetitionWhereInput[],
  ) {
    const conditions: Prisma.LocationWhereInput[] = [];

    if (filters.location) {
      conditions.push({
        OR: [
          {
            displayName: {
              contains: filters.location,
              mode: "insensitive",
            },
          },
          {
            city: {
              contains: filters.location,
              mode: "insensitive",
            },
          },
          {
            state: {
              contains: filters.location,
              mode: "insensitive",
            },
          },
          {
            country: {
              contains: filters.location,
              mode: "insensitive",
            },
          },
        ],
      });
    }

    if (filters.countries?.length) {
      conditions.push({
        OR: filters.countries.flatMap((country) => [
          {
            country: {
              equals: country,
              mode: "insensitive" as const,
            },
          },
          {
            countryCode: {
              equals: country,
              mode: "insensitive" as const,
            },
          },
        ]),
      });
    }

    if (filters.states?.length) {
      conditions.push({
        OR: filters.states.flatMap((state) => [
          {
            state: {
              equals: state,
              mode: "insensitive" as const,
            },
          },
          {
            stateCode: {
              equals: state,
              mode: "insensitive" as const,
            },
          },
        ]),
      });
    }

    if (filters.cities?.length) {
      conditions.push({
        OR: filters.cities.map((city) => ({
          city: {
            equals: city,
            mode: "insensitive" as const,
          },
        })),
      });
    }

    if (conditions.length === 0) return;

    AND.push({
      locations: {
        some: {
          location: {
            AND: conditions,
          },
        },
      },
    });
  }
}
