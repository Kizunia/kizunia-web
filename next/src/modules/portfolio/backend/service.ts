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

import { AuthorizationActor, AuthorizationCode } from "@/authorization";
import { AuthorizationError } from "@/lib/errors";
import prisma from "@/lib/prisma";

import { PortfolioAuthorizer, PortfolioContextResolver } from "./authorization";

import { PortfolioRepository } from "./repository";
import { CreatePortfolioDto, PortfolioPublicDetailsDto } from "../dtos";
import { PortfolioAlreadyExistsError } from "../errors";
import { PortfolioMapper } from "./mapper/mapper";

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

  // ===========================================================================
  // Create
  // ===========================================================================

  async create({
    actor,
    dto,
  }: {
    actor: AuthorizationActor;
    dto: CreatePortfolioDto;
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

    const createData = PortfolioMapper.toCreateData(dto);

    const portfolio = await prisma.$transaction(async (tx) => {
      const repository = new PortfolioRepository(tx);

      return repository.create({
        data: {
          ...createData,

          user: {
            connect: {
              id: actor.id!,
            },
          },

          ...(dto.resumeAssetId && {
            resumeAsset: {
              connect: {
                id: dto.resumeAssetId,
              },
            },
          }),
        },
      });
    });

    return PortfolioMapper.toPublicDetailsDto(portfolio);
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
