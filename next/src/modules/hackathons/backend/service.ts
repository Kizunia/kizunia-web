import { hackathonMapper } from "./mapper";
import type { CreateHackathonInput } from "../schemas/create-hackathon";
import { CompetitionRepository } from "./repository";
import type { SearchCompetitionsInput } from "../schemas/search.schema";

import { COMPETITIONS_PAGE_SIZE } from "../constants";
import { PlatformContext } from "@/authorization/platform/context";
import { UpdateHackathonInput } from '../schemas/update-hackathon';
import { HackathonContext } from "./authorization";
import { DuplicateSlugError } from "../errors";

export interface UpdateHackathonOptions {
    context: HackathonContext;
    data: UpdateHackathonInput;
}

export class HackathonService {
  /**
   * Returns public competitions.
   *
   * Responsibilities
   * ----------------
   * ✓ Business rules
   * ✓ Pagination
   * ✓ Repository orchestration
   * ✓ Mapping Prisma models -> DTOs
   *
   * Does NOT
   * ----------------
   * ✗ Parse URLs
   * ✗ Know about React
   * ✗ Know about Next.js
   * ✗ Query Prisma directly
   */
  async findPublic(filters: SearchCompetitionsInput) {
    /**
     * Business Pagination
     */
    const skip = (filters.page - 1) * COMPETITIONS_PAGE_SIZE;

    const competitions = await CompetitionRepository.findMany({
      search: filters.search,

      mode: filters.mode,

      status: filters.status,

      category: filters.category,

      technology: filters.technology,

      sort: filters.sort,

      skip,

      take: COMPETITIONS_PAGE_SIZE,
    });

    return hackathonMapper.toCardDTOs(competitions);
  }

  static async create(data: CreateHackathonInput, context: PlatformContext,) {

   

    const hackathon = await CompetitionRepository.create({data});

    console.log("");
    console.log("✅ Hackathon created.");

    return hackathon;
  }

  static async update(
    options: UpdateHackathonOptions,
) {

    if (
    options.data.slug &&
    options.data.slug !== options.context.hackathon.slug
) {
    const taken =
        await CompetitionRepository.existsBySlug(
            options.data.slug,
        );

    if (taken) {
        throw new DuplicateSlugError(
            options.data.slug,
        );
    }
}

    return CompetitionRepository.update({
    id: options.context.hackathon.id,
    data: options.data,
});
}


}

export const hackathonService = new HackathonService();
