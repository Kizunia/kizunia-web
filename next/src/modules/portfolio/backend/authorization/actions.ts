export enum PortfolioAction {
  VIEW = "VIEW",

  CREATE = "CREATE",

  EDIT = "EDIT",

  DELETE = "DELETE",

  /**
   * Manage the Portfolio's relationships to Projects (attach, detach,
   * feature, reorder). Owner-only, like EDIT — kept as its own action so the
   * two can diverge later without touching call sites.
   *
   * This authorizes the *Portfolio* side only. Eligibility to attach a
   * particular Project is a separate membership check in the service; no
   * ProjectAction is involved, since CONTRIBUTOR holds only ProjectAction.VIEW
   * yet must still be able to showcase a project they participate in.
   */
  MANAGE_PROJECTS = "MANAGE_PROJECTS",
}