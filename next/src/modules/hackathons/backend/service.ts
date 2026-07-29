import { CompetitionMapper, competitionMapper } from "./mapper";

import type { CreateHackathonInput } from "../schemas/create-hackathon";
import type { SearchCompetitionsInput } from "../schemas/search.schema";
import type { UpdateHackathonInput } from "../schemas/update-hackathon";

import { CompetitionRepository } from "./repository";

import { COMPETITIONS_PAGE_SIZE } from "../constants";

import type { PlatformContext } from "@/authorization/platform/context";
import { CompetitionContextResolver, CompetitionPermissionResolver, type CompetitionContext } from "./authorization";

import { DuplicateSlugError } from "../errors";
import { CompetitionSearchBuilder } from "../search/builder";
import type { CompetitionSearchResult } from "../search/types";
import type { CompetitionSearchInput } from "../search/schema";
import type { CompetitionDetailDTO, HackathonCardDTO } from "../types/dto";
import { CreateAssetInput } from "@/modules/assets/schemas/create-asset";
import { HackathonAssetSlot } from "../types/asset-slot";
import { HackathonAssetService } from "./hackathon-asset.service";
import { CompetitionManagementTableDTO } from "./authorization/dto";
import { AuthorizationActor, StrictAuthorizationActor } from "@/authorization";
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

  // static async findPublic(filters: SearchCompetitionsInput) {
  //   const skip = (filters.page - 1) * COMPETITIONS_PAGE_SIZE;

  //   const competitions = await CompetitionRepository.findMany({
  //     // TODO: add more filters here as needed
  //     // open to all, payment, team size, location, user type, location
  //     search: filters.search,

  //     mode: filters.mode,

  //     status: filters.status,

  //     category: filters.category,

  //     technology: filters.technology,

  //     sort: filters.sort,

  //     skip,

  //     take: COMPETITIONS_PAGE_SIZE,
  //   });

  //   return competitionMapper.toCardDTOs(competitions);
  // }
  // ==========================================================================
  // Queries
  // ==========================================================================

  static async search(
    filters: CompetitionSearchInput,
  ): Promise<CompetitionSearchResult<HackathonCardDTO>> {
    // ------------------------------------------------------------
    // Build Prisma Query
    // ------------------------------------------------------------

    // const where =
    //   CompetitionSearchBuilder.buildWhere(filters);

    // const orderBy =
    //   CompetitionSearchBuilder.buildOrderBy(
    //     filters.sort,
    //   );

    // const { skip, take } =
    //   CompetitionSearchBuilder.buildPagination(
    //     filters,
    //   );

    // ------------------------------------------------------------
    // Execute Queries
    // ------------------------------------------------------------
    console.log(filters);

    const [competitions, total] = await Promise.all([
      CompetitionRepository.findMany(filters),
      CompetitionRepository.count(filters),
    ]);

    // ------------------------------------------------------------
    // Mapping
    // ------------------------------------------------------------

    const items = competitionMapper.toCardDTOs(competitions);

    // ------------------------------------------------------------
    // Pagination
    // ------------------------------------------------------------

    const totalPages = Math.ceil(total / filters.limit);

    return {
      items,

      pagination: {
        page: filters.page,

        limit: filters.limit,

        total,

        totalPages,

        hasNextPage: filters.page < totalPages,

        hasPreviousPage: filters.page > 1,
      },
    };
  }

  /**
   * Search competitions the actor can manage.
   */
 static async searchManageable(
 actor: StrictAuthorizationActor,
  filters: CompetitionSearchInput,
): Promise<
  CompetitionSearchResult<CompetitionManagementTableDTO>
> {
  const [competitions, total] = await Promise.all([
    CompetitionRepository.findManyManageable(actor.id, filters),

    CompetitionRepository.countManageable(actor.id, filters),
  ]);

  const items = competitions.map((competition) => {
    const membership = competition.members[0];

    if (!membership) {
      throw new Error(
        "Competition membership was not loaded.",
      );
    }

    const context =
      CompetitionContextResolver.fromData({
        actor: {
          id: actor.id,
          role: actor.role,
          banned: actor.banned,
        },
        hackathon: competition,
        membership,
      });

    const permissions =
      CompetitionPermissionResolver.resolve(context);

    return competitionMapper.toManagementTableDTO({
      competition,
      role: membership.role,
      permissions,
    });
  });

  const totalPages = Math.ceil(total / filters.limit);

  return {
    items,

    pagination: {
      page: filters.page,

      limit: filters.limit,

      total,

      totalPages,

      hasNextPage: filters.page < totalPages,

      hasPreviousPage: filters.page > 1,
    },
  };
}

  /**
   * Search all competitions as a platform administrator.
   */
  static async searchAdmin(
    filters: CompetitionSearchInput,
  ): Promise<CompetitionSearchResult<HackathonCardDTO>> {
    const [competitions, total] = await Promise.all([
      CompetitionRepository.findManyAdmin(filters),

      CompetitionRepository.countAdmin(filters),
    ]);

    const items = competitionMapper.toCardDTOs(competitions);

    const totalPages = Math.ceil(total / filters.limit);

    return {
      items,

      pagination: {
        page: filters.page,

        limit: filters.limit,

        total,

        totalPages,

        hasNextPage: filters.page < totalPages,

        hasPreviousPage: filters.page > 1,
      },
    };
  }

  static async findBySlug(slug: string): Promise<CompetitionDetailDTO | null> {
    // PUBLIC
    const competition = await CompetitionRepository.findBySlug(slug);

    if (!competition) {
      return null;
    }
    return competitionMapper.toDetailDTO(competition);
  }

  static async findForEdit(id: string) {
    // for admin edit
    const competition = await CompetitionRepository.findByIdForEdit(id);

    return competitionMapper.toEditDTO(competition);
  }
  // Mutations

  static async create(options: CreateCompetitionOptions) {
    await this.normalizeCreate(options);
    await this.validateCreate(options.data);

    return CompetitionRepository.create({
      data: options.data,
    });
  }

  static async setAsset({
    context,
    slot,
    upload,
  }: {
    context: CompetitionContext;
    slot: HackathonAssetSlot;
    upload: CreateAssetInput;
  }) {
    // return HackathonAssetService.setAsset(
    //   hackathonId: context.hackathon.id,
    //   {slot,
    //   upload}
    // );
    return HackathonAssetService.setAsset(context.hackathon.id, {
      slot,
      upload,
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
