"use client";

/**
 * Competitions - Discovery filter bar
 *
 * =============================================================================
 * How small this file is, is the point
 * =============================================================================
 *
 * This is the entire Competition filter interface. It contains no filter
 * logic, no per-filter branching, and no knowledge of what any individual
 * filter does — it resolves a layout and hands it to generic components.
 *
 * Adding a nineteenth Competition filter means adding a spec in `search/ui.ts`
 * and a `toWhere` in `search/definition.ts`. This file does not change. That
 * was the requirement, and it is worth stating plainly where it is delivered.
 *
 * =============================================================================
 * Instant here, staged in the sheet
 * =============================================================================
 *
 * Quick-bar changes apply immediately: one click is one complete intent, and
 * the results should follow it. The sheet stages, because it is where several
 * filters are set together and each keystroke should not be a navigation.
 *
 * Both write to the URL, which stays the single source of truth for what is
 * applied.
 */

import { useMemo } from "react";

import {
  ActiveFilterChips,
  FilterSheet,
  QuickFilterBar,
  SortSelect,
  useSearchParamsState,
  type FilterOptionsMap,
} from "@/lib/search/react";
import type { ChipContext } from "@/lib/search/client";

import {
  resolveCompetitionFilterLayout,
  type CompetitionFilterScope,
} from "../../search/layout";
import {
  ADMIN_FILTER_SPECS,
  COMPETITION_DEFAULT_SORT,
  COMPETITION_FILTER_SPECS,
  COMPETITION_SORT_OPTIONS,
} from "../../search/ui";

export interface CompetitionFiltersProps {
  /**
   * Options for the relation-backed filters, resolved on the server.
   *
   * Passed down rather than fetched here so the pickers are populated on first
   * paint and the labels are available for chips without a round trip.
   */
  readonly optionsMap: FilterOptionsMap;

  /**
   * Which spec list and layout this render resolves against.
   *
   * `"admin"` adds the Record state filter ahead of everything else and
   * clears against `ADMIN_FILTER_SPECS` so "Clear all" also clears it —
   * `"public"` is exactly this component's behaviour before scope existed.
   */
  readonly scope: CompetitionFilterScope;
}

export function CompetitionFilters({
  optionsMap,
  scope,
}: CompetitionFiltersProps) {
  const { params, apply, isPending } = useSearchParamsState();

  const layout = useMemo(
    () => resolveCompetitionFilterLayout(params, scope),
    [params, scope],
  );

  const clearableSpecs =
    scope === "admin" ? ADMIN_FILTER_SPECS : COMPETITION_FILTER_SPECS;

  /**
   * Lets a chip read "Artificial Intelligence" rather than "ai".
   *
   * Built from the same option data the pickers use, so a chip and its
   * checkbox can never disagree about what a value is called.
   */
  const chipContext = useMemo<ChipContext>(() => {
    const optionLabels: Record<string, Record<string, string>> = {};

    for (const [filterKey, options] of Object.entries(optionsMap)) {
      optionLabels[filterKey] = Object.fromEntries(
        options.map((option) => [option.value, option.label]),
      );
    }

    return { optionLabels };
  }, [optionsMap]);

  return (
    <div className="space-y-3">
      <QuickFilterBar
        filters={layout.quick}
        params={params}
        onApply={apply}
        optionsMap={optionsMap}
        disabled={isPending}
        trailing={
          <>
            <FilterSheet
              filters={layout.advanced}
              // Clears every registered filter, not only the sheet's own
              // sections. Someone pressing "Clear all" from in here means all
              // of it, including the quick bar behind them.
              clearableSpecs={clearableSpecs}
              params={params}
              onApply={apply}
              optionsMap={optionsMap}
              disabled={isPending}
            />

            <SortSelect
              options={COMPETITION_SORT_OPTIONS}
              defaultKey={COMPETITION_DEFAULT_SORT}
              params={params}
              onApply={apply}
              disabled={isPending}
              className="h-9 w-auto rounded-full text-sm"
            />
          </>
        }
      />

      {/*
        Reads every registered spec rather than the resolved layout, so a
        filter hidden by preference still shows a removable chip while it holds
        a value. A restriction with no on-screen representation is one the
        person cannot explain or undo.
      */}
      <ActiveFilterChips
        specs={clearableSpecs}
        params={params}
        onApply={apply}
        chipContext={chipContext}
        disabled={isPending}
      />
    </div>
  );
}
