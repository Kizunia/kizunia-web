/**
 * Search Core - Contracts
 *
 * Entity-agnostic building blocks for search, filtering, sorting and
 * pagination. Nothing in `src/lib/search` may reference a concrete domain
 * (Competition, Project, Blog); modules supply that via a registry.
 *
 * See docs/project/feature-specification/search/07-implementation-design.md
 */

/**
 * Raw query parameters as delivered by Next.js.
 *
 * Repeated parameters (`?modes=ONLINE&modes=HYBRID`) arrive as arrays, so
 * this is deliberately wider than `Record<string, string>`.
 */
export type RawSearchParams = Record<string, string | string[] | undefined>;

/** The subset of parameters a single filter owns. */
export type FilterParams = RawSearchParams;

export type FilterKind =
  | "enum-multi"
  | "relation-slug-multi"
  | "relation-id-multi"
  | "text"
  | "number-bound"
  | "date-range"
  | "boolean";

export interface FilterOption {
  readonly value: string;
  readonly label: string;
}

export interface FilterUiMeta {
  readonly label: string;

  /** Initial placement. May be re-grouped per user later without code changes. */
  readonly group: "quick" | "advanced";

  /** Lower sorts earlier within a group. */
  readonly weight?: number;

  /** Present for enum-backed filters; drives option lists in the UI. */
  readonly options?: readonly FilterOption[];
}

/**
 * Declares one filter for one entity.
 *
 * `decode` must never throw: an unparseable filter contributes no clause
 * rather than failing the whole request.
 *
 * @typeParam TWhere the entity's Prisma where-input
 * @typeParam TValue this filter's decoded value
 */
export interface FilterDescriptor<TWhere, TValue> {
  readonly key: string;

  /**
   * Every URL parameter this filter owns.
   *
   * Usually `[key]`, but range filters own two (`startDateFrom`,
   * `startDateTo`), which is why decoding takes a bag rather than a value.
   */
  readonly keys: readonly string[];

  readonly kind: FilterKind;

  /** Returns undefined when the filter is absent, empty or unusable. */
  readonly decode: (params: FilterParams) => TValue | undefined;

  /** Canonical URL form. A key mapped to undefined is omitted. */
  readonly encode: (value: TValue) => Record<string, string | undefined>;

  /** Only ever invoked with a decoded, non-empty value. */
  readonly toWhere: (value: TValue) => TWhere;

  readonly ui: FilterUiMeta;
}

/**
 * A filter with its value type erased, so registries can hold filters of
 * differing value types without resorting to `any`.
 *
 * `TValue` survives inside the closures created by `bindFilter`, which is
 * where all type checking actually happens.
 */
export interface BoundFilter<TWhere> {
  readonly key: string;

  readonly keys: readonly string[];

  readonly kind: FilterKind;

  readonly ui: FilterUiMeta;

  /** undefined = contributes no clause. */
  readonly toWhereFromParams: (params: RawSearchParams) => TWhere | undefined;

  /** Canonical parameters for this filter, for URL normalisation. */
  readonly normalize: (
    params: RawSearchParams,
  ) => Record<string, string | undefined>;

  readonly isActive: (params: RawSearchParams) => boolean;
}

export interface PaginationInput {
  readonly page: number;
  readonly limit: number;
}

export interface PaginationMeta {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
}

export interface SearchResult<T> {
  readonly items: T[];
  readonly pagination: PaginationMeta;
}
