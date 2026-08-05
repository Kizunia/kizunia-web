import {
  AuthorizationCode,
  AuthorizationDecision,
  AuthorizationEvaluator,
} from "@/authorization";

import { ProjectVisibility } from "@/generated/prisma";

import { ProjectAction } from "./actions";
import type { ProjectContext } from "./context";
import { ProjectPermissionSet } from "./permission-set";

export class ProjectPolicy {
  static can(
    context: ProjectContext,
    action: ProjectAction,
  ): AuthorizationDecision {
    switch (action) {
      case ProjectAction.VIEW:
        return this.canView(context);

      default:
        return this.canManage(context, action);
    }
  }

  // ===========================================================================
  // Public View
  // ===========================================================================

  private static canView(
    context: ProjectContext,
  ): AuthorizationDecision {
    // Members can always view the project.
    if (context.membership) {
      return AuthorizationEvaluator
        .start(context)

        .security(
          (ctx) => !ctx.actor.banned,
          AuthorizationCode.ACCOUNT_BANNED,
          "Your account has been banned.",
        )

        .platformOverride()

        .require(
          (ctx) => !ctx.project.deletedAt,
          AuthorizationCode.RESOURCE_DELETED,
          "Project has been deleted.",
        )

        .grant()

        .evaluate();
    }

    // Non-members may only view public projects.
    return AuthorizationEvaluator
      .start(context)

      .security(
        (ctx) => !ctx.actor.banned,
        AuthorizationCode.ACCOUNT_BANNED,
        "Your account has been banned.",
      )

      .platformOverride()

      .require(
        (ctx) => !ctx.project.deletedAt,
        AuthorizationCode.RESOURCE_DELETED,
        "Project has been deleted.",
      )

      .require(
        (ctx) =>
          ctx.project.visibility ===
          ProjectVisibility.PUBLIC,
        AuthorizationCode.RESOURCE_PRIVATE,
        "Project is private.",
      )

      .grant()

      .evaluate();
  }

  // ===========================================================================
  // Management
  // ===========================================================================

  private static canManage(
    context: ProjectContext,
    action: ProjectAction,
  ): AuthorizationDecision {
    return AuthorizationEvaluator
      .start(context)

      .security(
        (ctx) => !ctx.actor.banned,
        AuthorizationCode.ACCOUNT_BANNED,
        "Your account has been banned.",
      )

      .platformOverride()

      .require(
        (ctx) => !ctx.project.deletedAt,
        AuthorizationCode.RESOURCE_DELETED,
        "Project has been deleted.",
      )

      .require(
        (ctx) => ctx.membership !== null,
        AuthorizationCode.ROLE_PERMISSION_DENIED,
        "You are not a project member.",
      )

      .permission(
        ProjectPermissionSet,
        context.membership?.role ?? null,
        action,
      )

      .evaluate();
  }
}