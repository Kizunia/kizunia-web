/**
 * Search Core - Multi-value filter primitives
 *
 * All of these produce OR-within-group semantics via Prisma `in`, and are
 * AND-composed with other filters by the engine.
 *
 * Every one returns `undefined` for an empty value set, because
 * `{ in: [] }` matches zero rows in Prisma.
 */

import type { FilterDescriptor, FilterUiMeta } from "../types";
import { normalizeList } from "../guards";

/**
 * Multi-select over a scalar enum column.
 *
 * Values are uppercase-normalised (so `?statuses=upcoming` works, which it
 * does not today) and anything outside the enum is dropped rather than
 * failing the request.
 *
 * @example
 * enumMultiFilter<Prisma.CompetitionWhereInput, CompetitionMode>({
 *   key: "modes",
 *   values: Object.values(CompetitionMode),
 *   toWhere: (modes) => ({ mode: { in: modes } }),
 *   ui: { label: "Mode", group: "quick" },
 * })
 */
export function enumMultiFilter<TWhere, TEnum extends string>(config: {
  key: string;
  values: readonly TEnum[];
  toWhere: (values: TEnum[]) => TWhere;
  ui: FilterUiMeta;
}): FilterDescriptor<TWhere, TEnum[]> {
  const allowed = new Set<string>(config.values);

  return {
    key: config.key,

    keys: [config.key],

    kind: "enum-multi",

    decode: (params) => {
      const raw = normalizeList(params[config.key], { case: "upper" });

      if (!raw) {
        return undefined;
      }

      const valid = raw.filter((value): value is TEnum => allowed.has(value));

      return valid.length > 0 ? valid : undefined;
    },

    encode: (values) => ({ [config.key]: values.join(",") }),

    toWhere: config.toWhere,

    ui: config.ui,
  };
}

/**
 * Multi-select matching a related row by slug, e.g. categories or
 * technologies. `some` gives "has at least one of the selected values".
 */
export function relationSlugMultiFilter<TWhere>(config: {
  key: string;
  toWhere: (slugs: string[]) => TWhere;
  ui: FilterUiMeta;
}): FilterDescriptor<TWhere, string[]> {
  return {
    key: config.key,

    keys: [config.key],

    kind: "relation-slug-multi",

    decode: (params) => normalizeList(params[config.key], { case: "lower" }),

    encode: (slugs) => ({ [config.key]: slugs.join(",") }),

    toWhere: config.toWhere,

    ui: config.ui,
  };
}

/**
 * Multi-select matching a related row by enum value, e.g. eligibility
 * types stored as rows rather than a scalar column.
 */
export function enumRelationMultiFilter<TWhere, TEnum extends string>(config: {
  key: string;
  values: readonly TEnum[];
  toWhere: (values: TEnum[]) => TWhere;
  ui: FilterUiMeta;
}): FilterDescriptor<TWhere, TEnum[]> {
  // Decoding is identical to `enumMultiFilter`, and so is the UI: a fixed,
  // known set of options rendered as checkboxes. The only difference is the
  // shape of the clause, which the caller supplies via `toWhere`. `kind` is
  // therefore deliberately left as "enum-multi" — it selects the UI control,
  // and labelling this as a relation filter would render a searchable async
  // picker for what is really a short static list.
  return enumMultiFilter<TWhere, TEnum>(config);
}

/** Multi-select matching a related row by id, e.g. blog authors. */
export function relationIdMultiFilter<TWhere>(config: {
  key: string;
  toWhere: (ids: string[]) => TWhere;
  ui: FilterUiMeta;
}): FilterDescriptor<TWhere, string[]> {
  return {
    key: config.key,

    keys: [config.key],

    kind: "relation-id-multi",

    decode: (params) => normalizeList(params[config.key]),

    encode: (ids) => ({ [config.key]: ids.join(",") }),

    toWhere: config.toWhere,

    ui: config.ui,
  };
}
