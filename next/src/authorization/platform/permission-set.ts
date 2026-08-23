import { PlatformRole } from "./roles";
import { PlatformAction } from "./actions";

export const PlatformPermissionSet = {
    [PlatformRole.USER]: new Set<PlatformAction>([
        PlatformAction.VIEW_PUBLIC_PROJECTS,
        PlatformAction.CREATE_COMPETITION_SUGGESTION
    ]),

    [PlatformRole.ADMIN]: new Set<PlatformAction>([
        PlatformAction.CREATE_COMPETITION,
        PlatformAction.VIEW_ALL_COMPETITIONS,
        PlatformAction.ACCESS_ADMIN_DASHBOARD,
    ]),

    [PlatformRole.SUPER_ADMIN]: new Set<PlatformAction>([
        PlatformAction.CREATE_COMPETITION,
        PlatformAction.VIEW_ALL_COMPETITIONS,
        PlatformAction.ACCESS_ADMIN_DASHBOARD,
        PlatformAction.MANAGE_USERS,
    ]),
} as const;