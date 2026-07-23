import { HackathonAction } from "./actions";
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
  Record<HackathonMemberRole, ReadonlySet<HackathonAction>>
> = {
  OWNER: new Set([
    HackathonAction.VIEW,
    HackathonAction.EDIT,
    HackathonAction.DELETE,
    HackathonAction.PUBLISH,
    HackathonAction.UNPUBLISH,
    HackathonAction.MANAGE_MEMBERS,
    HackathonAction.MANAGE_MEDIA,
    HackathonAction.MANAGE_LINKS,
  ]),
  ORGANIZER: new Set([
    HackathonAction.VIEW,
    HackathonAction.EDIT,
    HackathonAction.DELETE,
    HackathonAction.PUBLISH,
    HackathonAction.UNPUBLISH,
    HackathonAction.MANAGE_MEMBERS,
    HackathonAction.MANAGE_MEDIA,
    HackathonAction.MANAGE_LINKS,
  ]), //todo

  MAINTAINER: new Set([
    HackathonAction.VIEW,
    HackathonAction.EDIT,
    HackathonAction.MANAGE_MEDIA,
    HackathonAction.MANAGE_LINKS,
  ]),
};
