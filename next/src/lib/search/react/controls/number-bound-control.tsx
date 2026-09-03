"use client";

/**
 * Search Core (React) - Numeric bound
 *
 * A slider paired with a readout, rather than a number input.
 *
 * A bound like "minimum team size" is chosen by feel from a small range, not
 * typed precisely — and a slider makes both the range and the current position
 * visible, which a bare input does not. The exact value is still shown, so
 * nothing is left to guesswork.
 */

import { Slider } from "@/components/ui/slider";

import type { NumberBoundSpec } from "../../spec";
import type { FilterControlProps } from "./types";

/** Fallback bounds for a spec that declares none. */
const DEFAULT_MIN = 1;
const DEFAULT_MAX = 20;

export function NumberBoundControl({
  spec,
  value,
  onChange,
  disabled,
}: FilterControlProps<NumberBoundSpec>) {
  const min = spec.min ?? DEFAULT_MIN;
  const max = spec.max ?? DEFAULT_MAX;

  const isSet = value !== undefined;

  // An unset filter parks the handle at the minimum, where it reads as
  // "no restriction" rather than as a value that happens to be selected.
  const current = value ?? min;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-muted-foreground">
          {isSet ? (
            <>
              <span className="font-medium tabular-nums text-foreground">
                {current}
              </span>
              {spec.unit ? ` ${spec.unit}` : ""}
            </>
          ) : (
            "Any"
          )}
        </span>

        {isSet && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Clear
          </button>
        )}
      </div>

      <Slider
        value={[current]}
        min={min}
        max={max}
        step={1}
        disabled={disabled}
        aria-label={spec.label}
        onValueChange={([next]) => {
          // Returning the handle to the minimum clears the filter, so the
          // slider can express "no restriction" without a separate control.
          onChange(next === min ? undefined : next);
        }}
      />

      <div className="flex justify-between text-xs tabular-nums text-muted-foreground">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
