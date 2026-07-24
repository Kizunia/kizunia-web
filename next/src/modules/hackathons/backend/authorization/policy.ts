import {
    AuthorizationCode,
    AuthorizationDecision,
    AuthorizationEvaluator,
} from "@/authorization";

import { CompetitionAction } from "./actions";
import { CompetitionContext } from "./context";
import { HackathonPermissionSet } from "./permission-set";

export class CompetitionPolicy {
    static can(
        context: CompetitionContext,
        action: CompetitionAction,
    ): AuthorizationDecision {
        return AuthorizationEvaluator
            .start(context)

            // .platformOverride(
            //     ctx =>
            //         ctx.actor.role === "ADMIN" ||
            //         ctx.actor.role === "SUPER_ADMIN",
            // )
            .platformOverride()

            .security(
                ctx => !ctx.actor.banned,
                AuthorizationCode.ACCOUNT_BANNED,
                "Your account has been banned.",
            )

            .require(
                ctx => ctx.membership !== null,
                AuthorizationCode.ROLE_PERMISSION_DENIED,
                "You are not a hackathon maintainer.",
            )

            .permission(
                HackathonPermissionSet,
                context.membership?.role ?? null,
                action,
            )

            .require(
                ctx => !ctx.hackathon.deletedAt,
                AuthorizationCode.RESOURCE_DELETED,
                "This hackathon has been deleted.",
            )

            .allow();
    }
}