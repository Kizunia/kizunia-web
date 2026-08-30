/**
 * Search Core - Free-text filter primitives
 *
 * All values are LIKE-escaped. Prisma does not escape `%` or `_`, so
 * without this a search for "50%" matches every row.
 */

import type { FilterDescriptor, FilterUiMeta } from "../types";
import {
  escapeLikeWildcards,
  normalizeList,
  normalizeText,
} from "../guards";

/** Case-insensitive `contains` against a single column. */
export function textContainsFilter<TWhere>(config: {
  key: string;
  toWhere: (value: string) => TWhere;
  ui: FilterUiMeta;
}): FilterDescriptor<TWhere, string> {
  return {
    key: config.key,

    keys: [config.key],

    kind: "text",

    decode: (params) => normalizeText(params[config.key]),

    encode: (value) => ({ [config.key]: value }),

    // Escaping happens here rather than in decode, so the canonical URL
    // keeps the user's literal input.
    toWhere: (value) => config.toWhere(escapeLikeWildcards(value)),

    ui: config.ui,
  };
}

/**
 * Case-insensitive `contains` across several columns, OR-ed together.
 * This is the seam to swap for Postgres full-text search later.
 */
export function multiFieldTextFilter<TWhere>(config: {
  key: string;
  toWhere: (value: string) => TWhere;
  ui: FilterUiMeta;
}): FilterDescriptor<TWhere, string> {
  // Decoding, escaping and UI are identical to `textContainsFilter`; the
  // caller's `toWhere` is what spans several columns. Kept as a distinct,
  // named export because this is the documented swap point for Postgres
  // full-text search, and grepping for it should find every call site.
  return textContainsFilter(config);
}

/**
 * Multi-value free text, OR-ed as a set of `contains` predicates — used
 * where `in` cannot apply because the match is a substring (organizers).
 *
 * Never emits an empty `OR`, which would match zero rows.
 *
 * Note: values are comma-separated, so a value legitimately containing a
 * comma ("Acme, Inc") splits into two tokens. Documented limitation.
 */
export function textContainsAnyFilter<TWhere>(config: {
  key: string;
  toWhere: (values: string[]) => TWhere;
  ui: FilterUiMeta;
}): FilterDescriptor<TWhere, string[]> {
  return {
    key: config.key,

    keys: [config.key],

    kind: "text",

    decode: (params) => normalizeList(params[config.key]),

    encode: (values) => ({ [config.key]: values.join(",") }),

    toWhere: (values) => config.toWhere(values.map(escapeLikeWildcards)),

    ui: config.ui,
  };
}
