"use client";

/**
 * Search Core (React) - Team size
 *
 * =============================================================================
 * Why one control answers several different questions
 * =============================================================================
 *
 * "Can I enter with the people I have" is never asked the same way twice: one
 * person has an exact number, another has a range they could go either way
 * on, another only knows a ceiling or a floor, and some are not asking about
 * their own team at all but about whether the competition permits solo entry
 * in the first place. Splitting these into separate filters — which is how
 * this used to work — meant a person had to already know which of four
 * controls their situation belonged to before they could even start.
 *
 * This control instead asks the question in the order a person actually
 * answers it: pick the shape of your team size, then pick the number(s), then
 * separately say anything about a competition's own solo policy. Every mode
 * writes into the same two fields (`min`, `max`), so the underlying filter
 * stays one pair of optional bounds — see `TeamSizeSpec` for the mapping.
 */

import { useMemo } from "react";

import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

import type { TeamSizePolicy, TeamSizeSpec, TeamSizeValue } from "../../spec";
import type { FilterControlProps } from "./types";

const DEFAULT_MIN = 1;
const DEFAULT_MAX = 8;

type SizeMode = "exact" | "range" | "atLeast" | "atMost";

const MODE_OPTIONS: readonly { value: SizeMode; label: string }[] = [
  { value: "exact", label: "Exact" },
  { value: "range", label: "Range" },
  { value: "atLeast", label: "At least" },
  { value: "atMost", label: "At most" },
];

/** Which mode a value is currently expressed in, or `null` for no size at all. */
function deriveMode(value: TeamSizeValue | undefined): SizeMode | null {
  if (!value) {
    return null;
  }

  if (value.min !== undefined && value.max !== undefined) {
    return value.min === value.max ? "exact" : "range";
  }

  if (value.min !== undefined) {
    return "atLeast";
  }

  if (value.max !== undefined) {
    return "atMost";
  }

  return null;
}

/** Drops the value entirely once every field it carries is unset. */
function normalizeOrUndefined(
  value: TeamSizeValue,
): TeamSizeValue | undefined {
  return value.min === undefined && value.max === undefined && value.policy === undefined
    ? undefined
    : value;
}

export function TeamSizeControl({
  spec,
  value,
  onChange,
  disabled,
}: FilterControlProps<TeamSizeSpec>) {
  const boundsMin = spec.min ?? DEFAULT_MIN;
  const boundsMax = spec.max ?? DEFAULT_MAX;

  const mode = useMemo(() => deriveMode(value), [value]);

  const unitFor = (count: number) =>
    count === 1 && spec.unitOne ? spec.unitOne : spec.unit;

  const withUnit = (text: string, count: number) => {
    const suffix = unitFor(count);

    return suffix ? `${text} ${suffix}` : text;
  };

  /** Seeds a sensible starting number when switching into a mode cold. */
  const seedSize = (): number => {
    if (value?.min !== undefined) return value.min;
    if (value?.max !== undefined) return value.max;
    return boundsMin;
  };

  const setMode = (next: SizeMode | ""): void => {
    const base: TeamSizeValue = { ...value };

    if (next === "") {
      // Radix reports an empty string when the pressed item is toggled off —
      // the natural "no size preference" gesture, honoured as one.
      onChange(normalizeOrUndefined({ ...base, min: undefined, max: undefined }));
      return;
    }

    const seed = seedSize();

    switch (next) {
      case "exact":
        onChange(normalizeOrUndefined({ ...base, min: seed, max: seed }));
        return;

      case "atLeast":
        onChange(normalizeOrUndefined({ ...base, min: seed, max: undefined }));
        return;

      case "atMost":
        onChange(normalizeOrUndefined({ ...base, min: undefined, max: seed }));
        return;

      case "range": {
        const lo = value?.min ?? seed;
        const hi = Math.max(value?.max ?? Math.min(boundsMax, lo + 2), lo);

        onChange(normalizeOrUndefined({ ...base, min: lo, max: hi }));
        return;
      }
    }
  };

  const setSolo = (): void => {
    onChange(normalizeOrUndefined({ ...value, min: 1, max: 1 }));
  };

  const setPolicy = (next: TeamSizePolicy | ""): void => {
    onChange(
      normalizeOrUndefined({
        ...value,
        policy: next === "" ? undefined : next,
      }),
    );
  };

  const isSolo = value?.min === 1 && value?.max === 1;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            My team size
          </span>

          {/* The one-click path for the single most common answer — going it
              alone — without requiring "Exact" to be picked and then "1". */}
          <button
            type="button"
            disabled={disabled}
            onClick={setSolo}
            className={cn(
              "text-xs underline-offset-2 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isSolo
                ? "font-medium text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Just me (solo)
          </button>
        </div>

        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          disabled={disabled}
          value={mode ?? ""}
          onValueChange={(next) => setMode(next as SizeMode | "")}
          className="flex w-full flex-wrap justify-start gap-1.5"
          aria-label="Team size mode"
        >
          {MODE_OPTIONS.map((option) => (
            <ToggleGroupItem
              key={option.value}
              value={option.value}
              className="flex-none rounded-md"
            >
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        {mode === "exact" && (
          <SizeStepper
            label={withUnit(String(value?.min ?? boundsMin), value?.min ?? boundsMin)}
            value={value?.min ?? boundsMin}
            min={boundsMin}
            max={boundsMax}
            openEndedMax={spec.openEndedMax}
            disabled={disabled}
            onChange={(next) =>
              onChange(normalizeOrUndefined({ ...value, min: next, max: next }))
            }
          />
        )}

        {mode === "atLeast" && (
          <SizeStepper
            label={withUnit(`${value?.min ?? boundsMin}+`, value?.min ?? boundsMin)}
            value={value?.min ?? boundsMin}
            min={boundsMin}
            max={boundsMax}
            openEndedMax={spec.openEndedMax}
            disabled={disabled}
            onChange={(next) =>
              onChange(normalizeOrUndefined({ ...value, min: next, max: undefined }))
            }
          />
        )}

        {mode === "atMost" && (
          <SizeStepper
            label={withUnit(`up to ${value?.max ?? boundsMax}`, value?.max ?? boundsMax)}
            value={value?.max ?? boundsMax}
            min={boundsMin}
            max={boundsMax}
            openEndedMax={false}
            disabled={disabled}
            onChange={(next) =>
              onChange(normalizeOrUndefined({ ...value, min: undefined, max: next }))
            }
          />
        )}

        {mode === "range" && (
          <div className="space-y-2 pt-1">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium tabular-nums text-foreground">
                {value?.min ?? boundsMin}
              </span>
              {" – "}
              <span className="font-medium tabular-nums text-foreground">
                {value?.max ?? boundsMax}
                {spec.openEndedMax && (value?.max ?? boundsMax) === boundsMax
                  ? "+"
                  : ""}
              </span>
              {spec.unit ? ` ${spec.unit}` : ""}
            </p>

            <Slider
              value={[value?.min ?? boundsMin, value?.max ?? boundsMax]}
              min={boundsMin}
              max={boundsMax}
              step={1}
              disabled={disabled}
              aria-label="Team size range"
              onValueChange={([lo, hi]) =>
                onChange(normalizeOrUndefined({ ...value, min: lo, max: hi }))
              }
            />

            <div className="flex justify-between text-xs tabular-nums text-muted-foreground">
              <span>{boundsMin}</span>
              <span>
                {boundsMax}
                {spec.openEndedMax ? "+" : ""}
              </span>
            </div>
          </div>
        )}

        {mode === null && (
          <p className="pt-1 text-sm text-muted-foreground">
            Any team size
          </p>
        )}
      </div>

      <Separator />

      <div className="space-y-2">
        <span className="text-xs font-medium text-muted-foreground">
          What the competition allows
        </span>

        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          disabled={disabled}
          value={value?.policy ?? ""}
          onValueChange={(next) => setPolicy(next as TeamSizePolicy | "")}
          className="flex w-full flex-wrap justify-start gap-1.5"
          aria-label="Solo policy"
        >
          <ToggleGroupItem value="SOLO_ONLY" className="flex-none rounded-md">
            Solo only
          </ToggleGroupItem>

          <ToggleGroupItem value="SOLO_OR_TEAM" className="flex-none rounded-md">
            Solo & team
          </ToggleGroupItem>
        </ToggleGroup>

        <p className="text-xs leading-relaxed text-muted-foreground">
          {value?.policy === "SOLO_ONLY"
            ? "Only competitions that require solo entry — no teams."
            : value?.policy === "SOLO_OR_TEAM"
              ? "Only competitions that let you enter alone or bring a team."
              : "No preference between solo and team competitions."}
        </p>
      </div>
    </div>
  );
}

/**
 * The single-number picker shared by Exact, At least and At most.
 *
 * Steps stay small by design (`spec.max` defaults to 8) — the same reasoning
 * as `NumberBoundControl`: a small, named set of answers is better shown as
 * buttons than dragged for on a slider.
 */
function SizeStepper({
  label,
  value,
  min,
  max,
  openEndedMax,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  openEndedMax?: boolean;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  const steps = max - min + 1;

  return (
    <div className="space-y-2 pt-1">
      <p className="text-sm text-muted-foreground">
        <span className="font-medium tabular-nums text-foreground">{label}</span>
      </p>

      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        disabled={disabled}
        value={String(value)}
        // A stepper always has a value once its mode is chosen, so toggling
        // the active button off would leave the control with nothing to
        // show — re-selecting the same value is a no-op instead of a clear.
        onValueChange={(next) => next !== "" && onChange(Number(next))}
        className="flex w-full flex-wrap justify-start gap-1.5"
        aria-label="Team size value"
      >
        {Array.from({ length: steps }, (_, index) => min + index).map((step) => (
          <ToggleGroupItem
            key={step}
            value={String(step)}
            className="min-w-9 flex-none rounded-md tabular-nums"
          >
            {step}
            {step === max && openEndedMax ? "+" : ""}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
