export const HackathonErrorCode = {
    NOT_FOUND: "HACKATHON_NOT_FOUND",

    DUPLICATE_SLUG: "HACKATHON_DUPLICATE_SLUG",

    DELETED: "HACKATHON_DELETED",

    ARCHIVED: "HACKATHON_ARCHIVED",
} as const;

export type HackathonErrorCode =
    (typeof HackathonErrorCode)[keyof typeof HackathonErrorCode];