/**
 * Competitions - Filter layout (CLIENT-SAFE)
 *
 * =============================================================================
 * What this is for
 * =============================================================================
 *
 * The specs in `./ui.ts` declare where each filter sits by default. This module
 * is the layer above them: deployment-level decisions about what the
 * Competition discovery experience should emphasise, expressed as overrides
 * rather than by editing the specs.
 *
 * Keeping them separate matters because they answer different questions. A
 * spec says what a filter *is* — stable, reviewable, and the same everywhere.
 * A layout says what this product wants people to notice first, which is a
 * product decision that will change as user research comes in, and which will
 * eventually vary per person.
 *
 * =============================================================================
 * The precedence this participates in
 * =============================================================================
 *
 *   spec defaults  →  this module  →  user preferences  →  runtime
 *
 * Only the first two exist today. `resolveCompetitionFilterLayout` already
 * accepts further sources, so the preferences phase adds an argument at the
 * call site rather than a rewrite here.
 */

import {
  resolveFilterLayout,
  type FilterLayoutSource,
  type RawSearchParams,
  type ResolvedFilterLayout,
} from "@/lib/search/client";

import { COMPETITION_FILTER_SPECS } from "./ui";

/**
 * The order the quick bar leads with.
 *
 * Ordered by what a participant decides on first, which is not the same as
 * what the database emphasises. Someone browsing asks, roughly in this order:
 * what is it about, can I still enter, where is it, what does it cost.
 *
 * Deliberately shorter than the full set of quick-eligible filters. A quick
 * bar that contains everything is not a quick bar — anything past the first
 * row is scrolled past rather than scanned, and the promotion is wasted.
 */
const QUICK_BAR_ORDER: readonly string[] = [
  "search",
  "categories",
  "modes",
  "location",
  "statuses",
  "registrationFeeTypes",
];

/**
 * Kizunia's default Competition layout.
 *
 * `technologies` and `difficultyLevels` are demoted out of their spec-declared
 * quick placement — not because they do not matter, but because six controls
 * plus a sort and a sheet trigger is already a full row on a laptop, and a
 * seventh pushes the whole bar onto a second line where nothing is scanned.
 *
 * This is exactly the kind of decision that should be revisited once the user
 * research lands, and exactly why it is three lines here rather than a change
 * to the specs.
 */
export const KIZUNIA_COMPETITION_LAYOUT: FilterLayoutSource = {
  id: "kizunia-default",

  pinned: QUICK_BAR_ORDER,

  overrides: [
    { key: "technologies", group: "advanced", weight: 5 },
    { key: "difficultyLevels", group: "advanced", weight: 6 },
  ],
};

/**
 * Resolves the layout for one render.
 *
 * `params` is required because a filter hidden by layout but currently holding
 * a value is revealed anyway — a restriction the person cannot see is one they
 * cannot undo.
 *
 * @param extraSources further layers, highest precedence last. The seam user
 *        preferences will arrive through.
 */
export function resolveCompetitionFilterLayout(
  params: RawSearchParams,
  extraSources: readonly FilterLayoutSource[] = [],
): ResolvedFilterLayout {
  return resolveFilterLayout(COMPETITION_FILTER_SPECS, params, [
    KIZUNIA_COMPETITION_LAYOUT,
    ...extraSources,
  ]);
}
