"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { useProjectStore } from "../../../store/project.store";
import { useProjectContentStore } from "../../../store/project-content.store";

interface ProjectContentEditorProps {
  projectId: string;
}

export function ProjectContentEditor({
  projectId,
}: ProjectContentEditorProps) {
  const project = useProjectStore((state) => state.project);

  const content = useProjectContentStore(
    (state) => state.content,
  );

  const isSaving = useProjectContentStore(
    (state) => state.isSaving,
  );

  const error = useProjectContentStore(
    (state) => state.error,
  );

  const initialize = useProjectContentStore(
    (state) => state.initialize,
  );

  const setContent = useProjectContentStore(
    (state) => state.setContent,
  );

  const updateContent = useProjectContentStore(
    (state) => state.updateContent,
  );

  useEffect(() => {
    if (project) {
      initialize(project);
    }
  }, [project, initialize]);

  if (!project) {
    return null;
  }

  return (
    <section className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold">
          Content
        </h2>

        <p className="text-sm text-muted-foreground">
          Write and manage the detailed content for your
          project.
        </p>
      </div>

      <Textarea
        value={content}
        onChange={(event) =>
          setContent(event.target.value)
        }
        rows={20}
        placeholder="Write your project content..."
      />

      {error && (
        <p className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <Button
          disabled={isSaving}
          onClick={() =>
            void updateContent({
              id: projectId,
            })
          }
        >
          {isSaving ? "Saving..." : "Save content"}
        </Button>
      </div>
    </section>
  );
}