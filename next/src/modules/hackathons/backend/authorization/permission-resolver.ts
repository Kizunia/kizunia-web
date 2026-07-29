import { CompetitionAction } from "./actions";
import type { CompetitionContext } from "./context";
import { CompetitionPolicy } from "./policy";

import type { CompetitionPermissionsDTO } from "./dto";

export class CompetitionPermissionResolver {
  /**
   * Resolves all permissions available to the current actor.
   */
  static resolve(
    context: CompetitionContext,
  ): CompetitionPermissionsDTO {
    return {
      canView: this.can(context, CompetitionAction.VIEW),

      canEdit: this.can(context, CompetitionAction.EDIT),

      canDelete: this.can(context, CompetitionAction.DELETE),

      canPublish: this.can(
        context,
        CompetitionAction.PUBLISH,
      ),

      // canUnpublish: this.can(
      //   context,
      //   CompetitionAction.UNPUBLISH,
      // ),

      canManageMembers: this.can(
        context,
        CompetitionAction.MANAGE_MEMBERS,
      ),

      canManageMedia: this.can(
        context,
        CompetitionAction.MANAGE_MEDIA,
      ),

      canManageLinks: this.can(
        context,
        CompetitionAction.MANAGE_LINKS,
      ),
    };
  }

  private static can(
    context: CompetitionContext,
    action: CompetitionAction,
  ): boolean {
    return CompetitionPolicy.can(
      context,
      action,
    ).allowed;
  }
}