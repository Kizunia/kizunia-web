"use client";

import { useEffect } from "react";
import { Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useProjectStore } from "../../../store/project.store";
import { useProjectProfileStore } from "../../../store/project-profile.store";

interface ProjectProfileEditorProps {
  projectId: string;
}

export function ProjectProfileEditor({
  projectId,
}: ProjectProfileEditorProps) {
  const project = useProjectStore((state) => state.project);

  const form = useProjectProfileStore((state) => state.form);
  const isSaving = useProjectProfileStore(
    (state) => state.isSaving,
  );
  const error = useProjectProfileStore(
    (state) => state.error,
  );

  const initialize = useProjectProfileStore(
    (state) => state.initialize,
  );

  const setField = useProjectProfileStore(
    (state) => state.setField,
  );

  const updateProfile = useProjectProfileStore(
    (state) => state.updateProfile,
  );

  useEffect(() => {
    if (!project) {
      return;
    }

    initialize(project);
  }, [project, initialize]);

  if (!project) {
    return (
      <div className="rounded-lg border p-6">
        <p className="text-sm text-muted-foreground">
          Project data is unavailable.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h2 className="text-lg font-semibold">
          Project profile
        </h2>

        <p className="text-sm text-muted-foreground">
          Manage the basic information and publishing settings
          for your project.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Title
          </label>

          <Input
            value={form.title}
            onChange={(event) =>
              setField("title", event.target.value)
            }
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Slug
          </label>

          <Input
            value={form.slug}
            onChange={(event) =>
              setField("slug", event.target.value)
            }
          />

          <p className="text-xs text-muted-foreground">
            Used in the public project URL.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Short description
          </label>

          <Textarea
            value={form.shortDescription}
            onChange={(event) =>
              setField(
                "shortDescription",
                event.target.value,
              )
            }
            rows={4}
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Status
            </label>

            <Select
              value={form.status}
              onValueChange={(value) =>
                setField(
                  "status",
                  value as typeof form.status,
                )
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="DRAFT">
                  Draft
                </SelectItem>

                <SelectItem value="PUBLISHED">
                  Published
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Visibility
            </label>

            <Select
              value={form.visibility}
              onValueChange={(value) =>
                setField(
                  "visibility",
                  value as typeof form.visibility,
                )
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="PUBLIC">
                  Public
                </SelectItem>

                <SelectItem value="UNLISTED">
                  Unlisted
                </SelectItem>

                <SelectItem value="PRIVATE">
                  Private
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
            <p className="text-sm text-destructive">
              {error}
            </p>
          </div>
        )}

        <div className="flex justify-end border-t pt-6">
          <Button
            disabled={isSaving}
            onClick={() =>
              void updateProfile({
                id: projectId,
              })
            }
          >
            <Save />

            {isSaving
              ? "Saving..."
              : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}