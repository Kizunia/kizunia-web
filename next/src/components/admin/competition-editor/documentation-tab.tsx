"use client";

import { ForwardRefEditor } from "@/components/shared/mdx/ForwardRefEditor";
import { ForwardRefMdxViewer } from "@/components/shared/mdx/ForwardRefMdxViewer";
import { useCompetitionEditorStore } from "@/modules/competitions/store/editor-store";
import { Suspense } from "react";

export function DocumentationTab() {
  const competition = useCompetitionEditorStore((state) => state.competition);

  const updateCompetition = useCompetitionEditorStore(
    (state) => state.updateCompetition,
  );

  if (!competition) {
    return null;
  }

  return (
    <div className="pt-6 text-foreground">
      <Suspense fallback={null}>
        <div className=" rounded-lg border">
          <ForwardRefEditor
            markdown={competition.content ?? "No documentation yet."}
            onChange={(markdown) =>
              updateCompetition({
                content: markdown,
              })
            }
            className=" "
          />
        </div>
      </Suspense>
    </div>
  );
}
