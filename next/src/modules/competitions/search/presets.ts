/**
 * Competitions - Presets (CLIENT-SAFE)
 *
 * =============================================================================
 * The whole platform preset catalogue, as data
 * =============================================================================
 *
 * Three presets today. Adding a fourth, renaming one, reordering them or
 * withdrawing one is an edit to this list and nothing else: the bar renders
 * whatever is enabled here, in `displayOrder`, and the application logic in
 * `@/lib/search/presets` never mentions a preset by name. There is deliberately
 * no `if (preset.id === "in-pune")` anywhere in the codebase, and there should
 * never be one.
 *
 * =============================================================================
 * Why the filters go through `presetFilter`
 * =============================================================================
 *
 * Every value below is encoded by the same `writeFilterValue` the controls use,
 * against the same spec the query layer reads. A preset therefore cannot
 * express something a person could not have clicked, cannot invent a parameter
 * name, and cannot drift when a spec's URL contract changes — the encoding is
 * derived, not transcribed.
 *
 * That is also why there is no preset-specific search logic anywhere. "Online
 * and Free" is `modes=ONLINE&registrationFeeTypes=FREE`, which is exactly what
 * the mode and fee controls produce, and it reaches Prisma through their
 * existing `toWhere` clauses.
 *
 * =============================================================================
 * Where this goes next
 * =============================================================================
 *
 * `PlatformPreset` is already the shape a database row would hold — a stable
 * id, name, description, filters, an order and an enabled flag — so moving
 * this list behind an admin surface means replacing this module's export with
 * a loader. Every consumer takes `readonly PlatformPreset[]`, so none of them
 * changes.
 */

import {
  createCustomPresetStore,
  presetFilter,
  presetFilters,
  type PlatformPreset,
} from "@/lib/search/client";

import { competitionFilterSpecs, RECORD_STATE_SPEC } from "./ui";

/**
 * Pune, as the location provider identifies it.
 *
 * A place filter carries a provider id, not a name — see `PlaceSpec` — so a
 * preset for a city has to name that id. It is the same value the picker would
 * write when someone chooses Pune from the suggestions, and the same one the
 * location fixtures in `scripts/verify-location-identity.ts` use.
 *
 * If this ever needs to be Bengaluru as well, that is another entry in the
 * list below, not a change to anything that reads it.
 */
const PUNE_PLACE_ID = "ChIJARFGZy6_wjsRQ-Oenb9DjYI";

/**
 * "Open to everyone" is an eligibility a competition declares, not a new
 * concept.
 *
 * The registry already has `eligibilities`, whose `OPEN` member means exactly
 * this and whose clause is `eligibilities: { some: { type: { in: [OPEN] } } }`.
 * Introducing a separate "open for all" filter would have created a second way
 * to ask a question the search could already answer, and the two would have
 * disagreed the first time the eligibility rules changed.
 */
const openForAll: PlatformPreset = {
  id: "open-for-all",
  name: "Open for All",
  description:
    "Competitions with no eligibility restrictions — anyone can enter.",
  filters: presetFilters(
    presetFilter(competitionFilterSpecs.eligibilities, ["OPEN"]),
  ),
  displayOrder: 10,
  enabled: true,
  icon: "sparkles",
};

const onlineAndFree: PlatformPreset = {
  id: "online-and-free",
  name: "Online and Free",
  description: "Fully online competitions with no entry fee.",
  filters: presetFilters(
    presetFilter(competitionFilterSpecs.modes, ["ONLINE"]),
    presetFilter(competitionFilterSpecs.registrationFeeTypes, ["FREE"]),
  ),
  displayOrder: 20,
  enabled: true,
  icon: "globe",
};

/**
 * In-person competitions in Pune.
 *
 * `includeOnline` is deliberately false. Online competitions have no location
 * at all, so folding them in would make a preset named after a city return
 * results that have nothing to do with it — and the toggle to widen it is
 * right there in the location control for anyone who wants both.
 */
const inPune: PlatformPreset = {
  id: "in-pune",
  name: "In Pune",
  description: "Competitions happening in and around Pune.",
  filters: presetFilters(
    // No radius, deliberately. "In Pune" means the identity match it has always
    // meant, and adding a distance would silently change what every existing
    // `?preset=platform:in-pune` link returns. A radius-flavoured preset should
    // be a *new* entry, not a redefinition of this one.
    presetFilter(competitionFilterSpecs.location, {
      center: { kind: "place", id: PUNE_PLACE_ID, label: "Pune" },
      includeOnline: false,
    }),
  ),
  displayOrder: 30,
  enabled: true,
  icon: "map-pin",
};

/** Kizunia's platform presets, in declaration order. */
export const COMPETITION_PLATFORM_PRESETS: readonly PlatformPreset[] = [
  openForAll,
  onlineAndFree,
  inPune,
];

/**
 * Where this browser keeps its saved Competition presets.
 *
 * Namespaced by entity so a future Projects listing gets its own collection
 * rather than inheriting these — and so clearing one never disturbs the other.
 */
export const COMPETITION_PRESET_NAMESPACE = "competitions";

/**
 * One store for the whole application.
 *
 * Module-level because the store caches the parsed list and notifies
 * subscribers: two instances would each hold their own snapshot, and a preset
 * saved through one would not appear in a bar rendered by the other. Creating
 * it touches no storage — nothing is read until a component subscribes — so
 * this is safe to import from server-rendered code.
 */
export const competitionPresetStore = createCustomPresetStore(
  COMPETITION_PRESET_NAMESPACE,
);

// =============================================================================
// Admin
// =============================================================================
//
// A second, independent catalogue and store — not a filtered view of the ones
// above. Admin's saved presets must never appear on the public page or vice
// versa, and "Deleted"/"All records" answer a moderation question a visitor
// could never ask, so they have no place in the public list even disabled.
//
// `RECORD_STATE_SPEC` is the only filter `ADMIN_FILTER_SPECS` adds over
// `COMPETITION_FILTER_SPECS` (see `ui.ts`), which is why there are exactly two
// presets here: `recordState=[ACTIVE]` alone is already the default query, so
// a preset reproducing it would be a preset of the unfiltered admin list —
// the same "nothing worth saving" case `hasCapturableFilters` already refuses
// to let a person bookmark.

/**
 * Soft-deleted competitions only.
 *
 * The one-click path to what an admin restores or audits, without them having
 * to know `recordState` exists as a control.
 */
const deletedRecords: PlatformPreset = {
  id: "deleted-records",
  name: "Deleted",
  description: "Soft-deleted competitions only — for review or restoring.",
  filters: presetFilters(presetFilter(RECORD_STATE_SPEC, ["DELETED"])),
  displayOrder: 10,
  enabled: true,
  icon: "bookmark",
};

/**
 * Every competition regardless of deletion state.
 *
 * `deletionClauses` (`search/plan.ts`) applies no restriction only when both
 * values are selected — this is the one way to ask for that.
 */
const allRecords: PlatformPreset = {
  id: "all-records",
  name: "All records",
  description: "Every competition, active and deleted, for a full audit.",
  filters: presetFilters(
    presetFilter(RECORD_STATE_SPEC, ["ACTIVE", "DELETED"]),
  ),
  displayOrder: 20,
  enabled: true,
  icon: "compass",
};

/** Kizunia's admin platform presets, in declaration order. */
export const COMPETITION_ADMIN_PLATFORM_PRESETS: readonly PlatformPreset[] = [
  deletedRecords,
  allRecords,
];

/**
 * Where this browser keeps its saved admin Competition presets.
 *
 * A distinct namespace from `COMPETITION_PRESET_NAMESPACE`, following the same
 * "namespaced by entity" reasoning one level further: this is the same entity
 * but a different surface, and the two collections must never merge. A future
 * maintainer scope follows the same pattern: `"competitions:maintainer"`.
 */
export const COMPETITION_ADMIN_PRESET_NAMESPACE = "competitions:admin";

export const competitionAdminPresetStore = createCustomPresetStore(
  COMPETITION_ADMIN_PRESET_NAMESPACE,
);
