import { hackathonRepository } from "./repository";
import { hackathonMapper } from "./mapper";
import type { CreateHackathonInput } from "../schemas/create-hackathon";
import { HackathonRepository } from "./repository";
import type { SearchCompetitionsInput } from "../schemas/search.schema";

import { COMPETITIONS_PAGE_SIZE } from "../constants";
import { PlatformContext } from "@/authorization/platform/context";

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

    const competitions = await hackathonRepository.findMany({
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

    console.dir(data, {
      depth: null,
    });

    console.log("");
    console.log("Creating hackathon...");

    const hackathon = await HackathonRepository.create(data);

    console.log("");
    console.log("✅ Hackathon created.");

    return hackathon;
  }
}

export const hackathonService = new HackathonService();
