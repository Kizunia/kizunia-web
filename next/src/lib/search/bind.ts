/**
 * Search Core - Value-type erasure
 *
 * A registry holds filters whose decoded values have different types
 * (string[], Date ranges, numbers). Typing that collection as
 * `FilterDescriptor<TWhere, any>[]` would surrender type safety exactly
 * where it matters.
 *
 * Instead `bindFilter` captures `TValue` inside closures and returns a
 * `BoundFilter<TWhere>` that no longer mentions it — the standard
 * encoding of an existential type in TypeScript. All checking still happens
 * at the declaration site, where `toWhere` is verified against the entity's
 * real Prisma where-input.
 */

import type {
  BoundFilter,
  FilterDescriptor,
  FilterParams,
  RawSearchParams,
} from "./types";

/**
 * Narrows the full parameter bag to only the keys a filter owns, so a
 * filter cannot read (or accidentally depend on) anything else.
 */
function ownedParams(
  params: RawSearchParams,
  keys: readonly string[],
): FilterParams {
  const owned: FilterParams = {};

  for (const key of keys) {
    owned[key] = params[key];
  }

  return owned;
}

export function bindFilter<TWhere, TValue>(
  descriptor: FilterDescriptor<TWhere, TValue>,
): BoundFilter<TWhere> {
  const decode = (params: RawSearchParams): TValue | undefined =>
    descriptor.decode(ownedParams(params, descriptor.keys));

  return {
    key: descriptor.key,

    keys: descriptor.keys,

    kind: descriptor.kind,

    ui: descriptor.ui,

    toWhereFromParams: (params) => {
      const value = decode(params);

      // `undefined` means absent, empty or unusable. Guarding here is what
      // keeps `{ in: [] }` / `{ OR: [] }` — which match zero rows — from
      // ever being constructed.
      if (value === undefined) {
        return undefined;
      }

      return descriptor.toWhere(value);
    },

    normalize: (params) => {
      const value = decode(params);

      if (value === undefined) {
        // Drop every key this filter owns from the canonical URL.
        return Object.fromEntries(
          descriptor.keys.map((key) => [key, undefined]),
        );
      }

      return descriptor.encode(value);
    },

    isActive: (params) => decode(params) !== undefined,
  };
}
