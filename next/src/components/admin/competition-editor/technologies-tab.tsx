"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Code2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/http";
import { TechnologyApi } from "@/modules/technologies/api/technology-api";
import type { TechnologyCatalogDTO } from "@/modules/technologies/backend/dto/technology-catalog.dto";
import { CompetitionTechnologyApi } from "@/modules/competitions/api/competition-technology-api";
import { useCompetitionEditorStore } from "@/modules/competitions/store/editor-store";

export function TechnologiesTab() {
  const competition = useCompetitionEditorStore((state) => state.competition);

  const setTechnologies = useCompetitionEditorStore(
    (state) => state.setTechnologies,
  );

  const [catalog, setCatalog] = useState<TechnologyCatalogDTO[]>([]);

  const [selected, setSelected] = useState("");

  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    TechnologyApi.getCatalog()
      .then((items) => {
        if (!cancelled) {
          setCatalog(items);
        }
      })
      .catch(() => {
        if (!cancelled) {
          toast.error("Failed to load the technology catalog.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const technologies = competition?.technologies ?? [];

  const attachedIds = useMemo(
    () => new Set(technologies.map((technology) => technology.id)),
    [technologies],
  );

  const availableOptions = useMemo(
    () => catalog.filter((technology) => !attachedIds.has(technology.id)),
    [catalog, attachedIds],
  );

  if (!competition) {
    return null;
  }

  const canManage = competition.permissions.canManageTechnologies;

  async function run(
    action: () => Promise<Awaited<ReturnType<typeof CompetitionTechnologyApi.attach>>>,
    successMessage: string,
  ) {
    try {
      setBusy(true);

      setTechnologies(await action());

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

  function attach() {
    if (!selected) {
      return;
    }

    void run(
      () => CompetitionTechnologyApi.attach(competition!.id, selected),
      "Technology added.",
    ).then(() => setSelected(""));
  }

  function detach(technologyId: string) {
    void run(
      () => CompetitionTechnologyApi.detach(competition!.id, technologyId),
      "Technology removed.",
    );
  }

  return (
    <div className="grid gap-6 pt-6">
      {canManage && (
        <div className="space-y-2">
          <Label>Add a technology</Label>

          <div className="flex gap-2">
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a technology" />
              </SelectTrigger>

              <SelectContent>
                {availableOptions.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    {catalog.length === 0
                      ? "Loading…"
                      : "No more technologies to add."}
                  </div>
                ) : (
                  availableOptions.map((technology) => (
                    <SelectItem key={technology.id} value={technology.id}>
                      {technology.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant="secondary"
              disabled={busy || !selected}
              onClick={attach}
            >
              Add
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Technologies relevant to this competition — for discovery and
            display, not a requirement contestants must use.
          </p>
        </div>
      )}

      {technologies.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          <Code2 className="mx-auto mb-2 h-6 w-6" />
          No technologies yet.
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {technologies.map((technology) => (
            <div
              key={technology.id}
              className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm"
            >
              {technology.iconAsset ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={technology.iconAsset.secureUrl}
                  alt=""
                  className="h-4 w-4 object-contain"
                />
              ) : null}

              <span>{technology.name}</span>

              {canManage && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => detach(technology.id)}
                  aria-label={`Remove ${technology.name}`}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
