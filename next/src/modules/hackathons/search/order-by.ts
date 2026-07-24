import type { Prisma } from "@/generated/prisma";

import { CompetitionSort } from "./sort";

export class CompetitionOrderByBuilder {
  static build(
    sort: CompetitionSort,
  ): Prisma.HackathonOrderByWithRelationInput {
    switch (sort) {
      case CompetitionSort.OLDEST:
        return {
          createdAt: "asc",
        };

      case CompetitionSort.NEWEST:
        return {
          createdAt: "desc",
        };

      case CompetitionSort.START_DATE_ASC:
        return {
          startDate: "asc",
        };

      case CompetitionSort.START_DATE_DESC:
        return {
          startDate: "desc",
        };

      case CompetitionSort.REGISTRATION_DEADLINE_ASC:
        return {
          registrationDeadline: "asc",
        };

      case CompetitionSort.REGISTRATION_DEADLINE_DESC:
        return {
          registrationDeadline: "desc",
        };

      case CompetitionSort.ALPHABETICAL_ASC:
        return {
          title: "asc",
        };

      case CompetitionSort.ALPHABETICAL_DESC:
        return {
          title: "desc",
        };

      default:
        return {
          createdAt: "desc",
        };
    }
  }
}