import { Authorization } from "@/authorization";

import { HackathonAction } from "./actions";
import type { HackathonContext } from "./context";
import { HackathonPolicy } from "./policy";

import { PlatformAction } from "@/authorization/platform/actions";
import type { PlatformContext } from "@/authorization/platform/context";
import { PlatformPolicy } from "@/authorization/platform/policy";

export class HackathonAuthorizer {
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
        context: HackathonContext,
    ): void {
        Authorization.assert(
            HackathonPolicy.can(
                context,
                HackathonAction.EDIT,
            ),
        );
    }

    static delete(
        context: HackathonContext,
    ): void {
        Authorization.assert(
            HackathonPolicy.can(
                context,
                HackathonAction.DELETE,
            ),
        );
    }

    static can(
        context: HackathonContext,
        action: HackathonAction,
    ): void {
        Authorization.assert(
            HackathonPolicy.can(
                context,
                action,
            ),
        );
    }
}