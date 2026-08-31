"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, MapPin, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/http";
import { CompetitionLocationApi } from "@/modules/competitions/api/competition-location-api";
import { useCompetitionEditorStore } from "@/modules/competitions/store/editor-store";
import type { CompetitionLocationDTO } from "@/modules/competitions/types/competition-location.dto";
import type { LocationInputRequestDTO } from "@/modules/competitions/types/competition-location-request.dto";

import { LocationPicker } from "./location-picker";

/**
 * Trims a datetime-local value into what the API expects.
 *
 * An empty input means "clear this date", which is `null` — not `undefined`,
 * which a PATCH would read as "leave it alone".
 */
function toIsoOrNull(value: string): string | null {
  return value ? new Date(value).toISOString() : null;
}

/** Formats an ISO date for a `datetime-local` input, which rejects the `Z`. */
function toDateTimeLocal(value: string | null): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  const offsetMs = date.getTimezoneOffset() * 60_000;

  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function LocationsTab() {
  const competition = useCompetitionEditorStore((state) => state.competition);

  const setLocations = useCompetitionEditorStore((state) => state.setLocations);

  const [busy, setBusy] = useState(false);

  if (!competition) {
    return null;
  }

  const locations = competition.locations;

  /**
   * Every mutation returns the full server-ordered list, so the store is
   * replaced wholesale rather than patched — the client never has to guess how
   * the server assigned `order`.
   */
  async function run(
    action: () => Promise<CompetitionLocationDTO[]>,
    successMessage: string,
  ) {
    try {
      setBusy(true);

      setLocations(await action());

      toast.success(successMessage);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Unexpected error");
      }
    } finally {
      setBusy(false);
    }
  }

  function add(location: LocationInputRequestDTO) {
    void run(
      () => CompetitionLocationApi.add(competition!.id, { location }),
      "Location added.",
    );
  }

  function remove(competitionLocationId: string) {
    void run(
      () => CompetitionLocationApi.remove(competition!.id, competitionLocationId),
      "Location removed.",
    );
  }

  function patch(
    competitionLocationId: string,
    body: Parameters<typeof CompetitionLocationApi.update>[2],
  ) {
    void run(
      () =>
        CompetitionLocationApi.update(
          competition!.id,
          competitionLocationId,
          body,
        ),
      "Location updated.",
    );
  }

  /**
   * Moves one location and sends the resulting order of the whole list, which
   * is what the reorder endpoint requires — a partial list would leave the
   * others at stale positions.
   */
  function move(index: number, direction: -1 | 1) {
    const target = index + direction;

    if (target < 0 || target >= locations.length) {
      return;
    }

    const ids = locations.map((location) => location.id);

    [ids[index], ids[target]] = [ids[target], ids[index]];

    void run(
      () => CompetitionLocationApi.reorder(competition!.id, { ids }),
      "Locations reordered.",
    );
  }

  return (
    <div className="grid gap-6 pt-6">
      <div className="space-y-2">
        <Label>Add a location</Label>

        <LocationPicker onSelect={add} disabled={busy} />

        <p className="text-xs text-muted-foreground">
          A competition can have any number of locations — or none, if the venue
          has not been announced. Whether it runs online or in person is set by
          Mode, not here.
        </p>
      </div>

      {locations.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          <MapPin className="mx-auto mb-2 h-6 w-6" />
          No locations yet.
        </div>
      ) : (
        <div className="space-y-4">
          {locations.map((competitionLocation, index) => (
            <div
              key={competitionLocation.id}
              className="space-y-4 rounded-lg border p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {competitionLocation.location.displayName}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {competitionLocation.location.precision.toLowerCase()}
                    {competitionLocation.location.provider === "MANUAL"
                      ? " · entered manually"
                      : ""}
                  </p>
                </div>

                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={busy || index === 0}
                    onClick={() => move(index, -1)}
                    aria-label="Move location up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={busy || index === locations.length - 1}
                    onClick={() => move(index, 1)}
                    aria-label="Move location down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={busy}
                    onClick={() => remove(competitionLocation.id)}
                    aria-label="Remove location"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`label-${competitionLocation.id}`}>
                    Label
                  </Label>

                  <Input
                    id={`label-${competitionLocation.id}`}
                    defaultValue={competitionLocation.label ?? ""}
                    placeholder="Qualifier, Final, Opening Ceremony…"
                    disabled={busy}
                    onBlur={(event) =>
                      patch(competitionLocation.id, {
                        label: event.target.value.trim() || null,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`venue-${competitionLocation.id}`}>
                    Venue
                  </Label>

                  <Input
                    id={`venue-${competitionLocation.id}`}
                    defaultValue={competitionLocation.venueName ?? ""}
                    placeholder="MIT-WPU Auditorium"
                    disabled={busy}
                    onBlur={(event) =>
                      patch(competitionLocation.id, {
                        venueName: event.target.value.trim() || null,
                      })
                    }
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor={`address-${competitionLocation.id}`}>
                    Address
                  </Label>

                  <Input
                    id={`address-${competitionLocation.id}`}
                    defaultValue={competitionLocation.address ?? ""}
                    placeholder="Kothrud Campus, Survey No. 124"
                    disabled={busy}
                    onBlur={(event) =>
                      patch(competitionLocation.id, {
                        address: event.target.value.trim() || null,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`start-${competitionLocation.id}`}>
                    Starts
                  </Label>

                  <Input
                    id={`start-${competitionLocation.id}`}
                    type="datetime-local"
                    defaultValue={toDateTimeLocal(competitionLocation.startDate)}
                    disabled={busy}
                    onBlur={(event) =>
                      patch(competitionLocation.id, {
                        startDate: toIsoOrNull(event.target.value),
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`end-${competitionLocation.id}`}>Ends</Label>

                  <Input
                    id={`end-${competitionLocation.id}`}
                    type="datetime-local"
                    defaultValue={toDateTimeLocal(competitionLocation.endDate)}
                    disabled={busy}
                    onBlur={(event) =>
                      patch(competitionLocation.id, {
                        endDate: toIsoOrNull(event.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
