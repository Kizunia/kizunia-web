import type { Prisma } from "@/generated/prisma";

import type { CompetitionSearchInput } from "./schema";
import { CompetitionWhereBuilder } from "./where";

export class AdminCompetitionWhereBuilder {
  static build(
    filters: CompetitionSearchInput,
  ): Prisma.HackathonWhereInput {
    return CompetitionWhereBuilder.build(filters);
  }
}