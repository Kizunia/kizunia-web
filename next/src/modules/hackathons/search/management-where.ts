import type { Prisma } from "@/generated/prisma";

import type { CompetitionSearchInput } from "./schema";
import { CompetitionWhereBuilder } from "./where";

export class ManagementCompetitionWhereBuilder {
  static build(
    actorId: string,
    filters: CompetitionSearchInput,
  ): Prisma.HackathonWhereInput {
    return {
      AND: [
        CompetitionWhereBuilder.build(filters),
        {
          members: {
            some: {
              userId: actorId,
            },
          },
        },
      ],
    };
  }
}