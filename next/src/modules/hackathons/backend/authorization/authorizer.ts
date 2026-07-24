import { Authorization } from "@/authorization";

import { CompetitionAction } from "./actions";
import type { CompetitionContext } from "./context";
import { CompetitionPolicy } from "./policy";

import { PlatformAction } from "@/authorization/platform/actions";
import type { PlatformContext } from "@/authorization/platform/context";
import { PlatformPolicy } from "@/authorization/platform/policy";

export class CompetitionAuthorizer {
    static create(
        context: PlatformContext,
    ): void {
        Authorization.assert(
            PlatformPolicy.can(
                context,
                PlatformAction.CREATE_HACKATHON,
            ),
        );
    }

    static edit(
        context: CompetitionContext,
    ): void {
        Authorization.assert(
            CompetitionPolicy.can(
                context,
                CompetitionAction.EDIT,
            ),
        );
    }

    static delete(
        context: CompetitionContext,
    ): void {
        Authorization.assert(
            CompetitionPolicy.can(
                context,
                CompetitionAction.DELETE,
            ),
        );
    }

    static can(
        context: CompetitionContext,
        action: CompetitionAction,
    ): void {
        Authorization.assert(
            CompetitionPolicy.can(
                context,
                action,
            ),
        );
    }
}