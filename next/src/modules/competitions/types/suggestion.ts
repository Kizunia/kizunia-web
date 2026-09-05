import type { AssetDTO } from "@/modules/assets/frontend/types";

export type CompetitionSuggestionStatus =
  | "DRAFT"
  | "UNDER_REVIEW"
  | "CHANGES_REQUESTED"
  | "APPROVED"
  | "REJECTED"
  | "WITHDRAWN";

export interface CompetitionSuggestionContent {
  id: string;
  content: string;
  version?: number;
}

export interface CompetitionSuggestionAssetDTO {
  assetId: string;
  order: number;
  createdAt: string | Date;
  asset: AssetDTO;
}

export interface CompetitionSuggestionDTO {
  id: string;
  suggestionTitle: string;

  suggestionContent: CompetitionSuggestionContent | null;

  status: CompetitionSuggestionStatus;

  submittedAt: string | Date | null;
  reviewedAt: string | Date | null;

  reviewNotes: string | null;
  rejectionReason: string | null;

  competitionId: string | null;

  assets: CompetitionSuggestionAssetDTO[];

  createdAt: string | Date;
  updatedAt: string | Date;

  deletedAt?: string | Date | null;
}