/**
 * Portfolio Module - Service
 *
 * Responsible for all business rules:
 *
 * - Duplicate detection
 * - Transactions
 * - Workflows
 * - Permission checks
 * * - Business validation
 */

import {
  AuthorizationActor,
  AuthorizationCode,
  StrictAuthorizationActor,
} from "@/authorization";
import { AuthorizationError } from "@/lib/errors";
import prisma from "@/lib/prisma";

import { PortfolioAuthorizer, PortfolioContextResolver } from "./authorization";

import { PortfolioProfileUpdateData, PortfolioRepository } from "./repository";
import { PortfolioEditorDto, PortfolioPublicDetailsDto } from "../dtos";
import { PortfolioAlreadyExistsError } from "../errors";
import { PortfolioMapper } from "./mapper/mapper";
import { UpdatePortfolioProfileDto } from "../dtos/input/update.dto";

export class PortfolioService {
  private readonly repository = new PortfolioRepository();

  // ===========================================================================
  // Read
  // ===========================================================================

  async findPublicByUsername({
    username,
  }: {
    username: string;
  }): Promise<PortfolioPublicDetailsDto> {
    const portfolio = await this.repository.findPublicByUsernameOrThrow({
      username,
    });

    return PortfolioMapper.toPublicDetailsDto(portfolio);
  }

  async findMine({
    actor,
  }: {
    actor: StrictAuthorizationActor;
  }): Promise<PortfolioEditorDto | null> {
    // if (!actor.id) {
    //   throw new AuthorizationError({
    //     code: AuthorizationCode.UNAUTHORIZED,
    //     status: 401,
    //     message: "Authentication is required.",
    //   });
    // }

    const portfolio = await this.repository.findEditorByUserId({
      userId: actor.id,
    });

    if (!portfolio) {
      return null;
    }

    PortfolioAuthorizer.read({
      actor,
      portfolio,
      isOwner: portfolio.userId === actor.id,
    });

    return PortfolioMapper.toEditorDto(portfolio);
  }

  // ===========================================================================
  // Create
  // ===========================================================================

  async create({
    actor,
    // dto,
  }: {
    actor: StrictAuthorizationActor;
    // dto: CreatePortfolioDto;
  }): Promise<PortfolioPublicDetailsDto> {
    if (!actor.id) {
      throw new AuthorizationError({
        code: AuthorizationCode.UNAUTHORIZED,
        status: 401,
        message: "Authentication is required.",
      });
    }

    const context = PortfolioContextResolver.forCreate({
      actor,
    });

    PortfolioAuthorizer.create(context);

    await this.ensurePortfolioDoesNotExist({
      userId: actor.id,
    });

    // const createData = PortfolioMapper.toCreateData(dto);

    const user = await this.repository.findUserForCreation({
      userId: actor.id,
    });

    if (!user) {
      throw new AuthorizationError({
        code: AuthorizationCode.UNAUTHORIZED,
        status: 401,
        message: "Authenticated user could not be found.",
      });
    }

    const displayName: string = user.name;

    const portfolio = await prisma.$transaction(async (tx) => {
      const repository = new PortfolioRepository(tx);

      return repository.create({
        data: {
          displayName: displayName,

          user: {
            connect: {
              id: actor.id,
            },
          },

          // ...(dto.resumeAssetId && {
          //   resumeAsset: {
          //     connect: {
          //       id: dto.resumeAssetId,
          //     },
          //   },
          // }),
        },
      });
    });

    return PortfolioMapper.toPublicDetailsDto(portfolio);
  }
  // ===========================================================================
  // Profile
  // ===========================================================================

  async updateProfile({
    actor,
    dto,
  }: {
    actor: StrictAuthorizationActor;
    dto: UpdatePortfolioProfileDto;
  }): Promise<PortfolioEditorDto> {
    // if (!actor.id) {
    //   throw new AuthorizationError({
    //     code: AuthorizationCode.UNAUTHORIZED,
    //     status: 401,
    //     message: "Authentication is required.",
    //   });
    // }

    const portfolio = await this.repository.findByUserIdOrThrow({
      userId: actor.id,
    });

    const context = PortfolioContextResolver.fromData({
      actor,
      portfolio: {
        id: portfolio.id,
        userId: portfolio.userId,
        visibility: portfolio.visibility,
        deletedAt: portfolio.deletedAt,
      },
    });

    PortfolioAuthorizer.edit(context);

    const updateData: PortfolioProfileUpdateData = {
      displayName: dto.displayName,
      headline: dto.headline,
      bio: dto.bio,
      phone: dto.phone,
      publicContactEmail: dto.publicContactEmail,
      location: dto.location,
      resumeAssetId: dto.resumeAssetId,
    };

    const updatedPortfolio = await this.repository.updateProfile({
      id: portfolio.id,
      data: updateData,
    });

    return PortfolioMapper.toEditorDto(updatedPortfolio);
  }
  // ===========================================================================
  // Helpers
  // ===========================================================================

  private async ensurePortfolioDoesNotExist({
    userId,
  }: {
    userId: string;
  }): Promise<void> {
    const exists = await this.repository.existsByUserId({
      userId,
    });

    if (exists) {
      throw new PortfolioAlreadyExistsError();
    }
  }
}

export const portfolioService = new PortfolioService();
