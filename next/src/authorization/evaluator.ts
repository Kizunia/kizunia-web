import { allow, deny } from "./utils";
import {
    AuthorizationCode,
    type AuthorizationDecision,
} from "./types";

export class AuthorizationEvaluator<TContext, TAction, TRole extends string> {
    private decision: AuthorizationDecision | null = null;

    private constructor(private readonly context: TContext) {}

    static start<TContext, TAction, TRole extends string>(
        context: TContext,
    ) {
        return new AuthorizationEvaluator<TContext, TAction, TRole>(context);
    }

    platformOverride(
        predicate: (context: TContext) => boolean,
    ) {
        if (this.decision) {
            return this;
        }

        if (predicate(this.context)) {
            this.decision = allow();
        }

        return this;
    }

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

    permission(
        permissionSet: Readonly<Record<TRole, ReadonlySet<TAction>>>,
        role: TRole | null,
        action: TAction,
    ) {
        if (this.decision) {
            return this;
        }

        if (!role) {
            return this;
        }

        const permissions = permissionSet[role];

        if (!permissions.has(action)) {
            this.decision = deny(
                AuthorizationCode.ROLE_PERMISSION_DENIED,
                "You do not have permission to perform this action.",
            );
        }

        return this;
    }

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

    allow(): AuthorizationDecision {
        return this.decision ?? allow();
    }
}