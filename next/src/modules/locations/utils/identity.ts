import { LocationProvider } from "@/generated/prisma";

/**
 * Collapses a place name to a stable comparison form.
 *
 * Diacritics are stripped so "Puné" and "Pune" do not become two entities over
 * a typing difference. This is intentionally lossy and is only ever used for
 * identity — the display name is always stored verbatim.
 */
export function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Identity for an entity the provider gave a stable id for.
 *
 * This is the strong case, and the reason it is always preferred: Nashik City
 * and Nashik District carry different provider ids, so they separate here
 * without Kizunia having to understand what a district is.
 */
export function providerIdentityKey(
  provider: LocationProvider,
  providerPlaceId: string,
): string {
  return `${provider.toLowerCase()}:place:${providerPlaceId}`;
}

/**
 * Identity for an entity known only from an address component.
 *
 * The provider's raw type is part of the key, not decoration. Without it,
 * `administrative_area_level_2 = "Nashik"` and `locality = "Nashik"` — a
 * district and a city with different boundaries — would collapse into one
 * SearchArea, and a competition in Yeola would start appearing under Nashik City.
 *
 * The parent context keeps same-named places in different regions apart: there
 * are many places called "Indira Nagar".
 */
export function contextualIdentityKey(params: {
  name: string;
  providerKind: string | null;
  parentContext: readonly string[];
}): string {
  const kind = params.providerKind
    ? normalizeName(params.providerKind)
    : "unknown";

  const context = params.parentContext
    .map((part) => normalizeName(part))
    .filter((part) => part.length > 0);

  return ["component", kind, normalizeName(params.name), ...context].join(":");
}

/**
 * Human-readable parent context for pickers, e.g. "Maharashtra, India".
 *
 * Required, not cosmetic: once "Nashik City" and "Nashik District" both exist,
 * a bare display name gives the user no way to pick the one they meant.
 */
export function buildContextLabel(
  parentContext: readonly (string | null | undefined)[],
): string | null {
  const parts = parentContext
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));

  return parts.length > 0 ? parts.join(", ") : null;
}
