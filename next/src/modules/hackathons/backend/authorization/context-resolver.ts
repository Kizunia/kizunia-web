import prisma from "@/lib/prisma";

import type { HackathonContext } from "./context";
import { AuthorizationActor } from "@/authorization";
import { ValidationError } from "@/lib/errors";

export class HackathonContextResolver {
  static async resolve(params: {
    actor: AuthorizationActor;
    hackathonId: string;
  }): Promise<HackathonContext> {
    const { actor, hackathonId } = params;

    if (!actor.id) {
      throw new ValidationError({
        code: "ACTOR_ID_REQUIRED",
        status: 400,
        message: "Actor ID is required to resolve hackathon context",
      });
    }
    const [ hackathon, membership] = await Promise.all([
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
}
