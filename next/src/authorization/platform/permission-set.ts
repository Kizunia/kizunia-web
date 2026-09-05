import { PlatformRole } from "./roles";
import { PlatformAction } from "./actions";

/**
 * Baseline capabilities every signed-in role has, regardless of elevation.
 *
 * Permissions here are NOT inherited automatically by the evaluator — it
 * does a flat `permissionSet[role].has(action)` lookup — so every role must
 * spread these in explicitly. Without that, elevating a user to ADMIN would
 * silently *remove* their ability to browse public projects.
 */
const BASELINE: readonly PlatformAction[] = [
    PlatformAction.VIEW_PUBLIC_PROJECTS,
    PlatformAction.CREATE_PROJECT,
    PlatformAction.CREATE_COMPETITION_SUGGESTION,
];

export const PlatformPermissionSet = {
    [PlatformRole.USER]: new Set<PlatformAction>([
        ...BASELINE,
    ]),

    // TODO: MODERATOR's real capabilities are undecided. It is present here
    // only with the baseline, because every PlatformRole must have an entry
    // — a missing one makes `permissionSet[role]` undefined and every
    // permission check for that role throw.
    [PlatformRole.MODERATOR]: new Set<PlatformAction>([
        ...BASELINE,
    ]),

    [PlatformRole.ADMIN]: new Set<PlatformAction>([
        ...BASELINE,
        PlatformAction.CREATE_COMPETITION,
        PlatformAction.VIEW_ALL_COMPETITIONS,
        PlatformAction.ACCESS_ADMIN_DASHBOARD,
    ]),

    [PlatformRole.SUPER_ADMIN]: new Set<PlatformAction>([
        ...BASELINE,
        PlatformAction.CREATE_COMPETITION,
        PlatformAction.VIEW_ALL_COMPETITIONS,
        PlatformAction.ACCESS_ADMIN_DASHBOARD,
        PlatformAction.MANAGE_USERS,
    ]),
} as const;