import { LocationProvider } from "@/generated/prisma";

import type {
  PlaceContainingArea,
  PlaceDetails,
  PlaceProvider,
  PlaceSuggestion,
} from "../types/place";

const DEFAULT_BASE_URL = "https://places.googleapis.com/v1";

/**
 * Fields requested from Place Details.
 *
 * Google bills by field group, so this is deliberately minimal: identity,
 * display, coordinates, and the two containment sources. Adding fields here has
 * a direct cost, and anything not used by extraction should not be listed.
 */
const DETAILS_FIELD_MASK = [
  "id",
  "displayName",
  "formattedAddress",
  "location",
  "types",
  "addressComponents",
  "addressDescriptor",
].join(",");

/**
 * Fields needed to decide whether a descriptor area is a real geographic area.
 *
 * Narrower than the full mask because nothing else about the area is used —
 * it is being classified, not ingested in its own right.
 */
const AREA_FIELD_MASK = [
  "id",
  "displayName",
  "types",
  "location",
  "addressComponents",
].join(",");

/**
 * Provider types that make a place usable as a containing area.
 *
 * Google's address descriptors give a name and a containment relation but no
 * type, and they cite the subject place itself among the areas — VIT appears
 * inside its own descriptor under a second listing with a different place id.
 * That listing resolves to `premise`, so classifying by type rejects it on the
 * principle that a building is not a region, without ever comparing names.
 */
const AREA_TYPES = new Set([
  "neighborhood",
  "sublocality",
  "sublocality_level_1",
  "sublocality_level_2",
  "sublocality_level_3",
  "sublocality_level_4",
  "sublocality_level_5",
  "locality",
  "postal_town",
  "administrative_area_level_1",
  "administrative_area_level_2",
  "administrative_area_level_3",
  "administrative_area_level_4",
  "administrative_area_level_5",
  "country",
]);

/** How many descriptor areas are worth resolving for one place. */
const MAX_DESCRIPTOR_AREAS = 6;

interface GoogleText {
  text?: string;
}

interface GoogleAutocompleteResponse {
  suggestions?: {
    placePrediction?: {
      placeId?: string;
      text?: GoogleText;
      structuredFormat?: {
        mainText?: GoogleText;
        secondaryText?: GoogleText;
      };
    };
  }[];
}

interface GoogleAddressComponent {
  longText?: string;
  shortText?: string;
  types?: string[];
}

interface GoogleDescriptorArea {
  name?: string;
  placeId?: string;
  displayName?: GoogleText;
  containment?: string;
}

interface GooglePlaceDetailsResponse {
  id?: string;
  displayName?: GoogleText;
  formattedAddress?: string;
  types?: string[];
  location?: {
    latitude?: number;
    longitude?: number;
  };
  addressComponents?: GoogleAddressComponent[];
  addressDescriptor?: {
    areas?: GoogleDescriptorArea[];
  };
}

/**
 * Google Places (New) — autocomplete plus place details.
 *
 * Address Descriptors supply the containment evidence this architecture depends
 * on ("VIT Pune is WITHIN Bibwewadi"), but the feature has limited regional
 * availability. Where it is absent the response simply omits it and extraction
 * falls back to address components: fewer discovery paths, none of them wrong.
 */
export class GooglePlaceProvider implements PlaceProvider {
  readonly name = LocationProvider.GOOGLE;

  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string = DEFAULT_BASE_URL,
  ) {}

  async autocomplete(
    query: string,
    options: {
      limit: number;
      signal: AbortSignal;
      sessionToken?: string;
    },
  ): Promise<PlaceSuggestion[]> {
    const response = await fetch(`${this.baseUrl}/places:autocomplete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": this.apiKey,
      },
      body: JSON.stringify({
        input: query,
        ...(options.sessionToken && { sessionToken: options.sessionToken }),
      }),
      signal: options.signal,
    });

    if (!response.ok) {
      throw new Error(
        `Google autocomplete responded with ${response.status} ${response.statusText}.`,
      );
    }

    const body = (await response.json()) as GoogleAutocompleteResponse;

    return (body.suggestions ?? [])
      .map((suggestion) => {
        const prediction = suggestion.placePrediction;

        const placeId = prediction?.placeId;

        const primaryText =
          prediction?.structuredFormat?.mainText?.text ??
          prediction?.text?.text;

        if (!placeId || !primaryText) {
          return null;
        }

        return {
          providerPlaceId: placeId,

          primaryText,

          secondaryText:
            prediction?.structuredFormat?.secondaryText?.text ?? null,
        } satisfies PlaceSuggestion;
      })
      .filter((suggestion): suggestion is PlaceSuggestion => suggestion !== null)
      .slice(0, options.limit);
  }

  async resolve(
    providerPlaceId: string,
    options: {
      signal: AbortSignal;
      sessionToken?: string;
    },
  ): Promise<PlaceDetails> {
    const url = new URL(
      `${this.baseUrl}/places/${encodeURIComponent(providerPlaceId)}`,
    );

    if (options.sessionToken) {
      url.searchParams.set("sessionToken", options.sessionToken);
    }

    const response = await fetch(url, {
      headers: {
        "X-Goog-Api-Key": this.apiKey,
        "X-Goog-FieldMask": DETAILS_FIELD_MASK,
      },
      signal: options.signal,
    });

    if (!response.ok) {
      throw new Error(
        `Google place details responded with ${response.status} ${response.statusText}.`,
      );
    }

    const body = (await response.json()) as GooglePlaceDetailsResponse;

    const id = body.id ?? providerPlaceId;

    const displayName = body.displayName?.text?.trim();

    if (!displayName) {
      throw new Error(`Google returned no display name for place ${id}.`);
    }

    return {
      providerPlaceId: id,

      displayName,

      formattedAddress: body.formattedAddress ?? null,

      types: body.types ?? [],

      latitude: body.location?.latitude ?? null,

      longitude: body.location?.longitude ?? null,

      addressComponents: (body.addressComponents ?? []).map((component) => ({
        longName: component.longText ?? "",
        shortName: component.shortText ?? null,
        types: component.types ?? [],
      })),

      containingAreas: await this.toContainingAreas(body, options.signal),
    };
  }

  /**
   * Turns address descriptors into containment evidence, verifying each one.
   *
   * `containingPlaces` is deliberately not requested: it was confirmed empty
   * for the places this project ingests, so it costs a billed field group and
   * returns nothing usable.
   *
   * Descriptors do carry real value — some neighbourhoods appear only here and
   * never in the address components — but they name an area without saying what
   * kind of thing it is, and Google includes the subject place itself among
   * them. Each candidate is therefore resolved and kept only if it is genuinely
   * a geographic area. A failed lookup drops that one area rather than failing
   * ingestion: a missing discovery path is recoverable, a wrong one is not.
   */
  private async toContainingAreas(
    body: GooglePlaceDetailsResponse,
    signal: AbortSignal,
  ): Promise<PlaceContainingArea[]> {
    const within = (body.addressDescriptor?.areas ?? [])
      .filter((area) => this.toContainment(area.containment) === "WITHIN")
      .filter((area) => Boolean(area.placeId))
      .slice(0, MAX_DESCRIPTOR_AREAS);

    const resolved = await Promise.all(
      within.map((area) => this.classifyArea(area.placeId!, signal)),
    );

    return resolved.filter((area): area is PlaceContainingArea => area !== null);
  }

  /**
   * Resolves one descriptor area and accepts it only if it is an area.
   *
   * Returns `null` for anything that is not — a premise, an establishment, a
   * street address — which is what keeps a venue from being recorded as
   * containing itself. The decision is made on the provider's own type data,
   * never by comparing the area's name to the place's.
   */
  private async classifyArea(
    placeId: string,
    signal: AbortSignal,
  ): Promise<PlaceContainingArea | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/places/${encodeURIComponent(placeId)}`,
        {
          headers: {
            "X-Goog-Api-Key": this.apiKey,
            "X-Goog-FieldMask": AREA_FIELD_MASK,
          },
          signal,
        },
      );

      if (!response.ok) {
        return null;
      }

      const body = (await response.json()) as GooglePlaceDetailsResponse;

      const types = body.types ?? [];

      if (!types.some((type) => AREA_TYPES.has(type))) {
        return null;
      }

      const name = body.displayName?.text?.trim();

      if (!name) {
        return null;
      }

      const components = body.addressComponents ?? [];

      const context = components
        .filter((component) => component.longText !== name)
        .map((component) => component.longText)
        .filter((part): part is string => Boolean(part));

      return {
        providerPlaceId: body.id ?? placeId,

        name,

        types,

        contextLabel: context.length > 0 ? context.join(", ") : null,

        latitude: body.location?.latitude ?? null,

        longitude: body.location?.longitude ?? null,

        containment: "WITHIN",

        source: "ADDRESS_DESCRIPTOR",
      };
    } catch {
      // Aborts and transport errors both land here. Dropping the area keeps
      // ingestion working with fewer discovery paths rather than failing it.
      return null;
    }
  }

  /**
   * Anything not explicitly WITHIN is treated as proximity.
   *
   * An unrecognised or missing containment value must never be read as
   * containment — that would invent a discovery path from missing data.
   */
  private toContainment(value: string | undefined): PlaceContainingArea["containment"] {
    if (value === "WITHIN") {
      return "WITHIN";
    }

    return value === "OUTSKIRTS" ? "OUTSKIRTS" : "NEAR";
  }
}
