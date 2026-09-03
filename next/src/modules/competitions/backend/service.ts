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

import { DuplicateSlugError } from "../errors";
import { planCompetitionSearch } from "../search/plan";
import type { CompetitionSearchResult } from "../search/types";
import {
  buildPaginationMeta,
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

  /**
   * Public competition search.
   *
   * Planning resolves every filter that needs an external lookup — currently
   * just location — and fails loudly if one could not be completed. Both
   * queries below are then built from that single plan, so the total can never
   * disagree with the rows.
   */
  static async search(
    filters: RawSearchParams,
  ): Promise<CompetitionSearchResult<CompetitionCardDTO>> {
    const plan = await planCompetitionSearch({
      scope: "public",
      params: filters,
    });

    const [competitions, total] = await Promise.all([
      CompetitionRepository.findMany(plan),
      CompetitionRepository.count(plan),
    ]);

    const items = competitionMapper.toCardDTOs(competitions);

    // Re-derives page and limit from the same raw parameters the query was
    // built from, through the engine's own clamping, so the reported values
    // always match what was actually queried — including when an out-of-range
    // value was clamped rather than rejected.
    return {
      items,

      pagination: buildPaginationMeta(parsePagination(filters), total),
    };
  }

  /**
   * Search competitions the actor can manage.
   */
  static async searchManageable(
    actor: StrictAuthorizationActor,
    filters: RawSearchParams,
  ): Promise<CompetitionSearchResult<CompetitionManagementTableDTO>> {
    // Planned exactly like the public search, so a location supplied here is
    // honoured rather than silently discarded. Scope differences are expressed
    // by the registry's scope guards, never by which service method remembered
    // to resolve.
    const plan = await planCompetitionSearch({
      scope: "management",
      params: filters,
      context: { actorId: actor.id },
    });

    const [competitions, total] = await Promise.all([
      CompetitionRepository.findManyManageable(actor.id, plan),

      CompetitionRepository.countManageable(plan),
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
    const plan = await planCompetitionSearch({
      scope: "admin",
      params: filters,
    });

    const [competitions, total] = await Promise.all([
      CompetitionRepository.findManyAdmin(actor.id!, plan),

      CompetitionRepository.countAdmin(plan),
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
