import type { User } from "@/generated/prisma";
import { PlatformRole } from "./roles";
type PlatformActor = Pick<User, "role">;

export class PlatformAccess {
    static canBypassAuthorization(actor: PlatformActor): boolean {
        if (!actor.role) {
            return false;
        }
        
        return (
            actor.role === PlatformRole.ADMIN ||
            actor.role === PlatformRole.SUPER_ADMIN
        );
    }
}