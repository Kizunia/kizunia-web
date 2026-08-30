/**
 * Search Core - URL helpers
 *
 * Pure functions over `BoundFilter` metadata, safe to run on the client:
 * none of them reach into `toWhereFromParams`, so nothing here forces a
 * Prisma import into a client bundle (see
 * docs/.../02-core-architecture.md §10 on the client/server split).
 *
 * These are the primitives Phase 2's `use-search-params-state` hook and
 * filter components are built on. Written now, alongside the filters they
 * describe, so encode/decode/active-detection can never drift from the
 * server-side schema derivation in `schema.ts`.
 */

import type { BoundFilter, RawSearchParams } from "./types";

/** The subset of `BoundFilter` that has no Prisma-shaped member. */
export type FilterUiDescriptor = Pick<
  BoundFilter<unknown>,
  "key" | "keys" | "kind" | "ui" | "normalize" | "isActive"
>;

export function toUiDescriptor<TWhere>(
  filter: BoundFilter<TWhere>,
): FilterUiDescriptor {
  return {
    key: filter.key,
    keys: filter.keys,
    kind: filter.kind,
    ui: filter.ui,
    normalize: filter.normalize,
    isActive: filter.isActive,
  };
}

/**
 * Merges every filter's canonical parameters into one object, suitable for
 * building a `URLSearchParams`. A key mapped to `undefined` should be
 * omitted by the caller (see `toSearchParamsInit`).
 */
export function canonicalizeParams(
  filters: readonly FilterUiDescriptor[],
  params: RawSearchParams,
): Record<string, string | undefined> {
  const result: Record<string, string | undefined> = {};

  for (const filter of filters) {
    Object.assign(result, filter.normalize(params));
  }

  return result;
}

/** Drops `undefined` entries, producing input `URLSearchParams` accepts. */
export function toSearchParamsInit(
  values: Record<string, string | undefined>,
): Record<string, string> {
  const entries: Record<string, string> = {};

  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) {
      entries[key] = value;
    }
  }

  return entries;
}

export interface ActiveFilter {
  readonly key: string;
  readonly label: string;
  readonly kind: FilterUiDescriptor["kind"];
}

/** Filters currently active, for rendering removable chips. */
export function activeFilters(
  filters: readonly FilterUiDescriptor[],
  params: RawSearchParams,
): ActiveFilter[] {
  return filters
    .filter((filter) => filter.isActive(params))
    .map((filter) => ({
      key: filter.key,
      label: filter.ui.label,
      kind: filter.kind,
    }));
}

/**
 * Params for a full reset: every key owned by every registered filter,
 * mapped to `undefined`. Never strands an unknown/foreign query parameter
 * — clearAll only removes what the registry knows about.
 */
export function clearAllParams(
  filters: readonly FilterUiDescriptor[],
): Record<string, undefined> {
  const result: Record<string, undefined> = {};

  for (const filter of filters) {
    for (const key of filter.keys) {
      result[key] = undefined;
    }
  }

  return result;
}
