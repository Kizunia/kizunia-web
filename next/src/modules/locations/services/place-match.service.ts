import prisma from "@/lib/prisma";

import { resolvePlaceProvider } from "../providers";
import { PlaceResolutionRepository } from "../repository/place-resolution.repository";
import type { PlaceDetails } from "../types/place";
import {
  EXTRACTION_VERSION,
  extractSelectedPlaceIdentities,
} from "../utils/extract-search-areas";

/** How long a cached resolution stays usable before it is refreshed. */
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1_000;

/** Ceiling on a single place-details lookup during a search. */
const PROVIDER_TIMEOUT_MS = 4_000;

export type PlaceResolutionFailure =
  | "PROVIDER_UNAVAILABLE"
  | "PROVIDER_TIMEOUT"
  | "PLACE_NOT_FOUND"
  | "MALFORMED_RESPONSE";

/**
 * The three outcomes a location search can have, kept deliberately distinct.
 *
 * `RESOLVED` with no matching areas is a *successful* search of a real place
 * that happens to have no competitions. A provider failure is not that, and
 * collapsing the two would tell a user "nothing is happening here" when the
 * truth is "we could not find out".
 */
export type PlaceResolution =
  | {
      status: "RESOLVED";
      identityKeys: string[];
      searchAreaIds: string[];
      displayName: string | null;
    }
  | { status: "RESOLUTION_FAILED"; reason: PlaceResolutionFailure };

/** In-flight lookups, so concurrent identical searches make one provider call. */
const inFlight = new Map<string, Promise<PlaceResolution>>();

export class PlaceMatchService {
  /**
   * Business Layer
   *
   * Responsibilities
   * ----------------
   * ✓ Business rules
   * ✓ Repository orchestration
   * ✓ Provider resolution and caching
   *
   * Does NOT
   * ----------------
   * ✗ Parse HTTP requests
   * ✗ Authenticate users
   * ✗ Authorize users
   * ✗ Build competition queries
   */

  /**
   * Resolves a provider place into the SearchAreas a search should match.
   *
   * Runs before any query is built, because the search engine is synchronous
   * and pure — it cannot call a provider or read the database from inside a
   * filter.
   *
   * Never creates a SearchArea. Only ingestion does. Searching is a read, and
   * letting a read write would let anyone grow the table by typing.
   */
  static async resolve(placeId: string): Promise<PlaceResolution> {
    const existing = inFlight.get(placeId);

    if (existing) {
      return existing;
    }

    const pending = this.resolveUncached(placeId).finally(() => {
      inFlight.delete(placeId);
    });

    inFlight.set(placeId, pending);

    return pending;
  }

  private static async resolveUncached(
    placeId: string,
  ): Promise<PlaceResolution> {
    const cached = await PlaceResolutionRepository.find(placeId);

    const isFresh =
      cached !== null &&
      cached.extractionVersion === EXTRACTION_VERSION &&
      Date.now() - cached.resolvedAt.getTime() < CACHE_TTL_MS;

    if (cached && isFresh) {
      return this.toResolved(
        cached.identityKeys,
        cached.displayName,
      );
    }

    const details = await this.fetchDetails(placeId);

    if (details.status === "RESOLUTION_FAILED") {
      // A stale entry beats an outage: the place did resolve once, and its
      // identities rarely change. Only a place we have never resolved at all
      // surfaces the failure.
      if (cached) {
        return this.toResolved(cached.identityKeys, cached.displayName);
      }

      return details;
    }

    const identityKeys = extractSelectedPlaceIdentities(details.details);

    await PlaceResolutionRepository.save({
      placeId,
      identityKeys,
      displayName: details.details.displayName,
      contextLabel: details.details.formattedAddress,
      extractionVersion: EXTRACTION_VERSION,
    });

    return this.toResolved(identityKeys, details.details.displayName);
  }

  /**
   * Looks up which stored areas carry any of these identities.
   *
   * An empty result is a legitimate answer — the place is real, nothing is
   * stored under it — and is returned as a success, not an error.
   */
  private static async toResolved(
    identityKeys: string[],
    displayName: string | null,
  ): Promise<PlaceResolution> {
    if (identityKeys.length === 0) {
      return {
        status: "RESOLVED",
        identityKeys,
        searchAreaIds: [],
        displayName,
      };
    }

    const areas = await prisma.searchArea.findMany({
      where: { identityKey: { in: identityKeys } },
      select: { id: true },
    });

    return {
      status: "RESOLVED",
      identityKeys,
      searchAreaIds: areas.map((area) => area.id),
      displayName,
    };
  }

  private static async fetchDetails(
    placeId: string,
  ): Promise<
    | { status: "OK"; details: PlaceDetails }
    | { status: "RESOLUTION_FAILED"; reason: PlaceResolutionFailure }
  > {
    const provider = resolvePlaceProvider();

    if (!provider) {
      return { status: "RESOLUTION_FAILED", reason: "PROVIDER_UNAVAILABLE" };
    }

    const controller = new AbortController();

    const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);

    try {
      const details = await provider.resolve(placeId, {
        signal: controller.signal,
      });

      return { status: "OK", details };
    } catch (error) {
      return {
        status: "RESOLUTION_FAILED",
        reason: this.classify(error),
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Maps a provider error onto a reason the caller can act on.
   *
   * The distinction that matters is "this place does not exist" versus
   * "we could not reach the provider": the first is permanent and worth
   * telling the user about, the second is worth retrying.
   */
  private static classify(error: unknown): PlaceResolutionFailure {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return "PROVIDER_TIMEOUT";
      }

      if (error.message.includes("404") || error.message.includes("400")) {
        return "PLACE_NOT_FOUND";
      }

      if (error.message.includes("no display name")) {
        return "MALFORMED_RESPONSE";
      }
    }

    return "PROVIDER_UNAVAILABLE";
  }
}
