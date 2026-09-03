"use client";

/**
 * Search Core (React) - Place selection
 *
 * =============================================================================
 * Why the provider decides what is selectable
 * =============================================================================
 *
 * Suggestions come from the provider, not from places the platform already
 * stores. Offering only stored places would mean a person could not search for
 * a town until something had already been recorded there — and the answer
 * "nothing here yet" would be indistinguishable from "you may not ask".
 *
 * Choosing a place that turns out to have nothing is a legitimate, honest
 * search that returns nothing. That distinction is preserved all the way down
 * to the query, and it starts here.
 *
 * =============================================================================
 * The endpoint contract
 * =============================================================================
 *
 * Any entity using a `place` filter must serve `spec.suggestEndpoint` with:
 *
 *   GET ?q=<query>  →  { data: { suggestions: PlaceSuggestionResponse[],
 *                                providerAvailable: boolean } }
 *
 * `providerAvailable: false` means "suggest nothing", not "error". A lookup
 * service being down must never break browsing — the rest of the filters keep
 * working and the person simply cannot pick a new place this minute.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckIcon, Loader2Icon, MapPinIcon, XIcon } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import type { PlaceSpec } from "../../spec";
import type { FilterControlProps } from "./types";

/** One suggestion, as the endpoint returns it. */
interface PlaceSuggestionResponse {
  readonly providerPlaceId: string;
  readonly primaryText: string;
  readonly secondaryText: string | null;
}

/**
 * Matches the server-side minimum. One character matches most of the world and
 * costs a billed lookup to say so.
 */
const MIN_QUERY_LENGTH = 2;

/** Groups a run of keystrokes into roughly one request. */
const SEARCH_DEBOUNCE_MS = 300;

export function PlaceControl({
  spec,
  value,
  onChange,
  disabled,
}: FilterControlProps<PlaceSpec>) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestionResponse[]>([]);
  const [searching, setSearching] = useState(false);
  const [providerAvailable, setProviderAvailable] = useState(true);

  /**
   * Discards responses that arrive out of order.
   *
   * Without this, a slow request for "pu" landing after a fast one for "pune"
   * would replace the correct suggestions with stale ones — a bug that appears
   * only on a poor connection, which is exactly when it is hardest to notice
   * in development.
   */
  const requestId = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setSearching(false);
      return;
    }

    const id = ++requestId.current;
    const controller = new AbortController();

    setSearching(true);

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `${spec.suggestEndpoint}?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error(`Suggest request failed: ${response.status}`);
        }

        const body: {
          data?: {
            suggestions?: PlaceSuggestionResponse[];
            providerAvailable?: boolean;
          };
        } = await response.json();

        if (id !== requestId.current) {
          return;
        }

        setSuggestions(body.data?.suggestions ?? []);
        setProviderAvailable(body.data?.providerAvailable ?? true);
      } catch {
        if (controller.signal.aborted || id !== requestId.current) {
          return;
        }

        // A failed lookup degrades to "no suggestions". It must not surface as
        // an error: the person can still use every other filter, and an error
        // banner would imply the page is broken when only one control is.
        setSuggestions([]);
        setProviderAvailable(false);
      } finally {
        if (id === requestId.current) {
          setSearching(false);
        }
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, spec.suggestEndpoint]);

  const select = (suggestion: PlaceSuggestionResponse) => {
    onChange({
      id: suggestion.providerPlaceId,
      label: suggestion.primaryText,
      // Carried over rather than reset: a person who asked to include online
      // results and then changed city still wants online results.
      includeOnline: value?.includeOnline ?? false,
    });

    setQuery("");
    setSuggestions([]);
  };

  const setIncludeOnline = (includeOnline: boolean) => {
    // Meaningless without a place, and the value layer would drop it anyway.
    if (!value) {
      return;
    }

    onChange({ ...value, includeOnline });
  };

  const selectedLabel = useMemo(
    () => value?.label ?? (value ? "Selected place" : undefined),
    [value],
  );

  return (
    <div className="space-y-3">
      {value ? (
        <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
          <MapPinIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />

          <span className="flex-1 truncate text-sm font-medium">
            {selectedLabel}
          </span>

          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(undefined)}
            aria-label="Clear location"
            className="rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <XIcon className="size-3.5" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <MapPinIcon
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />

          <Input
            value={query}
            disabled={disabled}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={spec.placeholder ?? "Search for a place"}
            aria-label={spec.label}
            className="pl-9 pr-9"
          />

          {searching && (
            <Loader2Icon
              className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
              aria-hidden
            />
          )}
        </div>
      )}

      {!value && suggestions.length > 0 && (
        <ul className="max-h-56 overflow-y-auto rounded-md border">
          {suggestions.map((suggestion) => (
            <li key={suggestion.providerPlaceId}>
              <button
                type="button"
                onClick={() => select(suggestion)}
                className={cn(
                  "flex w-full items-start gap-2 px-3 py-2 text-left transition-colors",
                  "hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
                )}
              >
                <CheckIcon
                  className="mt-0.5 size-3.5 shrink-0 opacity-0"
                  aria-hidden
                />

                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">
                    {suggestion.primaryText}
                  </span>

                  {suggestion.secondaryText && (
                    <span className="block truncate text-xs text-muted-foreground">
                      {suggestion.secondaryText}
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!value &&
        !providerAvailable &&
        query.trim().length >= MIN_QUERY_LENGTH && (
          <p className="text-xs text-muted-foreground">
            Location search is unavailable right now. Every other filter still
            works.
          </p>
        )}

      {value && (
        <div className="flex items-start justify-between gap-3 border-t pt-3">
          <Label
            htmlFor={`${spec.key}-include-online`}
            className="cursor-pointer text-sm font-normal"
          >
            {spec.includeOnlineLabel}

            <span className="mt-0.5 block text-xs text-muted-foreground">
              Online competitions have no location, so they are excluded unless
              you ask for them.
            </span>
          </Label>

          <Switch
            id={`${spec.key}-include-online`}
            checked={value.includeOnline}
            disabled={disabled}
            onCheckedChange={setIncludeOnline}
          />
        </div>
      )}
    </div>
  );
}
