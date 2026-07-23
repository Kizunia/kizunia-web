// import type { User } from "@/generated/prisma";

import { PlatformRole } from "../platform/roles";

// export interface AuthorizationContext {
//     actor: Pick<User, "role" | "banned">;
// }

export interface AuthorizationActor {
    role: PlatformRole | string  | null; //TODO: change to PlatformRole | null when all roles are migrated to platform roles
    banned: boolean | null;
}

export interface AuthorizationContext {
    actor: AuthorizationActor;
}