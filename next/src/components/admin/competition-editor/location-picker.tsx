"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, MapPin, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LocationApi } from "@/modules/locations/api/location-api";
import type { LocationSuggestion } from "@/modules/locations";
import type { LocationInputRequestDTO } from "@/modules/competitions/types/competition-location-request.dto";

const SEARCH_DEBOUNCE_MS = 300;

const MIN_QUERY_LENGTH = 2;

/**
 * Strips the transient `key` a suggestion carries for list rendering.
 *
 * What gets saved is a copy of the suggestion's data, never a pointer to the
 * provider's record — that is what lets a competition outlive the provider.
 */
function toLocationInput(suggestion: LocationSuggestion): LocationInputRequestDTO {
  return {
    displayName: suggestion.displayName,
    precision: suggestion.precision,
    country: suggestion.country,
    countryCode: suggestion.countryCode,
    state: suggestion.state,
    stateCode: suggestion.stateCode,
    city: suggestion.city,
    postalCode: suggestion.postalCode,
    latitude: suggestion.latitude,
    longitude: suggestion.longitude,
    provider: suggestion.provider,
    providerLocationId: suggestion.providerLocationId,
  };
}

/**
 * Search-and-select for places, with typed entry always available.
 *
 * The manual option is not a fallback that appears on failure — it is offered
 * unconditionally, so an admin who knows the answer never has to wait for a
 * lookup, and an outage changes nothing about how they work.
 */
export function LocationPicker({
  onSelect,
  disabled,
}: {
  onSelect(location: LocationInputRequestDTO): void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const [query, setQuery] = useState("");

  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);

  const [searching, setSearching] = useState(false);

  const [providerAvailable, setProviderAvailable] = useState(true);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setSearching(false);
      return;
    }

    // Ignores results from a superseded query so a slow response cannot
    // overwrite the list for what the admin is typing now.
    let active = true;

    setSearching(true);

    const timer = setTimeout(async () => {
      try {
        const result = await LocationApi.search(trimmed);

        if (!active) return;

        setSuggestions(result.suggestions);

        setProviderAvailable(result.providerAvailable);
      } catch {
        // Search is an enhancement; a failure here must not block the admin,
        // who can still type the place manually.
        if (!active) return;

        setSuggestions([]);

        setProviderAvailable(false);
      } finally {
        if (active) {
          setSearching(false);
        }
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      active = false;

      clearTimeout(timer);
    };
  }, [query]);

  function select(location: LocationInputRequestDTO) {
    onSelect(location);

    setOpen(false);

    setQuery("");

    setSuggestions([]);
  }

  const trimmedQuery = query.trim();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className="w-full justify-start"
        >
          <Search className="mr-2 h-4 w-4" />
          Search for a location
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-(--radix-popover-trigger-width) min-w-[320px] p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search a city, region, or venue…"
            value={query}
            onValueChange={setQuery}
          />

          <CommandList>
            {searching && (
              <div className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching…
              </div>
            )}

            {!searching && trimmedQuery.length < MIN_QUERY_LENGTH && (
              <CommandEmpty>
                Type at least {MIN_QUERY_LENGTH} characters to search.
              </CommandEmpty>
            )}

            {!searching && suggestions.length > 0 && (
              <CommandGroup heading="Places">
                {suggestions.map((suggestion) => (
                  <CommandItem
                    key={suggestion.key}
                    value={suggestion.key}
                    onSelect={() => select(toLocationInput(suggestion))}
                  >
                    <MapPin className="mr-2 h-4 w-4 shrink-0" />

                    <span className="flex-1 truncate">
                      {suggestion.displayName}
                    </span>

                    <span className="ml-2 text-xs text-muted-foreground">
                      {suggestion.precision.toLowerCase()}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Offered on every search, not just on failure — the admin may
                simply know the place better than the provider does. */}
            {!searching && trimmedQuery.length >= MIN_QUERY_LENGTH && (
              <CommandGroup heading="Manual entry">
                <CommandItem
                  value={`manual:${trimmedQuery}`}
                  onSelect={() =>
                    select({
                      displayName: trimmedQuery,
                    })
                  }
                >
                  <Check className="mr-2 h-4 w-4 shrink-0" />

                  <span className="flex-1 truncate">
                    Use &ldquo;{trimmedQuery}&rdquo; as typed
                  </span>
                </CommandItem>
              </CommandGroup>
            )}

            {!searching && !providerAvailable && (
              <p className="border-t px-3 py-2 text-xs text-muted-foreground">
                Location lookup is unavailable right now. Showing places already
                on Kizunia — you can still add any location manually.
              </p>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
