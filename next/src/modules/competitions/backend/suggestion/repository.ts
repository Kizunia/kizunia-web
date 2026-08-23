import prisma from "@/lib/prisma";

import type { Prisma } from "@/generated/prisma";


import { NotFoundError } from "@/lib/errors";
import { CreateCompetitionSuggestionInput } from "../../schemas/create-competition-suggestion";
import { UpdateCompetitionSuggestionInput } from "../../schemas/update-competition-suggestion";

export class CompetitionSuggestionRepository {
  // ===========================================================================
  // Read
  // ===========================================================================

  static async findById(id: string) {
    return prisma.competitionSuggestion.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        suggestionContent: true,

        competition: true,

        submittedBy: true,

        reviewedBy: true,

        links: true,

        assets: {
          include: {
            asset: true,
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    });
  }

  static async findByIdOrThrow(id: string) {
    const suggestion = await this.findById(id);

    if (!suggestion) {
      throw new NotFoundError({
        code: "competition_suggestion_not_found",
        message: "Competition suggestion not found.",
      });
    }

    return suggestion;
  }

  static async findManyBySubmitter(submittedById: string) {
    return prisma.competitionSuggestion.findMany({
      where: {
        submittedById,
        deletedAt: null,
      },

      include: {
        suggestionContent: true,

        competition: true,

        submittedBy: true,

        reviewedBy: true,

        links: true,

        assets: {
          include: {
            asset: true,
          },
          orderBy: {
            order: "asc",
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });
  }

  // ===========================================================================
  // Create
  // ===========================================================================

  static async create({
    data,
    submittedById,
  }: {
    data: CreateCompetitionSuggestionInput;
    submittedById: string;
  }) {
    return prisma.competitionSuggestion.create({
      data: {
        suggestionTitle: data.suggestionTitle,

        submittedBy: {
          connect: {
            id: submittedById,
          },
        },

        ...(data.suggestionContent !== undefined && {
          suggestionContent: {
            create: {
              content: data.suggestionContent,
            },
          },
        }),
      },

      include: {
        suggestionContent: true,
      },
    });
  }

  // ===========================================================================
  // Update
  // ===========================================================================

  static async update({
    id,
    data,
  }: {
    id: string;
    data: UpdateCompetitionSuggestionInput;
  }) {
    return prisma.$transaction(async (tx) => {
      const suggestion = await tx.competitionSuggestion.findFirst({
        where: {
          id,
          deletedAt: null,
        },

        select: {
          suggestionContentId: true,
        },
      });

      if (!suggestion) {
        throw new NotFoundError({
          code: "competition_suggestion_not_found",
          message: "Competition suggestion not found.",
        });
      }

      const updateData: Prisma.CompetitionSuggestionUpdateInput = {};

      if (data.suggestionTitle !== undefined) {
        updateData.suggestionTitle = data.suggestionTitle;
      }

      // -----------------------------------------------------------------------
      // Existing Content
      // -----------------------------------------------------------------------

      if (
        data.suggestionContent !== undefined &&
        suggestion.suggestionContentId
      ) {
        await tx.content.update({
          where: {
            id: suggestion.suggestionContentId,
          },

          data: {
            content: data.suggestionContent,

            version: {
              increment: 1,
            },
          },
        });
      }

      // -----------------------------------------------------------------------
      // Create Content
      // -----------------------------------------------------------------------

      if (
        data.suggestionContent !== undefined &&
        !suggestion.suggestionContentId
      ) {
        const content = await tx.content.create({
          data: {
            content: data.suggestionContent,
          },
        });

        updateData.suggestionContent = {
          connect: {
            id: content.id,
          },
        };
      }

      return tx.competitionSuggestion.update({
        where: {
          id,
        },

        data: updateData,

        include: {
          suggestionContent: true,

          competition: true,

          submittedBy: true,

          reviewedBy: true,

          links: true,

          assets: {
            include: {
              asset: true,
            },

            orderBy: {
              order: "asc",
            },
          },
        },
      });
    });
  }

  // ===========================================================================
  // Workflow Persistence
  // ===========================================================================

  /**
   * Persists the transition to UNDER_REVIEW.
   *
   * The service decides whether submittedAt should be populated.
   * This repository only persists the values it receives.
   */
  static async markUnderReview({
    id,
    submittedAt,
  }: {
    id: string;
    submittedAt: Date | null;
  }) {
    return prisma.competitionSuggestion.update({
      where: {
        id,
      },

      data: {
        status: "UNDER_REVIEW",

        ...(submittedAt !== null && {
          submittedAt,
        }),
      },

      include: {
        suggestionContent: true,

        competition: true,

        submittedBy: true,

        reviewedBy: true,

        links: true,

        assets: {
          include: {
            asset: true,
          },

          orderBy: {
            order: "asc",
          },
        },
      },
    });
  }

  // ===========================================================================
  // Soft Delete
  // ===========================================================================

  static async softDelete(id: string) {
    return prisma.competitionSuggestion.update({
      where: {
        id,
      },

      data: {
        deletedAt: new Date(),
      },
    });
  }
}

export const competitionSuggestionRepository =
  CompetitionSuggestionRepository;