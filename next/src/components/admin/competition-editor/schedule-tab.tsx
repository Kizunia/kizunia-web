"use client";

/**
 * Admin Competition Editor - Schedule tab
 *
 * Every field here is a lifecycle date or the automation flag. Saving from
 * this tab goes through the same `PATCH /admin/competitions/[id]` every
 * other tab uses (via `useCompetitionEditorStore.save`) — the backend
 * decides whether these edits should move `status`, and this tab only ever
 * displays what the backend last returned; it never computes a status
 * itself. See `CompetitionService.update` for the reconciliation this
 * triggers, and `CompetitionEditorStore.save` for how the response is
 * adopted so a recalculated status appears here without a page refresh.
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useCompetitionEditorStore } from "@/modules/competitions/store/editor-store";
import { StatusBadge } from "@/modules/competitions/components/status-badge";
import { toDateTimeLocal, toIsoOrNull } from "./datetime-field";

function formatUpdatedAt(iso: string | null): string {
  if (!iso) return "Never";

  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ScheduleTab() {
  const competition = useCompetitionEditorStore((state) => state.competition);
  const updateCompetition = useCompetitionEditorStore(
    (state) => state.updateCompetition,
  );

  if (!competition) {
    return null;
  }

  return (
    <div className="grid gap-6 pt-6">
      <div className="rounded-md border bg-muted/30 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Label>Current status</Label>
            <div className="mt-1.5 flex items-center gap-2">
              <StatusBadge status={competition.status} />
              <span className="text-xs text-muted-foreground">
                Last changed {formatUpdatedAt(competition.statusUpdatedAt)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <Label htmlFor="automation-toggle">
                Automatic status updates
              </Label>
              <p className="text-xs text-muted-foreground">
                {competition.automaticStatusUpdatesDisabled
                  ? "Off — status changes below and the nightly sweep are both ignored. The manual status dropdown still works."
                  : "On — status is derived from the dates below and updates automatically."}
              </p>
            </div>
            <Switch
              id="automation-toggle"
              checked={!competition.automaticStatusUpdatesDisabled}
              onCheckedChange={(checked) =>
                updateCompetition({
                  automaticStatusUpdatesDisabled: !checked,
                })
              }
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="registrationStartDate">Registration opens</Label>
          <Input
            id="registrationStartDate"
            type="datetime-local"
            defaultValue={toDateTimeLocal(competition.registrationStartDate)}
            onBlur={(event) =>
              updateCompetition({
                registrationStartDate: toIsoOrNull(event.target.value),
              })
            }
          />
          <p className="text-xs text-muted-foreground">
            Leave blank if registration opening is not automated —
            it will not become REGISTRATION_OPEN on its own.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="registrationDeadline">Registration deadline</Label>
          <Input
            id="registrationDeadline"
            type="datetime-local"
            defaultValue={toDateTimeLocal(competition.registrationDeadline)}
            onBlur={(event) =>
              updateCompetition({
                registrationDeadline: toIsoOrNull(event.target.value),
              })
            }
          />
          <p className="text-xs text-muted-foreground">
            Can be after the start date — registration then stays open while
            the competition is already ONGOING.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="startDate">Starts</Label>
          <Input
            id="startDate"
            type="datetime-local"
            defaultValue={toDateTimeLocal(competition.startDate)}
            onBlur={(event) =>
              updateCompetition({
                startDate: toIsoOrNull(event.target.value),
              })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">Ends</Label>
          <Input
            id="endDate"
            type="datetime-local"
            defaultValue={toDateTimeLocal(competition.endDate)}
            onBlur={(event) =>
              updateCompetition({
                endDate: toIsoOrNull(event.target.value),
              })
            }
          />
        </div>
      </div>
    </div>
  );
}
