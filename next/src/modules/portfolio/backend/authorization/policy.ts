import {
  AuthorizationCode,
  AuthorizationDecision,
  PlatformRole,
  
} from "@/authorization";

import { PortfolioVisibility } from "@/generated/prisma";

import { PortfolioAction } from "./actions";
import { PortfolioContext } from "./context";

export class PortfolioPolicy {
  static can(
    context: PortfolioContext,
    action: PortfolioAction,
  ): AuthorizationDecision {
    if (
      context.actor.role === PlatformRole.ADMIN ||
      context.actor.role === PlatformRole.SUPER_ADMIN
    ) {
      return {
        allowed: true,
      };
    }

    switch (action) {
      case PortfolioAction.CREATE:
        return this.canCreate(context);

      case PortfolioAction.VIEW:
        return this.canView(context);

      case PortfolioAction.EDIT:
        return this.canEdit(context);

      case PortfolioAction.DELETE:
        return this.canDelete(context);

      default:
        return {
          allowed: false,
          code: AuthorizationCode.UNAUTHORIZED,
          message: "Unknown portfolio action.",
        };
    }
  }

  // ===========================================================================
  // Rules
  // ===========================================================================

  private static canCreate(
    context: PortfolioContext,
  ): AuthorizationDecision {
    if (!context.actor.id) {
      return {
        allowed: false,
        code: AuthorizationCode.UNAUTHORIZED,
        message: "Authentication is required.",
      };
    }

    return {
      allowed: true,
    };
  }

  private static canView(
    context: PortfolioContext,
  ): AuthorizationDecision {
    if (!context.portfolio) {
      return {
        allowed: false,
        code: AuthorizationCode.UNAUTHORIZED,
        message: "Portfolio context is missing.",
      };
    }

    if (
      context.portfolio.visibility === PortfolioVisibility.PUBLIC
    ) {
      return {
        allowed: true,
      };
    }

    if (context.isOwner) {
      return {
        allowed: true,
      };
    }

    return {
      allowed: false,
      code: AuthorizationCode.UNAUTHORIZED,
      message: "You do not have permission to view this portfolio.",
    };
  }

  private static canEdit(
    context: PortfolioContext,
  ): AuthorizationDecision {
    if (!context.portfolio) {
      return {
        allowed: false,
        code: AuthorizationCode.UNAUTHORIZED,
        message: "Portfolio context is missing.",
      };
    }

    if (context.isOwner) {
      return {
        allowed: true,
      };
    }

    return {
      allowed: false,
      code: AuthorizationCode.UNAUTHORIZED,
      message: "You do not have permission to edit this portfolio.",
    };
  }

  private static canDelete(
    context: PortfolioContext,
  ): AuthorizationDecision {
    if (!context.portfolio) {
      return {
        allowed: false,
        code: AuthorizationCode.UNAUTHORIZED,
        message: "Portfolio context is missing.",
      };
    }

    if (context.isOwner) {
      return {
        allowed: true,
      };
    }

    return {
      allowed: false,
      code: AuthorizationCode.UNAUTHORIZED,
      message: "You do not have permission to delete this portfolio.",
    };
  }
}