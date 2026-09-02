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

  static async find(placeId: string) {
    return prisma.placeResolution.findUnique({
      where: { placeId },
    });
  }

  /**
   * Records a successful resolution.
   *
   * Only ever called for a success. A failed provider call must leave no row,
   * so a transient outage cannot be frozen into a permanent "this place matches
   * nothing" — which would be indistinguishable, later, from a genuine result.
   */
  static async save(params: {
    placeId: string;
    identityKeys: string[];
    displayName: string | null;
    contextLabel: string | null;
    extractionVersion: number;
  }) {
    const data = {
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
}
