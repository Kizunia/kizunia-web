import type {
  HackathonMemberRole,
  HackathonStatus,
  HackathonVisibility,
} from "@/generated/prisma";

import type { CompetitionPermissionsDTO } from "./competition-permissions.dto";

/**
 * Lightweight DTO used by management tables.
 *
 * This is intentionally different from the public competition DTO.
 * It contains only the information required for list views.
 */
export interface CompetitionManagementTableDTO {
  id: string;

  slug: string;

  title: string;

  organizer: string | null;

  logoUrl: string | null;

  status: HackathonStatus | null;

  visibility: HackathonVisibility;

  registrationDeadline: Date | null;

  role: HackathonMemberRole;

  memberCount: number;

  updatedAt: Date;

  permissions: CompetitionPermissionsDTO;
}
