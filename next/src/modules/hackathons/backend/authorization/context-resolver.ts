import prisma from "@/lib/prisma";

import type { CompetitionContext } from "./context";
import { AuthorizationActor } from "@/authorization";
import { ValidationError } from "@/lib/errors";
import { CompetitionRepository } from "../repository";
import { Hackathon, HackathonMember } from "@/generated/prisma";

export class CompetitionContextResolver {
  static async resolve(params: {
    actor: AuthorizationActor;
    hackathonId: string;
  }): Promise<CompetitionContext> {
    const { actor, hackathonId } = params;

    if (!actor.id) {
      throw new ValidationError({
        code: "ACTOR_ID_REQUIRED",
        status: 400,
        message: "Actor ID is required to resolve hackathon context",
      });
    }
    const [hackathon, membership] = await Promise.all([
      // prisma.user.findUniqueOrThrow({ //TODO: use repo instead of directly using prisma
      //   where: {
      //     id: actorId,
      //   },
      // }),

      prisma.hackathon.findUniqueOrThrow({
        where: {
          id: hackathonId,
        },
      }),

      prisma.hackathonMember.findUnique({
        where: {
          hackathonId_userId: {
            hackathonId,
            userId: actor.id,
          },
        },
      }),
    ]);

    return {
      actor,
      hackathon,
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
    const hackathon = await CompetitionRepository.findBySlugOrThrow(slug);

    const membership =
      actor && actor.id
        ? await CompetitionRepository.findMembership(hackathon.id, actor.id)
        : null;

    return {
      actor: {
        id: actor?.id ?? null,
        role: actor?.role ?? null,
        banned: actor?.banned ?? null,
      },
      hackathon,
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
    hackathon: Hackathon;
    membership: HackathonMember | null;
  }): CompetitionContext {
    const { actor, hackathon, membership } = params;

    return {
      actor: {
        id: actor.id,
        role: actor.role,
        banned: actor.banned,
      },
      hackathon,
      membership,
    };
  }
}
