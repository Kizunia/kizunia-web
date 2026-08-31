import { LocationPrecision, LocationProvider } from "@/generated/prisma";

import type { LocationSearchProvider, LocationSuggestion } from "../types/provider";
import { inferPrecision } from "../utils/normalize";

/**
 * OSM classes that describe a specific site rather than an administrative area.
 * A hit in one of these is a real venue — an auditorium, a campus, a stadium —
 * which no combination of city/state/country could establish on its own.
 */
const VENUE_CLASSES = new Set([
  "amenity",
  "building",
  "leisure",
  "office",
  "shop",
  "tourism",
  "historic",
]);

interface NominatimAddress {
  country?: string;
  country_code?: string;
  state?: string;
  "ISO3166-2-lvl4"?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  postcode?: string;
}

interface NominatimResult {
  osm_type?: string;
  osm_id?: number;
  display_name?: string;
  class?: string;
  lat?: string;
  lon?: string;
  address?: NominatimAddress;
}

/**
 * OpenStreetMap-backed location suggestions.
 *
 * Chosen as the default external provider because it needs no API key, which
 * keeps the enhancement layer genuinely optional — a deployment that never
 * configures a provider still gets internal search and manual entry.
 *
 * Nominatim's usage policy requires an identifying User-Agent and rate-limits
 * to roughly one request per second; deployments expecting heavier traffic
 * should point `NOMINATIM_BASE_URL` at their own instance.
 */
export class NominatimLocationProvider implements LocationSearchProvider {
  readonly name = LocationProvider.NOMINATIM;

  constructor(
    private readonly baseUrl: string,
    private readonly userAgent: string,
  ) {}

  async search(
    query: string,
    options: {
      limit: number;
      signal: AbortSignal;
    },
  ): Promise<LocationSuggestion[]> {
    const url = new URL("/search", this.baseUrl);

    url.searchParams.set("q", query);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", String(options.limit));

    const response = await fetch(url, {
      headers: {
        "User-Agent": this.userAgent,
        Accept: "application/json",
      },
      signal: options.signal,
    });

    if (!response.ok) {
      throw new Error(
        `Nominatim responded with ${response.status} ${response.statusText}.`,
      );
    }

    const results = (await response.json()) as NominatimResult[];

    if (!Array.isArray(results)) {
      throw new Error("Nominatim returned an unexpected payload.");
    }

    return results
      .map((result) => this.toSuggestion(result))
      .filter((suggestion): suggestion is LocationSuggestion => suggestion !== null);
  }

  private toSuggestion(result: NominatimResult): LocationSuggestion | null {
    const displayName = result.display_name?.trim();

    if (!displayName) {
      return null;
    }

    const address = result.address ?? {};

    const country = address.country ?? null;

    const state = address.state ?? null;

    const city =
      address.city ?? address.town ?? address.village ?? address.municipality ?? null;

    const providerLocationId =
      result.osm_type && result.osm_id ? `${result.osm_type}/${result.osm_id}` : null;

    return {
      key: providerLocationId ?? displayName,

      displayName,

      precision: VENUE_CLASSES.has(result.class ?? "")
        ? LocationPrecision.VENUE
        : inferPrecision({
            city,
            state,
            country,
          }),

      country,

      countryCode: address.country_code?.toUpperCase() ?? null,

      state,

      // Nominatim reports subdivisions as full ISO codes ("IN-MH"); the
      // subdivision half is what belongs in stateCode.
      stateCode: address["ISO3166-2-lvl4"]?.split("-")[1]?.toUpperCase() ?? null,

      city,

      postalCode: address.postcode ?? null,

      latitude: this.toCoordinate(result.lat),

      longitude: this.toCoordinate(result.lon),

      provider: LocationProvider.NOMINATIM,

      providerLocationId,
    };
  }

  private toCoordinate(value: string | undefined): number | null {
    if (value === undefined) {
      return null;
    }

    const parsed = Number.parseFloat(value);

    return Number.isFinite(parsed) ? parsed : null;
  }
}
