/**
 * Search Core - Numeric and date range primitives
 *
 * `dateRangeFilter` is the reason `FilterDescriptor` decodes from a bag of
 * parameters rather than a single value: one filter owns both the `From`
 * and `To` keys, so neither can be handled while forgetting the other.
 */

import type { FilterDescriptor, FilterUiMeta } from "../types";
import { normalizeDate, normalizeInteger } from "../guards";

/** A single-sided numeric bound, e.g. `minTeamSize=4`. */
export function numberBoundFilter<TWhere>(config: {
  key: string;
  toWhere: (value: number) => TWhere;
  ui: FilterUiMeta;
}): FilterDescriptor<TWhere, number> {
  return {
    key: config.key,

    keys: [config.key],

    kind: "number-bound",

    decode: (params) => normalizeInteger(params[config.key]),

    encode: (value) => ({ [config.key]: String(value) }),

    toWhere: config.toWhere,

    ui: config.ui,
  };
}

export interface DateRange {
  readonly from?: Date;
  readonly to?: Date;
}

/**
 * A two-key date range owning `<key>From` and `<key>To`.
 *
 * Emits a clause when at least one bound parses. An inverted range
 * (from > to) is left alone and yields no results, which is logically
 * honest; the UI should prevent constructing one.
 *
 * Values without a timezone are interpreted as UTC by `Date`. For IST users
 * "from 1 Jan" is therefore off by 5h30m — a known issue pending a product
 * decision.
 */
export function dateRangeFilter<TWhere>(config: {
  /** Base name; owns `<key>From` and `<key>To`. */
  key: string;
  toWhere: (range: DateRange) => TWhere;
  ui: FilterUiMeta;
}): FilterDescriptor<TWhere, DateRange> {
  const fromKey = `${config.key}From`;
  const toKey = `${config.key}To`;

  return {
    key: config.key,

    keys: [fromKey, toKey],

    kind: "date-range",

    decode: (params) => {
      const from = normalizeDate(params[fromKey]);
      const to = normalizeDate(params[toKey]);

      if (from === undefined && to === undefined) {
        return undefined;
      }

      return { from, to };
    },

    encode: (range) => ({
      [fromKey]: range.from?.toISOString(),
      [toKey]: range.to?.toISOString(),
    }),

    toWhere: config.toWhere,

    ui: config.ui,
  };
}
