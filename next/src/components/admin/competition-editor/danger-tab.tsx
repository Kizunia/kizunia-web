"use client";

import { Button } from "@/components/ui/button";
import { useCompetitionEditorStore } from "@/modules/competitions/store/editor-store";

export function DangerTab() {
  const competition = useCompetitionEditorStore(
    (state) => state.competition,
  );

  const deleteCompetition = useCompetitionEditorStore(
    (state) => state.deleteCompetition,
  );

  const deleting = useCompetitionEditorStore(
    (state) => state.deleting,
  );

  if (!competition) {
    return null;
  }

  return (
    <div className="space-y-6">

      <Button
        variant="destructive"
        disabled={deleting}
        onClick={async () => {
          await deleteCompetition();
        }}
      >
        {deleting ? "Deleting..." : "Delete Competition"}
      </Button>

    

    </div>
  );
}