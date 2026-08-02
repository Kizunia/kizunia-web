"use client";

import { Button } from "@/components/ui/button";
import { useCompetitionEditorStore } from "@/modules/competitions/store/editor-store";

export function SaveBar() {
  const dirty = useCompetitionEditorStore((s) => s.dirty);
  const saving = useCompetitionEditorStore((s) => s.saving);
  const reset = useCompetitionEditorStore((s) => s.reset);
  const save = useCompetitionEditorStore((s) => s.save);

  if (!dirty) {
    return null;
  }

  return (
    <div className="sticky bottom-4 z-50 mt-6">
      <div className="mx-auto flex max-w-5xl items-center justify-between rounded-lg border bg-background p-4 shadow-lg">
        <div>
          <p className="font-medium">Unsaved changes</p>

          <p className="text-sm text-muted-foreground">
            Your changes havent been saved yet.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={reset}
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            onClick={save}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}