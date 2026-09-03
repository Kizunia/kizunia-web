/**
 * Search Core - Filter specifications (CLIENT-SAFE)
 *
 * =============================================================================
 * What this module is
 * =============================================================================
 *
 * The single source of truth for what a filter *is* to a user: its name, the
 * control it renders as, its options, and where it sits in the interface.
 *
 * It contains no Prisma import, no database type and no server-only value, so
 * a `"use client"` component may import it directly. The server registry
 * (`FilterDescriptor`, see `types.ts`) *consumes* these specs rather than
 * declaring a parallel copy of the same metadata.
 *
 * That direction matters. If the server owned the labels and the client owned
 * a duplicate of them, the two would eventually disagree and the UI would
 * offer a filter the query does not apply. Because the dependency points from
 * server to client, there is only one declaration and drift is not merely
 * unlikely — it is unrepresentable.
 *
 * =============================================================================
 * What this module is not
 * =============================================================================
 *
 * Nothing here is entity-specific. Competitions, Projects and Blogs describe
 * their filters with this same vocabulary, and the React controls built on it
 * are shared verbatim between them. A spec that only makes sense for one
 * entity belongs in that entity's own `search/ui.ts`, expressed in terms of
 * the kinds below.
 *
 * See also:
 *   - `spec-values.ts` — reading and writing spec values against a URL
 *   - `layout.ts`      — resolving which filters appear where, per viewer
 *   - `types.ts`       — the server-side descriptor that consumes a spec
 */

// =============================================================================
// Kinds
// =============================================================================

/**
 * Which control a filter renders as, and therefore what shape its decoded
 * value has (see `FilterValueOf`).
 *
 * Adding a kind means adding one control component and one branch each in
 * `readFilterValue` / `writeFilterValue` / `describeFilterChips`. It never
 * means editing a panel, a chip list, or an entity's registry — which is the
 * property that keeps "add a new filter" from becoming a UI rewrite.
 */
export type FilterKind =
  | "enum-multi"
  | "relation-multi"
  | "text"
  | "text-any"
  | "number-bound"
  | "date-range"
  | "boolean"
  | "place";

/**
 * Default placement. A layout resolver may override this per deployment or
 * per user at render time (see `layout.ts`); the spec only states the
 * out-of-the-box position, never the final one.
 */
export type FilterGroup = "quick" | "advanced";

export interface FilterOption<TValue extends string = string> {
  readonly value: TValue;

  readonly label: string;

  /** Secondary text shown beneath the label in wide controls. */
  readonly hint?: string;
}

// =============================================================================
// Common spec fields
// =============================================================================

interface FilterSpecBase {
  /**
   * Stable identifier, unique within an entity's filter set.
   *
   * Also the default URL parameter name for single-parameter kinds. It is
   * *not* automatically the parameter name for multi-parameter kinds — see
   * `filterParams`.
   */
  readonly key: string;

  readonly label: string;

  /**
   * Default group. Advisory: `layout.ts` has the last word.
   */
  readonly group: FilterGroup;

  /**
   * Default ordering weight within a group; lower sorts earlier. Also
   * advisory.
   *
   * Declared in steps of ten so a filter can be inserted between two others
   * without renumbering the rest.
   */
  readonly weight: number;

  /** Explanatory text for the advanced panel and tooltips. */
  readonly description?: string;

  /**
   * Prefix for value chips where the bare value would be ambiguous.
   *
   * "Beginner" reads fine alone; "≥ 4" does not, and needs "Min team".
   */
  readonly chipPrefix?: string;

  /**
   * Overrides the parameters this filter owns.
   *
   * Needed only where a filter's URL contract was fixed before its spec
   * existed and the derived default would break existing links. Prefer the
   * derivation — an override is a compatibility concession, not a style
   * choice.
   */
  readonly params?: readonly string[];
}

// =============================================================================
// Kind-specific specs
// =============================================================================

/**
 * A fixed, known set of values, backed by an enum on the server.
 *
 * Option values are declared here as plain strings rather than derived from
 * the Prisma enum, because deriving them would require importing the enum and
 * that is precisely what this module may not do. The server registry asserts
 * exhaustiveness against the real enum when it consumes the spec, so a member
 * added to the database and forgotten here fails at module load rather than
 * silently vanishing from the UI.
 */
export interface EnumMultiSpec<TValue extends string = string>
  extends FilterSpecBase {
  readonly kind: "enum-multi";

  readonly options: readonly FilterOption<TValue>[];

  /**
   * "pills"    — a row of toggles, for short lists scanned at a glance
   * "checkbox" — a scrollable list, for longer sets
   *
   * Defaults to pills at four options or fewer. Centralised here so the
   * threshold is one number rather than a judgement repeated at every
   * declaration site.
   */
  readonly display?: "pills" | "checkbox";
}

/**
 * A set whose options come from the database rather than an enum —
 * categories, technologies, authors.
 *
 * Options are *supplied to* the control rather than fetched by it, so a
 * server component can resolve them during render and the picker is populated
 * on first paint instead of flashing empty. `optionsEndpoint` exists for the
 * cases that genuinely need a client-side refresh; it is never called during
 * server rendering.
 */
export interface RelationMultiSpec extends FilterSpecBase {
  readonly kind: "relation-multi";

  readonly optionsEndpoint: string;

  readonly searchPlaceholder?: string;

  /**
   * Above this many options the control switches from a plain list to a
   * search-first experience. Taxonomies grow; the control should not have to
   * be swapped out when they do.
   */
  readonly searchThreshold?: number;
}

/** A single free-text value. */
export interface TextSpec extends FilterSpecBase {
  readonly kind: "text";

  readonly placeholder?: string;
}

/** Several free-text values, matched as OR-ed substrings. */
export interface TextAnySpec extends FilterSpecBase {
  readonly kind: "text-any";

  readonly placeholder?: string;
}

/** A one-sided numeric bound. */
export interface NumberBoundSpec extends FilterSpecBase {
  readonly kind: "number-bound";

  readonly min?: number;

  readonly max?: number;

  /** Rendered after the value in chips and controls, e.g. "members". */
  readonly unit?: string;
}

/**
 * A date range owning two parameters.
 *
 * By default it owns `<key>From` and `<key>To`, matching the server-side
 * `dateRangeFilter` contract exactly.
 */
export interface DateRangeSpec extends FilterSpecBase {
  readonly kind: "date-range";

  /** Named shortcuts offered above the calendar, e.g. "Next 30 days". */
  readonly presets?: readonly DateRangePreset[];
}

/**
 * A relative shortcut, resolved against "today" at the moment it is clicked.
 *
 * Stored relatively rather than absolutely so a preset cannot go stale: a
 * saved search using "the next 30 days" should mean the next 30 days whenever
 * it is re-run, not the 30 days after the date it was saved. The *applied*
 * value is always absolute, because the URL must stay unambiguous.
 */
export interface DateRangePreset {
  readonly id: string;

  readonly label: string;

  /** Days from today. `fromDays: 0, toDays: 30` is "the next 30 days". */
  readonly fromDays?: number;

  readonly toDays?: number;
}

/**
 * A flag that narrows results when set.
 *
 * Absence and an explicit "false" both mean unset. There is deliberately no
 * way to request `false`: no current column needs it, and supporting it would
 * double the parameter's states for no use case.
 */
export interface BooleanSpec extends FilterSpecBase {
  readonly kind: "boolean";
}

// -----------------------------------------------------------------------------
// Place
// -----------------------------------------------------------------------------

/**
 * Reserved configuration for radius search.
 *
 * Radius is deliberately NOT implemented. It is declared here because the
 * shape of the eventual feature constrains decisions being made now, and
 * writing it down is cheaper than rediscovering it later:
 *
 *   - Radius is a property of the *selected place*, not a separate filter.
 *     A radius with no centre is meaningless, so it can never be an
 *     independent registry entry.
 *   - It changes the resolution result, not the clause shape: the resolver
 *     would return a wider set of search-area ids, and `toWhere` would be
 *     untouched. That is why `PlaceResolutionResult` is expressed as ids
 *     rather than as a clause.
 *   - It requires coordinates and a spatial predicate, neither of which the
 *     current `SearchArea` matching uses. Adding it is a resolver change plus
 *     a database capability, and touches no UI contract beyond one extra
 *     parameter.
 *
 * When it lands, `radiusParam` joins the owned parameters and `PlaceValue`
 * gains `radiusKm`. Nothing else in this module changes.
 */
export interface PlaceRadiusConfig {
  readonly radiusParam: string;

  readonly defaultKm: number;

  readonly maxKm: number;

  readonly steps: readonly number[];
}

/**
 * A geographic place chosen from a provider's suggestions.
 *
 * Owns its parameters by explicit name rather than by derivation, because its
 * URL contract (`placeId`, `placeLabel`, `includeOnline`) predates this spec
 * layer and existing links must keep working. Naming them individually also
 * removes any guesswork about which parameter carries which meaning.
 *
 * `labelParam` carries a human-readable name purely so chips, the browser
 * title and the back button can render without a provider round trip. It is
 * presentation data and never reaches a query — a hand-edited URL that omits
 * it, or lies in it, changes nothing about which competitions match.
 *
 * `includeOnlineParam` widens the result set to online entries, which by
 * definition have no location and could never satisfy a geographic condition.
 * It belongs to this spec rather than standing alone because an "include
 * online" toggle with no place selected has no meaning.
 */
export interface PlaceSpec extends FilterSpecBase {
  readonly kind: "place";

  /** Provider place id. The only parameter that affects matching. */
  readonly idParam: string;

  /** Display label. Presentation only. */
  readonly labelParam: string;

  /** Whether locationless online entries are included alongside the place. */
  readonly includeOnlineParam: string;

  readonly includeOnlineLabel: string;

  readonly suggestEndpoint: string;

  readonly placeholder?: string;

  /** Reserved. See `PlaceRadiusConfig`. Not read by any current code path. */
  readonly radius?: PlaceRadiusConfig;
}

export type FilterSpec =
  | EnumMultiSpec
  | RelationMultiSpec
  | TextSpec
  | TextAnySpec
  | NumberBoundSpec
  | DateRangeSpec
  | BooleanSpec
  | PlaceSpec;

// =============================================================================
// Value shapes
// =============================================================================

export interface DateRangeValue {
  /**
   * ISO 8601. Kept as a string rather than a `Date` so a value survives the
   * server/client boundary unchanged and round-trips through a URL without a
   * timezone being invented for it along the way.
   */
  readonly from?: string;

  readonly to?: string;
}

export interface PlaceValue {
  readonly id: string;

  /** Presentation only; absent on a hand-edited or truncated URL. */
  readonly label?: string;

  readonly includeOnline: boolean;
}

/**
 * The decoded value type for each kind.
 *
 * This mapping is what lets a control component be type-safe without a cast:
 * once a spec is narrowed to `EnumMultiSpec`, its value is statically known to
 * be `readonly string[]`, and a control that tried to treat it as a `Date`
 * would not compile.
 */
export type FilterValueOf<TKind extends FilterKind> = TKind extends
  | "enum-multi"
  | "relation-multi"
  | "text-any"
  ? readonly string[]
  : TKind extends "text"
    ? string
    : TKind extends "number-bound"
      ? number
      : TKind extends "date-range"
        ? DateRangeValue
        : TKind extends "boolean"
          ? true
          : TKind extends "place"
            ? PlaceValue
            : never;

/** The value type a given spec decodes to. */
export type ValueOfSpec<TSpec extends FilterSpec> = FilterValueOf<TSpec["kind"]>;

/** Any decoded filter value, for code that handles specs generically. */
export type AnyFilterValue = FilterValueOf<FilterKind>;

// =============================================================================
// Parameter ownership
// =============================================================================

/**
 * Every URL parameter a filter owns.
 *
 * Derived from the kind rather than declared per filter, so a date range
 * cannot be given a single key by mistake and a place cannot forget one of
 * its three. `spec.params` overrides the derivation where a pre-existing URL
 * contract requires it.
 *
 * This function is the authority on ownership. Clearing, canonicalising and
 * conflict detection all go through it, so a filter that is added correctly
 * here is automatically handled correctly everywhere else.
 */
export function filterParams(spec: FilterSpec): readonly string[] {
  if (spec.params) {
    return spec.params;
  }

  switch (spec.kind) {
    case "date-range":
      return [`${spec.key}From`, `${spec.key}To`];

    case "place":
      return spec.radius
        ? [
            spec.idParam,
            spec.labelParam,
            spec.includeOnlineParam,
            spec.radius.radiusParam,
          ]
        : [spec.idParam, spec.labelParam, spec.includeOnlineParam];

    default:
      return [spec.key];
  }
}

/**
 * Every parameter owned by any of `specs`, deduplicated and in declaration
 * order.
 */
export function allFilterParams(
  specs: readonly FilterSpec[],
): readonly string[] {
  const seen = new Set<string>();

  for (const spec of specs) {
    for (const param of filterParams(spec)) {
      seen.add(param);
    }
  }

  return [...seen];
}

/**
 * Asserts that no two specs claim the same URL parameter.
 *
 * Called once when an entity's spec list is declared, so a collision is a
 * module-load failure during development rather than one filter silently
 * overwriting another's value in production.
 */
export class DuplicateFilterParamError extends Error {
  constructor(param: string, first: string, second: string) {
    super(
      `Filters "${first}" and "${second}" both claim URL parameter "${param}".`,
    );

    this.name = "DuplicateFilterParamError";
  }
}

export function assertUniqueFilterParams(
  specs: readonly FilterSpec[],
): readonly FilterSpec[] {
  const owner = new Map<string, string>();

  for (const spec of specs) {
    for (const param of filterParams(spec)) {
      const existing = owner.get(param);

      if (existing !== undefined) {
        throw new DuplicateFilterParamError(param, existing, spec.key);
      }

      owner.set(param, spec.key);
    }
  }

  return specs;
}

// =============================================================================
// Presentation helpers
// =============================================================================

/** Whether an enum filter should render as pills rather than a checkbox list. */
export function usesPillDisplay(spec: EnumMultiSpec): boolean {
  return spec.display ? spec.display === "pills" : spec.options.length <= 4;
}

/** Whether a relation filter's option list warrants a search box. */
export function usesOptionSearch(
  spec: RelationMultiSpec,
  optionCount: number,
): boolean {
  return optionCount > (spec.searchThreshold ?? 8);
}

/** Looks up an option's label, falling back to the raw value. */
export function optionLabel(
  options: readonly FilterOption[],
  value: string,
): string {
  return options.find((option) => option.value === value)?.label ?? value;
}
