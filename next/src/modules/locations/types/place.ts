import type {
  LocationProvider,
  SearchAreaRelation,
  SearchAreaSource,
} from "@/generated/prisma";

/**
 * One option in the admin's place picker.
 *
 * Carries no geographic data of its own — only enough text to choose, plus the
 * provider id needed to resolve the full record. Suggestions are transient and
 * must never be persisted; picking one triggers a `resolve()` call, and it is
 * that result which becomes a Location.
 */
export interface PlaceSuggestion {
  providerPlaceId: string;

  /** The place itself, e.g. "Vishwakarma Institute of Technology". */
  primaryText: string;

  /** Disambiguating context, e.g. "Bibwewadi, Pune, Maharashtra, India". */
  secondaryText: string | null;
}

/**
 * A structured piece of an address, with the provider's own type strings kept
 * verbatim.
 *
 * Types are not normalized into a Kizunia vocabulary: `administrative_area_level_2`
 * means a district in one country and a county in another, and flattening that
 * distinction is exactly how "Nashik District" would get confused with
 * "Nashik City".
 */
export interface PlaceAddressComponent {
  longName: string;

  shortName: string | null;

  types: string[];
}

/**
 * A larger entity the provider says this place sits inside.
 *
 * `containment` is reported rather than assumed. Only `WITHIN` is usable
 * evidence of containment — `NEAR` and `OUTSKIRTS` describe proximity, which is
 * radius search's concern and must never become a discovery relationship.
 *
 * `types` is populated by resolving the area, not by trusting the parent's
 * payload. Google's address descriptors name the area but not what kind of
 * thing it is, and they routinely cite the subject place itself as a landmark —
 * under a separate listing with its own place id — so without the resolved
 * types a venue ends up recorded as containing itself.
 */
export interface PlaceContainingArea {
  /** Present for containing places and address descriptors; absent for bare
   * address components, which is why those rank lowest as an identity source. */
  providerPlaceId: string | null;

  name: string;

  /** The area's own provider types, resolved rather than assumed. */
  types: string[];

  /** Parent context for display, e.g. "Pune, Maharashtra, India". */
  contextLabel: string | null;

  latitude: number | null;

  longitude: number | null;

  containment: "WITHIN" | "OUTSKIRTS" | "NEAR";

  source: Extract<
    SearchAreaSource,
    "CONTAINING_PLACE" | "ADDRESS_DESCRIPTOR"
  >;
}

/**
 * A fully resolved place — everything ingestion needs, in provider-neutral form.
 *
 * Once this has been normalized into a Location and its SearchAreas, the
 * competition no longer depends on the provider in any way.
 */
export interface PlaceDetails {
  providerPlaceId: string;

  displayName: string;

  formattedAddress: string | null;

  /** The provider's own type strings for the place itself. */
  types: string[];

  latitude: number | null;

  longitude: number | null;

  addressComponents: PlaceAddressComponent[];

  containingAreas: PlaceContainingArea[];
}

/**
 * A SearchArea that extraction believes should exist, before anything is
 * persisted or deduplicated against the database.
 */
export interface SearchAreaCandidate {
  /** Deterministic identity — see `utils/identity.ts`. */
  identityKey: string;

  displayName: string;

  providerKind: string | null;

  contextLabel: string | null;

  provider: LocationProvider | null;

  providerLocationId: string | null;

  latitude: number | null;

  longitude: number | null;

  relation: SearchAreaRelation;

  source: SearchAreaSource;
}

/**
 * A source of place resolution.
 *
 * Two steps rather than one: autocomplete is cheap and runs per keystroke,
 * while `resolve` is the expensive call made once, after the admin has actually
 * chosen. Collapsing them into a single `search()` would either bill a full
 * details lookup for every keystroke or leave ingestion without the containment
 * data it depends on.
 */
export interface PlaceProvider {
  readonly name: LocationProvider;

  autocomplete(
    query: string,
    options: {
      limit: number;
      signal: AbortSignal;
      /** Groups keystrokes into one billed session where the provider supports it. */
      sessionToken?: string;
    },
  ): Promise<PlaceSuggestion[]>;

  resolve(
    providerPlaceId: string,
    options: {
      signal: AbortSignal;
      sessionToken?: string;
    },
  ): Promise<PlaceDetails>;
}
