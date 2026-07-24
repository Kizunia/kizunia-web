import { CompetitionAction } from "./actions";
import { HackathonMemberRole } from "@/generated/prisma";

/**
 * Static RBAC permission sets for Hackathon members.
 *
 * This file only maps roles to actions.
 *
 * It does NOT evaluate:
 * - Platform roles
 * - Archived state
 * - Locked state
 * - Verification
 * - Ownership
 *
 * Those rules belong in the Policy.
 */
export const HackathonPermissionSet: Readonly<
  Record<HackathonMemberRole, ReadonlySet<CompetitionAction>>
> = {
  OWNER: new Set([
    CompetitionAction.VIEW,
    CompetitionAction.EDIT,
    CompetitionAction.DELETE,
    CompetitionAction.PUBLISH,
    CompetitionAction.UNPUBLISH,
    CompetitionAction.MANAGE_MEMBERS,
    CompetitionAction.MANAGE_MEDIA,
    CompetitionAction.MANAGE_LINKS,
  ]),
  ORGANIZER: new Set([
    CompetitionAction.VIEW,
    CompetitionAction.EDIT,
    CompetitionAction.DELETE,
    CompetitionAction.PUBLISH,
    CompetitionAction.UNPUBLISH,
    CompetitionAction.MANAGE_MEMBERS,
    CompetitionAction.MANAGE_MEDIA,
    CompetitionAction.MANAGE_LINKS,
  ]), //todo

  MAINTAINER: new Set([
    CompetitionAction.VIEW,
    CompetitionAction.EDIT,
    CompetitionAction.MANAGE_MEDIA,
    CompetitionAction.MANAGE_LINKS,
  ]),
};
