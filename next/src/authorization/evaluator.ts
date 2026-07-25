import { PlatformAccess } from ".";
import { AuthorizationCode, type AuthorizationDecision } from "./types";
import type { AuthorizationContext } from "./types/context";
import { allow, deny } from "./utils";

export class AuthorizationEvaluator<
  TContext extends AuthorizationContext,
  TAction,
  TRole extends string,
> {
  /**
   * First deny wins.
   */
  private decision: AuthorizationDecision | null = null;

  /**
   * At least one rule explicitly allowed.
   */
  private allowed = false;

  private constructor(private readonly context: TContext) {}

  static start<
    TContext extends AuthorizationContext,
    TAction,
    TRole extends string,
  >(context: TContext) {
    return new AuthorizationEvaluator<TContext, TAction, TRole>(context);
  }

  // ===========================================================================
  // Platform Override
  // ===========================================================================

  platformOverride() {
    if (this.decision) {
      return this;
    }

    if (PlatformAccess.canBypassAuthorization(this.context.actor)) {
      this.allowed = true;
    }

    return this;
  }

  // ===========================================================================
  // Security
  // ===========================================================================

  security(
    predicate: (context: TContext) => boolean,
    code: AuthorizationCode,
    message: string,
  ) {
    if (this.decision) {
      return this;
    }

    if (!predicate(this.context)) {
      this.decision = deny(code, message);
    }

    return this;
  }

  // ===========================================================================
  // Permission
  // ===========================================================================

  permission(
    permissionSet: Readonly<Record<TRole, ReadonlySet<TAction>>>,
    role: TRole | null | undefined,
    action: TAction,
  ) {
    if (this.decision) {
      return this;
    }

    if (!role) {
      this.decision = deny(
        AuthorizationCode.ROLE_PERMISSION_DENIED,
        "You do not have permission to perform this action.",
      );

      return this;
    }

    const permissions = permissionSet[role];

    if (permissions.has(action)) {
      this.allowed = true;
    } else {
      this.decision = deny(
        AuthorizationCode.ROLE_PERMISSION_DENIED,
        "You do not have permission to perform this action.",
      );
    }

    return this;
  }

  // ===========================================================================
  // Requirement
  // ===========================================================================

  require(
    predicate: (context: TContext) => boolean,
    code: AuthorizationCode,
    message: string,
  ) {
    if (this.decision) {
      return this;
    }

    if (!predicate(this.context)) {
      this.decision = deny(code, message);
    }

    return this;
  }

  // ===========================================================================
  // Final Decision
  // ===========================================================================

  allow(): AuthorizationDecision {
    if (this.decision) {
      return this.decision;
    }

    if (this.allowed) {
      return allow();
    }

    return deny(AuthorizationCode.ROLE_PERMISSION_DENIED, "Access denied.");
  }

  grant() {
    if (this.decision) {
      return this;
    }

    this.allowed = true;

    return this;
  }

  evaluate(): AuthorizationDecision {
    if (this.decision) {
      return this.decision;
    }

    if (this.allowed) {
      return allow();
    }

    return deny(AuthorizationCode.ROLE_PERMISSION_DENIED, "Access denied.");
  }
}
