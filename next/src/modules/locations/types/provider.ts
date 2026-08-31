import type { LocationPrecision, LocationProvider } from "@/generated/prisma";

/**
 * A candidate place returned by a search, before anything is persisted.
 *
 * Suggestions are transient. Nothing in the platform may hold a reference to
 * one — selecting a suggestion copies its fields into a `Location` row, so the
 * competition stops depending on the provider the moment it is saved.
 */
export interface LocationSuggestion {
  /**
   * Stable key for the suggestion within a single result list.
   * Used by the UI for selection only; never persisted.
   */
  key: string;

  displayName: string;

  precision: LocationPrecision;

  country: string | null;

  countryCode: string | null;

  state: string | null;

  stateCode: string | null;

  city: string | null;

  postalCode: string | null;

  latitude: number | null;

  longitude: number | null;

  provider: LocationProvider;

  providerLocationId: string | null;
}

/**
 * A source of location suggestions.
 *
 * Implementations must be replaceable and must never be required for the
 * platform to function — see `LocationSearchService`, which treats every
 * provider as best-effort.
 */
export interface LocationSearchProvider {
  readonly name: LocationProvider;

  /**
   * Return candidate places for a free-text query.
   *
   * Implementations should reject rather than hang; the caller applies its own
   * timeout, but a provider that ignores `signal` will still block a request
   * slot until it settles.
   */
  search(
    query: string,
    options: {
      limit: number;
      signal: AbortSignal;
    },
  ): Promise<LocationSuggestion[]>;
}

/**
 * Result of a hybrid search.
 *
 * `providerAvailable` is false when the external lookup was skipped or failed.
 * The UI uses it to explain why results look thin and to steer the admin toward
 * manual entry — it is never an error condition.
 */
export interface LocationSearchResult {
  suggestions: LocationSuggestion[];

  providerAvailable: boolean;
}
