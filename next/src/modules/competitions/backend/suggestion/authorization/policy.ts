import {
  AuthorizationCode,
  AuthorizationDecision,
  AuthorizationEvaluator,
} from "@/authorization";

import { CompetitionSuggestionAction } from "./actions";
import type { CompetitionSuggestionContext } from "./context";

export class CompetitionSuggestionPolicy {
  static can(
    context: CompetitionSuggestionContext,
    action: CompetitionSuggestionAction,
  ): AuthorizationDecision {
    switch (action) {
      case CompetitionSuggestionAction.VIEW:
        return this.canView(context);

      case CompetitionSuggestionAction.UPDATE:
        return this.canUpdate(context);

      case CompetitionSuggestionAction.SUBMIT:
        return this.canSubmit(context);

      case CompetitionSuggestionAction.DELETE:
        return this.canDelete(context);

      default:
        return this.canManage(context);
    }
  }

  // ===========================================================================
  // View
  // ===========================================================================

  private static canView(
    context: CompetitionSuggestionContext,
  ): AuthorizationDecision {
    return AuthorizationEvaluator
      .start(context)

      .platformOverride()

      .security(
        (ctx) => !ctx.actor.banned,
        AuthorizationCode.ACCOUNT_BANNED,
        "Your account has been banned.",
      )

      .require(
        (ctx) =>
          ctx.actor.id === ctx.suggestion.submittedById,
        AuthorizationCode.ROLE_PERMISSION_DENIED,
        "You can only access your own competition suggestions.",
      )

      .require(
        (ctx) => !ctx.suggestion.deletedAt,
        AuthorizationCode.RESOURCE_DELETED,
        "Competition suggestion has been deleted.",
      )

      .grant()

      .evaluate();
  }

  // ===========================================================================
  // Update
  // ===========================================================================

  private static canUpdate(
    context: CompetitionSuggestionContext,
  ): AuthorizationDecision {
    return AuthorizationEvaluator
      .start(context)

      .platformOverride()

      .security(
        (ctx) => !ctx.actor.banned,
        AuthorizationCode.ACCOUNT_BANNED,
        "Your account has been banned.",
      )

      .require(
        (ctx) =>
          ctx.actor.id === ctx.suggestion.submittedById,
        AuthorizationCode.ROLE_PERMISSION_DENIED,
        "You can only edit your own competition suggestions.",
      )

      .require(
        (ctx) =>
          !ctx.suggestion.deletedAt,
        AuthorizationCode.RESOURCE_DELETED,
        "Competition suggestion has been deleted.",
      )

      // V1:
      // suggestions may still be edited while UNDER_REVIEW.
      .require(
        (ctx) =>
          ctx.suggestion.status === "DRAFT" ||
          ctx.suggestion.status === "UNDER_REVIEW",
        AuthorizationCode.ROLE_PERMISSION_DENIED,
        "This competition suggestion cannot be edited.",
      )

      .grant()

      .evaluate();
  }

  // ===========================================================================
  // Submit
  // ===========================================================================

  private static canSubmit(
    context: CompetitionSuggestionContext,
  ): AuthorizationDecision {
    return AuthorizationEvaluator
      .start(context)

      .platformOverride()

      .security(
        (ctx) => !ctx.actor.banned,
        AuthorizationCode.ACCOUNT_BANNED,
        "Your account has been banned.",
      )

      .require(
        (ctx) =>
          ctx.actor.id === ctx.suggestion.submittedById,
        AuthorizationCode.ROLE_PERMISSION_DENIED,
        "You can only submit your own competition suggestions.",
      )

      .require(
        (ctx) =>
          !ctx.suggestion.deletedAt,
        AuthorizationCode.RESOURCE_DELETED,
        "Competition suggestion has been deleted.",
      )

      .require(
        (ctx) =>
          ctx.suggestion.status === "DRAFT",
        AuthorizationCode.ROLE_PERMISSION_DENIED,
        "Only draft competition suggestions can be submitted.",
      )

      .grant()

      .evaluate();
  }

  // ===========================================================================
  // Delete
  // ===========================================================================

  private static canDelete(
    context: CompetitionSuggestionContext,
  ): AuthorizationDecision {
    return AuthorizationEvaluator
      .start(context)

      .platformOverride()

      .security(
        (ctx) => !ctx.actor.banned,
        AuthorizationCode.ACCOUNT_BANNED,
        "Your account has been banned.",
      )

      .require(
        (ctx) =>
          ctx.actor.id === ctx.suggestion.submittedById,
        AuthorizationCode.ROLE_PERMISSION_DENIED,
        "You can only delete your own competition suggestions.",
      )

      .require(
        (ctx) =>
          !ctx.suggestion.deletedAt,
        AuthorizationCode.RESOURCE_DELETED,
        "Competition suggestion has been deleted.",
      )

      .require(
        (ctx) =>
          ctx.suggestion.status === "DRAFT",
        AuthorizationCode.ROLE_PERMISSION_DENIED,
        "Only draft competition suggestions can be deleted.",
      )

      .grant()

      .evaluate();
  }

  // ===========================================================================
  // Management
  // ===========================================================================

  private static canManage(
    context: CompetitionSuggestionContext,
  ): AuthorizationDecision {
    return AuthorizationEvaluator
      .start(context)

      .platformOverride()

      .security(
        (ctx) => !ctx.actor.banned,
        AuthorizationCode.ACCOUNT_BANNED,
        "Your account has been banned.",
      )

      .require(
        (ctx) =>
          ctx.actor.id === ctx.suggestion.submittedById,
        AuthorizationCode.ROLE_PERMISSION_DENIED,
        "You can only manage your own competition suggestions.",
      )

      .require(
        (ctx) => !ctx.suggestion.deletedAt,
        AuthorizationCode.RESOURCE_DELETED,
        "Competition suggestion has been deleted.",
      )

      .grant()

      .evaluate();
  }
}