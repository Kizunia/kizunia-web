/**
 * Portfolio Module - Mapper
 *
 * Responsible for mapping between entities and DTOs.
 */

import type { CreatePortfolioDto, PortfolioEditorDto } from "../../dtos";
import type {
  PortfolioPublicDetailsDto,
  PortfolioSummaryDto,
} from "../../dtos";

import type {
  PortfolioEditorEntity,
  PortfolioPublicDetailsEntity,
  PortfolioSummaryEntity,
} from "../repository";

export class PortfolioMapper {
  // ===========================================================================
  // Read
  // ===========================================================================

  static toPublicDetailsDto(
    portfolio: PortfolioPublicDetailsEntity,
  ): PortfolioPublicDetailsDto {
    return portfolio;
  }

  static toEditorDto(portfolio: PortfolioEditorEntity): PortfolioEditorDto {
    return portfolio;
  }

  static toSummaryDto(portfolio: PortfolioSummaryEntity): PortfolioSummaryDto {
    return portfolio;
  }

  static toSummaryDtos(
    portfolios: PortfolioSummaryEntity[],
  ): PortfolioSummaryDto[] {
    return portfolios.map(this.toSummaryDto);
  }

  // ===========================================================================
  // Create
  // ===========================================================================

  /**
   * Maps only the data supplied by the client.
   *
   * This intentionally does NOT return a PrismaCreateInput.
   * Relations (user, assets, etc.) are attached by the service.
   */
  static toCreateData(dto: CreatePortfolioDto) {
    return {
      displayName: dto.displayName,

      headline: dto.headline,

      bio: dto.bio,

      phone: dto.phone,

      publicContactEmail: dto.publicContactEmail,

      location: dto.location,
    };
  }
}
