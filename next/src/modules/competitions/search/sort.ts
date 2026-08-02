export const CompetitionSort = {
  NEWEST: "newest",
  OLDEST: "oldest",

  START_DATE_ASC: "start-date-asc",
  START_DATE_DESC: "start-date-desc",

  REGISTRATION_DEADLINE_ASC: "registration-deadline-asc",
  REGISTRATION_DEADLINE_DESC: "registration-deadline-desc",

  ALPHABETICAL_ASC: "alphabetical-asc",
  ALPHABETICAL_DESC: "alphabetical-desc",
} as const;

export type CompetitionSort =
  (typeof CompetitionSort)[keyof typeof CompetitionSort];