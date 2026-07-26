import {
  AuthorizationCode,
  AuthorizationDecision,
  AuthorizationEvaluator,
} from "@/authorization";

import { CompetitionAction } from "./actions";
import type { CompetitionContext } from "./context";
import { HackathonPermissionSet } from "./permission-set";
import { HackathonVisibility } from "@/generated/prisma";

export class CompetitionPolicy {
  static can(
    context: CompetitionContext,
    action: CompetitionAction,
  ): AuthorizationDecision {
    switch (action) {
      case CompetitionAction.VIEW:
        return this.canView(context);

      default:
        return this.canManage(context, action);
    }
  }

  /**
   * ===========================================================================
   * Public View
   * ===========================================================================
   */
  private static canView(
    context: CompetitionContext,
  ): AuthorizationDecision {
    return AuthorizationEvaluator.start(context)

      // Platform admins can always access
      .platformOverride()

      // Banned users cannot access anything
      .security(
        (ctx) => !ctx.actor.banned,
        AuthorizationCode.ACCOUNT_BANNED,
        "Your account has been banned.",
      )

      // Deleted competitions are not visible
      .require(
        (ctx) => !ctx.hackathon.deletedAt,
        AuthorizationCode.RESOURCE_DELETED,
        "Competition has been deleted.",
      )

      // Only public competitions
      .require(
        (ctx) =>
          ctx.hackathon.visibility ===
          HackathonVisibility.PUBLIC,
        AuthorizationCode.RESOURCE_PRIVATE,
        "Competition is private.",
      )

      // Explicitly allow
      .grant()

      .evaluate();
  }

  /**
   * ===========================================================================
   * Management
   * ===========================================================================
   */
  private static canManage(
    context: CompetitionContext,
    action: CompetitionAction,
  ): AuthorizationDecision {
    return AuthorizationEvaluator.start(context)

      // Platform admins bypass everything
      
      // Banned users cannot access anything
      .security(
        (ctx) => !ctx.actor.banned,
        AuthorizationCode.ACCOUNT_BANNED,
        "Your account has been banned.",
      )
      .platformOverride()

      // Deleted competitions cannot be managed
      .require(
        (ctx) => !ctx.hackathon.deletedAt,
        AuthorizationCode.RESOURCE_DELETED,
        "Competition has been deleted.",
      )

      // Must be a member
      .require(
        (ctx) => ctx.membership !== null,
        AuthorizationCode.ROLE_PERMISSION_DENIED,
        "You are not a maintainer.",
      )

      // Must have permission
      .permission(
        HackathonPermissionSet,
        context.membership?.role ?? null,
        action,
      )

      .evaluate();
  }
}