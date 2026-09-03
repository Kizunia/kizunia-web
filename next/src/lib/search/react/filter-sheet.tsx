"use client";

/**
 * Search Core (React) - Staged filter sheet
 *
 * =============================================================================
 * Why this surface stages instead of applying instantly
 * =============================================================================
 *
 * The advanced sheet is where several filters are set in one sitting: a date
 * range, a team size, three eligibilities. Applying each edit as it happens
 * would fire a navigation per checkbox, make the list behind the sheet thrash,
 * and leave nothing to cancel if the person changes their mind halfway.
 *
 * So edits accumulate in a buffer and commit as one patch — one navigation,
 * one history entry, one undo.
 *
 * =============================================================================
 * Mobile is the same component
 * =============================================================================
 *
 * The sheet is full-width below the small breakpoint and a side panel above
 * it. Building a separate mobile drawer would mean two implementations of the
 * same staged-edit logic, and the second one would be the one that fell behind.
 */

import { useState } from "react";
import { SlidersHorizontalIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import type { ResolvedFilter } from "../layout";
import type { FilterSpec } from "../spec";
import { activeFilterCount, clearAllFiltersPatch } from "../spec-values";
import type { ParamPatch } from "../params";
import type { RawSearchParams } from "../types";
import { AdvancedFilterPanel } from "./advanced-filter-panel";
import type { FilterCountsMap, FilterOptionsMap } from "./types";
import { useStagedParams } from "./use-staged-params";

export interface FilterSheetProps {
  /** Sections to render, in resolved layout order. */
  readonly filters: readonly ResolvedFilter[];

  /**
   * Specs a Clear all inside this sheet should clear.
   *
   * Usually every registered filter, not just this sheet's sections — someone
   * pressing "Clear all" means all of it, including the quick bar behind them.
   */
  readonly clearableSpecs: readonly FilterSpec[];

  readonly params: RawSearchParams;

  readonly onApply: (patch: ParamPatch) => void;

  readonly optionsMap?: FilterOptionsMap;

  readonly countsMap?: FilterCountsMap;

  readonly triggerLabel?: string;

  readonly disabled?: boolean;

  readonly className?: string;
}

export function FilterSheet({
  filters,
  clearableSpecs,
  params,
  onApply,
  optionsMap,
  countsMap,
  triggerLabel = "All filters",
  disabled,
  className,
}: FilterSheetProps) {
  const [open, setOpen] = useState(false);

  const staged = useStagedParams(params, open);

  // Counted across the sheet's own sections, so the badge reflects what is set
  // in here rather than the total for the page — the quick bar shows its own.
  const activeCount = activeFilterCount(
    filters.map((entry) => entry.spec),
    params,
  );

  const commit = () => {
    onApply(staged.pendingPatch);
    setOpen(false);
  };

  const clearAll = () => {
    // Applied straight away rather than staged. "Clear all" is unambiguous and
    // its own confirmation — requiring Apply after it would read as though the
    // button had not worked.
    onApply(clearAllFiltersPatch(clearableSpecs));
    staged.reset();
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className={cn("h-9 gap-1.5 rounded-full", className)}
        >
          <SlidersHorizontalIcon className="size-3.5" aria-hidden />
          {triggerLabel}

          {activeCount > 0 && (
            <span className="ml-0.5 inline-flex size-5 items-center justify-center rounded-full bg-primary text-xs font-semibold tabular-nums text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle>Filters</SheetTitle>

          <SheetDescription>
            Changes apply when you press Apply, so you can set several at once.
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5">
          <AdvancedFilterPanel
            filters={filters}
            params={staged.params}
            onChange={staged.stage}
            optionsMap={optionsMap}
            countsMap={countsMap}
            disabled={disabled}
          />
        </div>

        <SheetFooter className="flex-row items-center justify-between gap-3 border-t px-5 py-4">
          <Button
            type="button"
            variant="ghost"
            onClick={clearAll}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={commit}
              disabled={!staged.hasPendingChanges}
            >
              Apply
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
