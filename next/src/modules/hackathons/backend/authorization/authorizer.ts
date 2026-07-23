import type { AuthorizationDecision } from "@/authorization";

import { HackathonAction } from "./actions";
import type { HackathonContext } from "./context";
import { HackathonPolicy } from "./policy";

export class HackathonAuthorizer {
    /**
     * Determines whether the actor can perform the given action
     * on the provided hackathon context.
     */
    static can(
        context: HackathonContext,
        action: HackathonAction,
    ): AuthorizationDecision {
        return HackathonPolicy.can(
            context,
            action,
        );
    }
}