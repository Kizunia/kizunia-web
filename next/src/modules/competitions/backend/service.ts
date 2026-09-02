import { CompetitionMapper, competitionMapper } from "./mapper";

import type { CreateCompetitionInput } from "../schemas/create-competition";
import type { UpdateCompetitionInput } from "../schemas/update-competition";

import { CompetitionRepository } from "./repository";

import type { PlatformContext } from "@/authorization/platform/context";
import {
  CompetitionContextResolver,
  CompetitionPermissionResolver,
  type CompetitionContext,
} from "./authorization";

import { ExternalServiceError } from "@/lib/errors";
import { PlaceMatchService } from "@/modules/locations";

import { DuplicateSlugError } from "../errors";
import { buildLocationClause } from "../search/location-clause";
import { CompetitionErrorCode } from "../errors/error-code";
import type { CompetitionSearchResult } from "../search/types";
import {
  buildPaginationMeta,
  normalizeScalar,
  parsePagination,
  type RawSearchParams,
} from "@/lib/search";
import type { CompetitionDetailDTO, CompetitionCardDTO } from "../types/dto";
import { CreateAssetInput } from "@/modules/assets/schemas/create-asset";
import { CompetitionAssetSlot } from "../types/asset-slot";
import { CompetitionAssetService } from "./competition-asset.service";
import { CompetitionManagementTableDTO } from "./authorization/dto";
import { AuthorizationActor, StrictAuthorizationActor } from "@/authorization";
/**
 * ============================================================================
 * Create
 * ============================================================================
 */

export interface CreateCompetitionOptions {
  context: PlatformContext;
  data: CreateCompetitionInput;
}

/**
 * ============================================================================
 * Update
 * ============================================================================
 */

export interface UpdateCompetitionOptions {
  context: CompetitionContext;
  data: UpdateCompetitionInput;
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

  static async search(
    filters: RawSearchParams,
  ): Promise<CompetitionSearchResult<CompetitionCardDTO>> {
    // ------------------------------------------------------------
    // Resolve Location
    // ------------------------------------------------------------
    //
    // Happens before any query is built, because the search engine is
    // synchronous and pure — a filter cannot call a provider or read the
    // database. Resolved once here, then handed to both queries below.

    const locationClause = await this.resolveLocationClause(filters);

    const extraBaseClauses = locationClause ? [locationClause] : undefined;

    // ------------------------------------------------------------
    // Execute Queries
    // ------------------------------------------------------------
    //
    // Both calls receive the same clause. Passing it to one and not the other
    // would make the reported total disagree with the rows returned.

    const [competitions, total] = await Promise.all([
      CompetitionRepository.findMany(filters, extraBaseClauses),
      CompetitionRepository.count(filters, extraBaseClauses),
    ]);

    // ------------------------------------------------------------
    // Mapping
    // ------------------------------------------------------------

    const items = competitionMapper.toCardDTOs(competitions);

    // ------------------------------------------------------------
    // Pagination
    // ------------------------------------------------------------
    //
    // Re-derives {page, limit} from the same raw params the repository's
    // query was built from, via the shared engine's own clamping logic
    // (parsePagination), so the reported page/limit always matches what
    // was actually queried — including when an out-of-range value was
    // clamped rather than rejected.

    return {
      items,

      pagination: buildPaginationMeta(parsePagination(filters), total),
    };
  }

  /**
   * Turns a requested place into the clause that restricts results to it.
   *
   * Three outcomes, kept distinct because conflating them misinforms the user:
   *
   *   - no place requested        -> `undefined`, results are unrestricted
   *   - place resolved            -> a clause, even when it matched no areas,
   *                                  so a real place with no competitions
   *                                  returns nothing rather than everything
   *   - place could not resolve   -> throws, because "we could not find out"
   *                                  must never be shown as "there is nothing"
   */
  private static async resolveLocationClause(filters: RawSearchParams) {
    const placeId = normalizeScalar(filters.placeId);

    if (!placeId) {
      return undefined;
    }

    const resolution = await PlaceMatchService.resolve(placeId);

    if (resolution.status === "RESOLUTION_FAILED") {
      throw new ExternalServiceError({
        code: CompetitionErrorCode.LOCATION_RESOLUTION_FAILED,
        message:
          "Could not look up that location right now. Please try again shortly.",
        details: { reason: resolution.reason },
      });
    }

    return buildLocationClause({
      requested: true,
      searchAreaIds: resolution.searchAreaIds,
      includeOnline:
        normalizeScalar(filters.includeOnline)?.toLowerCase() === "true",
    });
  }

  /**
   * Search competitions the actor can manage.
   */
  static async searchManageable(
    actor: StrictAuthorizationActor,
    filters: RawSearchParams,
  ): Promise<CompetitionSearchResult<CompetitionManagementTableDTO>> {
    const [competitions, total] = await Promise.all([
      CompetitionRepository.findManyManageable(actor.id, filters),

      CompetitionRepository.countManageable(actor.id, filters),
    ]);

    const items = competitions.map((competition) => {
      const membership = competition.members[0];

      if (!membership) {
        throw new Error("Competition membership was not loaded.");
      }

      const context = CompetitionContextResolver.fromData({
        actor: {
          id: actor.id,
          role: actor.role,
          banned: actor.banned,
        },
        competition: competition,
        membership,
      });

      const permissions = CompetitionPermissionResolver.resolve(context);

      return competitionMapper.toManagementTableDTO({
        competition,
        role: membership.role,
        permissions,
      });
    });

    return {
      items,

      pagination: buildPaginationMeta(parsePagination(filters), total),
    };
  }

  /**
   * Search all competitions as a platform administrator.
   */
  static async searchAdmin(
    actor: StrictAuthorizationActor,
    filters: RawSearchParams,
  ): Promise<CompetitionSearchResult<CompetitionManagementTableDTO>> {
    const [competitions, total] = await Promise.all([
      CompetitionRepository.findManyAdmin(actor.id!, filters),

      CompetitionRepository.countAdmin(filters),
    ]);

    const items = competitions.map((competition) => {
      const membership = competition.members[0] ?? null;

      const context = CompetitionContextResolver.fromData({
        actor,
        competition: competition,
        membership,
      });

      const permissions = CompetitionPermissionResolver.resolve(context);

      return competitionMapper.toManagementTableDTO({
        competition,
        role: membership?.role ?? null,
        permissions,
      });
    });

    return {
      items,

      pagination: buildPaginationMeta(parsePagination(filters), total),
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

  static async adminFindForEdit(
    context: CompetitionContext,
  ) { //: Promise<CompetitionDetailDTO>
    // for admin edit
    const competition = await CompetitionRepository.findByIdForEdit(context.competition.id);

    return competitionMapper.toEditDTOWithPermissions({
      competition: competition,
      role: context.membership?.role ?? null,
      permissions: CompetitionPermissionResolver.resolve(context),
    });
  }
  // Mutations

  static async create(options: CreateCompetitionOptions) {
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
    slot: CompetitionAssetSlot;
    upload: CreateAssetInput;
  }) {
    return CompetitionAssetService.setAsset(context.competition.id, {
      slot,
      upload,
    });
  }

  static async update(options: UpdateCompetitionOptions) {
    await this.validateSlug(options.context, options.data);

    return CompetitionRepository.update({
      id: options.context.competition.id,
      data: options.data,
    });
  }

  static async delete({context}: {context:CompetitionContext}): Promise<void> {
    CompetitionRepository.softDelete(context.competition.id);
  }

  static async restore(context: CompetitionContext) {
    return CompetitionRepository.restore(context.competition.id);
  }

  // ==========================================================================
  // Business Validation
  // ==========================================================================

  private static async validateCreate(data: CreateCompetitionInput) {
    const exists = await CompetitionRepository.existsBySlug(data.slug);

    if (exists) {
      throw new DuplicateSlugError(data.slug);
    }
  }

  private static async validateSlug(
    context: CompetitionContext,
    data: UpdateCompetitionInput,
  ) {
    if (!data.slug) {
      return;
    }

    const exists = await CompetitionRepository.existsBySlugExceptCompetition({
      slug: data.slug,
      competitionId: context.competition.id,
    });

    if (exists) {
      throw new DuplicateSlugError(data.slug);
    }
  }
}

export const competitionService = new CompetitionService();
