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

import { HttpStatus, ValidationError } from "@/lib/errors";
import prisma from "@/lib/prisma";

import { DuplicateSlugError } from "../errors";
import { CompetitionErrorCode } from "../errors/error-code";
import type { BulkCompetitionAction } from "../schemas/bulk-competition-action";
import { planCompetitionSearch } from "../search/plan";
import type { CompetitionSearchResult } from "../search/types";
import {
  buildPaginationMeta,
  parsePagination,
  type RawSearchParams,
} from "@/lib/search";
import type { CompetitionDetailDTO, CompetitionCardDTO } from "../types/dto";
import { CompetitionAssetSlot } from "../types/asset-slot";
import { CompetitionAssetService } from "./competition-asset.service";
import {
  CompetitionManagementTableDTO,
  CompetitionAdminTableDTO,
} from "./authorization/dto";
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
  ): Promise<CompetitionSearchResult<CompetitionAdminTableDTO>> {
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

      const canRestore = CompetitionPermissionResolver.canRestore(context);

      return competitionMapper.toAdminTableDTO({
        competition,
        role: membership?.role ?? null,
        permissions,
        canRestore,
      });
    });

    return {
      items,

      pagination: buildPaginationMeta(parsePagination(filters), total),
    };
  }

  /**
   * The admin listing's summary strip — four plain counts, nothing derived
   * beyond a sum. Not scoped by the current filters: it always describes the
   * whole admin universe, so the numbers stay stable reference points while
   * someone filters the table underneath them.
   */
  static async getAdminSummary(): Promise<{
    total: number;
    active: number;
    deleted: number;
    upcoming: number;
  }> {
    const [recordState, upcoming] = await Promise.all([
      CompetitionRepository.countByRecordState(),
      CompetitionRepository.countByStatus("UPCOMING"),
    ]);

    return { ...recordState, upcoming };
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
    assetId,
  }: {
    context: CompetitionContext;
    slot: CompetitionAssetSlot;
    assetId: string;
  }) {
    return CompetitionAssetService.setAsset(context, { slot, assetId });
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
  // Bulk admin actions
  // ==========================================================================
  //
  // Split into two steps deliberately. This method only loads and validates
  // existence — it builds one `CompetitionContext` per requested row and
  // hands them back unauthorized. The caller (the controller, per this
  // class's own "does not authorize users" boundary above) decides
  // admission from these contexts, all-or-nothing, before `bulkApply` is
  // ever reached. Nothing here mutates anything.

  /**
   * Loads every requested competition and the actor's membership in each,
   * in two queries regardless of how many ids were requested — not N+1.
   *
   * Includes soft-deleted rows on purpose: a bulk RESTORE request targets
   * exactly those, and excluding them would make every id in it look
   * nonexistent.
   *
   * @throws ValidationError naming any requested id that does not exist.
   */
  static async loadBulkActionContexts(
    actor: StrictAuthorizationActor,
    ids: readonly string[],
  ): Promise<CompetitionContext[]> {
    const [competitions, memberships] = await Promise.all([
      CompetitionRepository.findManyByIds(ids),
      CompetitionRepository.findMembershipsByCompetitionIds(actor.id, ids),
    ]);

    if (competitions.length !== ids.length) {
      const found = new Set(competitions.map((competition) => competition.id));
      const missing = ids.filter((id) => !found.has(id));

      throw new ValidationError({
        code: CompetitionErrorCode.BULK_IDS_NOT_FOUND,
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        message: "Some requested competitions do not exist.",
        details: { missing },
      });
    }

    const membershipByCompetitionId = new Map(
      memberships.map((membership) => [membership.competitionId, membership]),
    );

    return competitions.map((competition) =>
      CompetitionContextResolver.fromData({
        actor,
        competition,
        membership: membershipByCompetitionId.get(competition.id) ?? null,
      }),
    );
  }

  /**
   * Applies one action to every id, in a single transaction.
   *
   * Called only after every id has been individually authorized — this
   * method trusts `ids` completely, which is exactly why nothing upstream of
   * it may call this before every id has passed that check. One `updateMany`
   * per action, not one write per row.
   */
  static async bulkApply(
    ids: readonly string[],
    action: BulkCompetitionAction,
  ): Promise<{ updated: number }> {
    const result = await prisma.$transaction(async (tx) => {
      switch (action.type) {
        case "SET_STATUS":
          return CompetitionRepository.bulkSetStatus(ids, action.status, tx);

        case "SET_VISIBILITY":
          return CompetitionRepository.bulkSetVisibility(
            ids,
            action.visibility,
            tx,
          );

        case "DELETE":
          return CompetitionRepository.bulkSoftDelete(ids, tx);

        case "RESTORE":
          return CompetitionRepository.bulkRestore(ids, tx);
      }
    });

    return { updated: result.count };
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
