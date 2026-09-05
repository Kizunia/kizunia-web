import { PlaceResolutionStatus, type PlaceResolution } from "@/generated/prisma";
import prisma from "@/lib/prisma";

export class PlaceResolutionRepository {
  /**
   * Database Layer
   *
   * Responsibilities
   * ----------------
   * ✓ Build Prisma queries
   * ✓ Execute database operations
   * ✓ Return Prisma models
   *
   * Does NOT
   * ----------------
   * ✗ Business rules
   * ✗ Authentication
   * ✗ Authorization
   * ✗ DTO Mapping
   */

  static async find(params: { placeId: string }): Promise<PlaceResolution | null> {
    return prisma.placeResolution.findUnique({
      where: { placeId: params.placeId },
    });
  }

  /**
   * Records a successful resolution.
   *
   * Overwrites a previous NOT_FOUND for the same id: place ids are occasionally
   * revived or re-pointed by the provider, and a row that once recorded a miss
   * must not outrank a fresh success.
   */
  static async saveResolved(params: {
    placeId: string;
    identityKeys: string[];
    displayName: string | null;
    contextLabel: string | null;
    extractionVersion: number;
  }): Promise<PlaceResolution> {
    const data = {
      status: PlaceResolutionStatus.RESOLVED,
      identityKeys: params.identityKeys,
      displayName: params.displayName,
      contextLabel: params.contextLabel,
      extractionVersion: params.extractionVersion,
      resolvedAt: new Date(),
    };

    return prisma.placeResolution.upsert({
      where: { placeId: params.placeId },
      create: { placeId: params.placeId, ...data },
      update: data,
    });
  }

  /**
   * Records that the provider refused this id.
   *
   * Only ever called for a *permanent* refusal. A transient failure must leave
   * no row, so an outage cannot be frozen into a lasting "this place matches
   * nothing" — which would be indistinguishable, later, from a genuine result.
   *
   * Identity keys are cleared rather than preserved: a row that says NOT_FOUND
   * while still carrying keys would be one stale read away from silently
   * behaving like a success.
   */
  static async saveNotFound(params: {
    placeId: string;
    extractionVersion: number;
  }): Promise<PlaceResolution> {
    const data = {
      status: PlaceResolutionStatus.NOT_FOUND,
      identityKeys: [],
      displayName: null,
      contextLabel: null,
      extractionVersion: params.extractionVersion,
      resolvedAt: new Date(),
    };

    return prisma.placeResolution.upsert({
      where: { placeId: params.placeId },
      create: { placeId: params.placeId, ...data },
      update: data,
    });
  }
}
