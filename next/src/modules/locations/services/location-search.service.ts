import type { Location } from "@/generated/prisma";

import { LocationRepository } from "../repository/location.repository";
import { resolveLocationProvider } from "../providers";
import type {
  LocationSearchProvider,
  LocationSearchResult,
  LocationSuggestion,
} from "../types/provider";

/**
 * How long an external provider gets before the search gives up on it.
 *
 * Deliberately short: an admin waiting on a location picker would rather see
 * internal results immediately than a complete list eventually.
 */
const PROVIDER_TIMEOUT_MS = 3_000;

export class LocationSearchService {
  /**
   * Hybrid location search.
   *
   * Internal results are authoritative and always returned. The external
   * provider is a best-effort enhancement layered on top: every failure mode —
   * unconfigured, unreachable, slow, malformed — degrades to internal-only
   * results rather than propagating an error.
   *
   * This is the guarantee that a geocoding outage can never block competition
   * editing, so this method must not throw for provider reasons.
   */
  static async search(
    query: string,
    limit: number,
    provider: LocationSearchProvider | null = resolveLocationProvider(),
  ): Promise<LocationSearchResult> {
    const internal = await LocationRepository.search(query, limit);

    const suggestions = internal.map((location) => this.toSuggestion(location));

    if (!provider) {
      return {
        suggestions: this.dedupe(suggestions, limit),
        providerAvailable: false,
      };
    }

    const external = await this.searchProvider(provider, query, limit);

    if (external === null) {
      return {
        suggestions: this.dedupe(suggestions, limit),
        providerAvailable: false,
      };
    }

    return {
      suggestions: this.dedupe([...suggestions, ...external], limit),
      providerAvailable: true,
    };
  }

  /**
   * Runs the provider under a timeout, converting every failure into `null`.
   *
   * Returning `null` rather than an empty array keeps "the provider had nothing
   * to say" distinguishable from "the provider could not be reached", which is
   * what the UI needs to decide whether to nudge the admin toward manual entry.
   */
  private static async searchProvider(
    provider: LocationSearchProvider,
    query: string,
    limit: number,
  ): Promise<LocationSuggestion[] | null> {
    const controller = new AbortController();

    const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);

    try {
      return await provider.search(query, {
        limit,
        signal: controller.signal,
      });
    } catch (error) {
      console.warn(
        `Location provider "${provider.name}" search failed; falling back to internal results.`,
        error,
      );

      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Projects a stored location into a suggestion.
   *
   * Selecting one still creates a fresh Location row — locations are never
   * shared between competitions — so this only reuses the *data*, not the row.
   */
  private static toSuggestion(location: Location): LocationSuggestion {
    return {
      key: `internal:${location.id}`,

      displayName: location.displayName,

      precision: location.precision,

      country: location.country,

      countryCode: location.countryCode,

      state: location.state,

      stateCode: location.stateCode,

      city: location.city,

      postalCode: location.postalCode,

      latitude: location.latitude?.toNumber() ?? null,

      longitude: location.longitude?.toNumber() ?? null,

      provider: location.provider,

      providerLocationId: location.providerLocationId,
    };
  }

  /**
   * Collapses suggestions that name the same place.
   *
   * Internal results come first, so a place the platform already knows wins
   * over the provider's rendering of the same name.
   */
  private static dedupe(
    suggestions: LocationSuggestion[],
    limit: number,
  ): LocationSuggestion[] {
    const seen = new Set<string>();

    const unique: LocationSuggestion[] = [];

    for (const suggestion of suggestions) {
      const key = suggestion.displayName.trim().toLowerCase();

      if (seen.has(key)) {
        continue;
      }

      seen.add(key);

      unique.push(suggestion);

      if (unique.length >= limit) {
        break;
      }
    }

    return unique;
  }
}
