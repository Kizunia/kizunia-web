"use client";

import { ForwardRefEditor } from "@/components/shared/mdx/ForwardRefEditor";
import { useCompetitionEditorStore } from "@/modules/hackathons/store/editor-store";

export function DocumentationTab() {
  const competition = useCompetitionEditorStore(
    (state) => state.competition,
  );

  const updateCompetition = useCompetitionEditorStore(
    (state) => state.updateCompetition,
  );

  if (!competition) {
    return null;
  }

  return (
    <div className="pt-6">
      <ForwardRefEditor
        markdown={competition.content ?? "No documentation yet."}
        onChange={(markdown) =>
          updateCompetition({
            content: markdown,
          })
        }
        className="min-h-[800px] rounded-lg border"
      />
    </div>
  );
}