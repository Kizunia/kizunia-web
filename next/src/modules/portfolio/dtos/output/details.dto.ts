import { PortfolioEditorEntity, PortfolioPublicDetailsEntity } from "../../backend/repository";

export type PortfolioPublicDetailsDto =
  PortfolioPublicDetailsEntity; //TODO: This is a temporary solution, we should create a new DTO for this in the future.


export type PortfolioEditorDto =
  PortfolioEditorEntity;