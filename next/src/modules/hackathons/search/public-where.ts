import type { Prisma } from "@/generated/prisma";

import type { CompetitionSearchInput } from "./schema";
import { CompetitionWhereBuilder } from "./where";

export class PublicCompetitionWhereBuilder {
  static build(
    filters: CompetitionSearchInput,
  ): Prisma.HackathonWhereInput {
    return {
      AND: [
        CompetitionWhereBuilder.build(filters),
        {
          visibility: "PUBLIC",
        },
      ],
    };
  }
}