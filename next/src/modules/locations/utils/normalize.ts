import { LocationPrecision, LocationProvider } from "@/generated/prisma";

import type { LocationInput } from "../schemas/location-input";

/**
 * A location input with every field settled — no `undefined`, no empty strings,
 * codes upper-cased, precision decided. This is the only shape the repository
 * accepts, so normalization can never be skipped by accident.
 */
export interface NormalizedLocation {
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
  timezone: string | null;
  provider: LocationProvider;
  providerLocationId: string | null;
}

/**
 * Collapses `undefined` and blank strings to `null`.
 *
 * A location field is either known or it is not; `""` is neither, and letting
 * it through would make "known to be empty" indistinguishable from "unknown"
 * in every downstream filter.
 */
function orNull(value: string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Derives how precise a location is from the fields that are actually present.
 *
 * VENUE is never inferred — a venue is a claim about a specific building that
 * no combination of city/state/country can establish, so only an explicit
 * precision (from a provider or the admin) can set it.
 */
export function inferPrecision(fields: {
  city: string | null;
  state: string | null;
  country: string | null;
}): LocationPrecision {
  if (fields.city) {
    return LocationPrecision.CITY;
  }

  if (fields.state) {
    return LocationPrecision.STATE;
  }

  if (fields.country) {
    return LocationPrecision.COUNTRY;
  }

  return LocationPrecision.UNKNOWN;
}

/**
 * Turns validated admin input into a row-ready location.
 *
 * Coordinates are dropped unless both halves survive normalization, mirroring
 * the schema-level pair check so a repository caller cannot bypass it.
 */
export function normalizeLocationInput(
  input: LocationInput,
): NormalizedLocation {
  const country = orNull(input.country);

  const state = orNull(input.state);

  const city = orNull(input.city);

  const countryCode = orNull(input.countryCode)?.toUpperCase() ?? null;

  const stateCode = orNull(input.stateCode)?.toUpperCase() ?? null;

  const hasCoordinates =
    input.latitude !== null &&
    input.latitude !== undefined &&
    input.longitude !== null &&
    input.longitude !== undefined;

  return {
    displayName: input.displayName.trim(),

    precision:
      input.precision ??
      inferPrecision({
        city,
        state,
        country,
      }),

    country,

    countryCode,

    state,

    stateCode,

    city,

    postalCode: orNull(input.postalCode),

    latitude: hasCoordinates ? input.latitude! : null,

    longitude: hasCoordinates ? input.longitude! : null,

    timezone: orNull(input.timezone),

    provider: input.provider ?? LocationProvider.MANUAL,

    providerLocationId: orNull(input.providerLocationId),
  };
}

/**
 * Builds a "City, State, Country" style label from whatever parts are known.
 *
 * Used when a provider hands back structured fields but no usable label of its
 * own, and by the manual-entry form to preview what the admin is about to save.
 */
export function composeDisplayName(parts: {
  venueName?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
}): string {
  return [parts.venueName, parts.city, parts.state, parts.country]
    .map((part) => orNull(part))
    .filter((part): part is string => part !== null)
    .join(", ");
}
