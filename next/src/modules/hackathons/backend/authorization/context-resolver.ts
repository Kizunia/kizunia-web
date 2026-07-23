import prisma from "@/lib/prisma";

import type { HackathonContext } from "./context";

export class HackathonContextResolver {
  static async resolve(params: {
    actorId: string;
    hackathonId: string;
  }): Promise<HackathonContext> {
    const { actorId, hackathonId } = params;

    const [actor, hackathon, membership] = await Promise.all([
      prisma.user.findUniqueOrThrow({ //TODO: use repo instead of directly using prisma
        where: {
          id: actorId,
        },
      }),

      prisma.hackathon.findUniqueOrThrow({
        where: {
          id: hackathonId,
        },
      }),

      prisma.hackathonMember.findUnique({
        where: {
          hackathonId_userId: {
            hackathonId,
            userId: actorId,
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
