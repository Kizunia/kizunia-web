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

  createdAt: string | Date;
  updatedAt: string;

  deletedAt?: string | Date | null;
}