import type { LocationSearchProvider } from "../types/provider";
import { NominatimLocationProvider } from "./nominatim.provider";

const DEFAULT_NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";

/**
 * Resolves the configured external provider, or `null` when none is set up.
 *
 * `null` is a supported, fully functional state — not a misconfiguration.
 * Location search falls back to internal results and manual entry, so a
 * deployment can run indefinitely without any third-party geocoding.
 *
 * Environment
 * -----------
 * LOCATION_PROVIDER            "nominatim" to enable; anything else disables.
 * LOCATION_PROVIDER_USER_AGENT Contact string required by Nominatim's policy.
 * NOMINATIM_BASE_URL           Override to point at a self-hosted instance.
 */
export function resolveLocationProvider(): LocationSearchProvider | null {
  const configured = process.env.LOCATION_PROVIDER?.trim().toLowerCase();

  if (configured !== "nominatim") {
    return null;
  }

  const userAgent = process.env.LOCATION_PROVIDER_USER_AGENT?.trim();

  // Nominatim blocks unidentified clients, so an unset User-Agent would fail
  // on every request. Refusing to construct the provider degrades to internal
  // search immediately instead of burning a timeout per search.
  if (!userAgent) {
    return null;
  }

  return new NominatimLocationProvider(
    process.env.NOMINATIM_BASE_URL?.trim() || DEFAULT_NOMINATIM_BASE_URL,
    userAgent,
  );
}

export { NominatimLocationProvider };
