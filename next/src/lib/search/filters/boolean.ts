/**
 * Search Core - Boolean filter primitive
 *
 * For flags like "hasCertificate" or "isFeatured". Only "true" is
 * meaningful as a query param; absence and "false" both mean "not filtered"
 * — a boolean filter narrows results when set, it does not let a caller
 * explicitly request `false` (there is no column that would need it in the
 * current entities, and adding that would double the parameter's states
 * for no present use case).
 */

import type { FilterDescriptor, FilterUiMeta } from "../types";
import { normalizeScalar } from "../guards";

export function booleanFilter<TWhere>(config: {
  key: string;
  toWhere: (value: true) => TWhere;
  ui: FilterUiMeta;
}): FilterDescriptor<TWhere, true> {
  return {
    key: config.key,

    keys: [config.key],

    kind: "boolean",

    decode: (params) => {
      const value = normalizeScalar(params[config.key]);

      return value?.toLowerCase() === "true" ? true : undefined;
    },

    encode: () => ({ [config.key]: "true" }),

    toWhere: config.toWhere,

    ui: config.ui,
  };
}
