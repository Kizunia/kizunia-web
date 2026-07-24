import type {
    Hackathon,
    HackathonMember,
    
} from "@/generated/prisma";
import type { AuthorizationActor, AuthorizationContext } from "@/authorization";
/**
 * Complete authorization context for a Hackathon.
 *
 * This object contains everything required to make an
 * authorization decision.
 *
 * Once constructed, no additional database queries should
 * be required by the authorization system.
 */
export interface HackathonContext
    extends AuthorizationContext {
    /**
     * The authenticated user performing the action.
     */
    actor: AuthorizationActor;

    /**
     * The target hackathon.
     */
    hackathon: Hackathon;

    /**
     * The actor's membership within the hackathon.
     *
     * Null if the actor is not a member.
     */
    membership: HackathonMember | null;
}