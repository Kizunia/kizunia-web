import prisma from "@/lib/prisma";

import type { CompetitionContext } from "./context";
import { AuthorizationActor } from "@/authorization";
import { ValidationError } from "@/lib/errors";
import { CompetitionRepository } from "../repository";
import { Competition, CompetitionMember } from "@/generated/prisma";

export class CompetitionContextResolver {
  static async resolve(params: {
    actor: AuthorizationActor;
    competitionId: string;
  }): Promise<CompetitionContext> {
    const { actor, competitionId } = params;

    if (!actor.id) {
      throw new ValidationError({
        code: "ACTOR_ID_REQUIRED",
        status: 400,
        message: "Actor ID is required to resolve competition context",
      });
    }
    const [competition, membership] = await Promise.all([
      // prisma.user.findUniqueOrThrow({ //TODO: use repo instead of directly using prisma
      //   where: {
      //     id: actorId,
      //   },
      // }),

      prisma.competition.findUniqueOrThrow({
        where: {
          id: competitionId,
        },
      }),

      prisma.competitionMember.findUnique({
        where: {
          competitionId_userId: {
            competitionId,
            userId: actor.id,
          },
        },
      }),
    ]);

    return {
      actor,
      competition,
      membership,
    };
  }
  static async resolveBySlug({
    actor,
    slug,
  }: {
    actor: AuthorizationActor;
    slug: string;
  }): Promise<CompetitionContext> {
    const competition = await CompetitionRepository.findBySlugOrThrow(slug);

    const membership =
      actor && actor.id
        ? await CompetitionRepository.findMembership(competition.id, actor.id)
        : null;

    return {
      actor: {
        id: actor?.id ?? null,
        role: actor?.role ?? null,
        banned: actor?.banned ?? null,
      },
      competition,
      membership,
    };
  }

  /**
   * Creates an authorization context from already-loaded entities.
   *
   * This should be used when the caller has already loaded the
   * competition and membership, avoiding unnecessary database queries.
   */
  static fromData(params: {
    actor: AuthorizationActor;
    competition: Competition;
    membership: CompetitionMember | null;
  }): CompetitionContext {
    const { actor, competition, membership } = params;

    return {
      actor: {
        id: actor.id,
        role: actor.role,
        banned: actor.banned,
      },
      competition,
      membership,
    };
  }
}
