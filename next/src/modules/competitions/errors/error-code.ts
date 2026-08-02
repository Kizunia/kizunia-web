export const CompetitionErrorCode = {
    NOT_FOUND: "COMPETITION_NOT_FOUND",

    DUPLICATE_SLUG: "COMPETITION_DUPLICATE_SLUG",

    DELETED: "COMPETITION_DELETED",

    ARCHIVED: "COMPETITION_ARCHIVED",

    
} as const;

export type CompetitionErrorCode =
    (typeof CompetitionErrorCode)[keyof typeof CompetitionErrorCode];