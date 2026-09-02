import { Prisma } from "@/generated/prisma";
import prisma from "@/lib/prisma";

import type { NormalizedLocation } from "../utils/normalize";

export class LocationRepository {
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
  static async create(
    data: NormalizedLocation,
    db: Prisma.TransactionClient | typeof prisma = prisma,
  ) {
    return db.location.create({
      data,
    });
  }

  static async update(
    id: string,
    data: NormalizedLocation,
    db: Prisma.TransactionClient | typeof prisma = prisma,
  ) {
    return db.location.update({
      where: {
        id,
      },
      data,
    });
  }

  /**
   * Deletes a location that is no longer referenced by any competition.
   *
   * Locations are private to the competition that created them, so an unlinked
   * row is unreachable rather than merely unused. The reference count is still
   * checked because a caller could pass an id that a future feature shares.
   */
  static async deleteIfOrphaned(
    id: string,
    db: Prisma.TransactionClient | typeof prisma = prisma,
  ): Promise<boolean> {
    const references = await db.competitionLocation.count({
      where: {
        locationId: id,
      },
    });

    if (references > 0) {
      return false;
    }

    await db.location.delete({
      where: {
        id,
      },
    });

    return true;
  }
}
