import { competitionMapper } from "./mapper";

import type { CreateHackathonInput } from "../schemas/create-hackathon";
import type { SearchCompetitionsInput } from "../schemas/search.schema";
import type { UpdateHackathonInput } from "../schemas/update-hackathon";

import { CompetitionRepository } from "./repository";

import { COMPETITIONS_PAGE_SIZE } from "../constants";

import type { PlatformContext } from "@/authorization/platform/context";
import type { CompetitionContext } from "./authorization";

import { DuplicateSlugError } from "../errors";

/**
 * ============================================================================
 * Create
 * ============================================================================
 */

export interface CreateCompetitionOptions {
  context: PlatformContext;
  data: CreateHackathonInput;
}

/**
 * ============================================================================
 * Update
 * ============================================================================
 */

export interface UpdateCompetitionOptions {
  context: CompetitionContext;
  data: UpdateHackathonInput;
}

export class CompetitionService {
  /**
   * Business Layer
   *
   * Responsibilities
   * ----------------
   * ✓ Business rules
   * ✓ Repository orchestration
   * ✓ Domain validation
   * ✓ Pagination
   * ✓ Mapping database models
   *
   * Does NOT
   * ----------------
   * ✗ Parse HTTP requests
   * ✗ Authenticate users
   * ✗ Authorize users
   * ✗ Query Prisma directly
   * ✗ Return NextResponse
   */

  // ==========================================================================
  // Queries
  // ==========================================================================

  static async findPublic(filters: SearchCompetitionsInput) {
    const skip = (filters.page - 1) * COMPETITIONS_PAGE_SIZE;

    const competitions = await CompetitionRepository.findMany({
      // TODO: add more filters here as needed
      // open to all, payment, team size, location, user type, location
      search: filters.search,

      mode: filters.mode,

      status: filters.status,

      category: filters.category,

      technology: filters.technology,

      

      sort: filters.sort,

      skip,

      take: COMPETITIONS_PAGE_SIZE,
    });

    return competitionMapper.toCardDTOs(competitions);
  }

  // Mutations

  static async create(options: CreateCompetitionOptions) {
    await this.normalizeCreate(options);
    await this.validateCreate(options.data);

    return CompetitionRepository.create({
      data: options.data,
    });
  }

  static async update(options: UpdateCompetitionOptions) {
    await this.validateSlug(options.context, options.data);

    // Future business rules
    // --------------------------------
    //
    // await this.validateDates(...)
    //
    // await this.validateVisibility(...)
    //
    // await this.validateStatus(...)
    //
    // await this.validateRegistration(...)
    //
    // await this.validateTeamSize(...)
    //

    return CompetitionRepository.update({
      id: options.context.hackathon.id,
      data: options.data,
    });
  }

  static async delete(context: CompetitionContext) {
    return CompetitionRepository.delete(context.hackathon.id);
  }

  static async restore(context: CompetitionContext) {
    return CompetitionRepository.restore(context.hackathon.id);
  }

  // ==========================================================================
  // Business Validation
  // ==========================================================================

  private static async validateCreate(data: CreateHackathonInput) {
    /**
     * TODO: Implement business validation rules for creating a hackathon.
     * Future
     *
     * - Validate slug
     * - Validate dates
     * - Validate registration
     * - Validate organizer
     */
    const exists = await CompetitionRepository.existsBySlug(data.slug);

    if (exists) {
      throw new DuplicateSlugError(data.slug);
    }
  }

  private static async validateSlug(
    context: CompetitionContext,
    data: UpdateHackathonInput,
  ) {
    if (!data.slug || data.slug === context.hackathon.slug) {
      return;
    }

    const exists = await CompetitionRepository.existsBySlug(data.slug);

    if (exists) {
      throw new DuplicateSlugError(data.slug);
    }
  }

  private static normalizeCreate(
    //TODO: Implement normalization logic for creating a hackathon.
    options: CreateCompetitionOptions,
  ) {}

  private static normalizeUpdate(
    // TODO: Implement normalization logic for updating a hackathon.
    options: UpdateCompetitionOptions,
  ) {}
}

export const competitionService = new CompetitionService();
