"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCompetitionEditorStore } from "@/modules/hackathons/store/editor-store";


export function GeneralTab() {
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
    <div className="grid gap-6 pt-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>

        <Input
          id="title"
          value={competition.title}
          onChange={(e) =>
            updateCompetition({
              title: e.target.value,
            })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>

        <Input
          id="slug"
          value={competition.slug}
          onChange={(e) =>
            updateCompetition({
              slug: e.target.value,
            })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="organizer">Organizer</Label>

        <Input
          id="organizer"
          value={competition.organizer ?? ""}
          onChange={(e) =>
            updateCompetition({
              organizer: e.target.value,
            })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="website">Website</Label>

        <Input
          id="website"
          value={competition.website ?? ""}
          onChange={(e) =>
            updateCompetition({
              website: e.target.value,
            })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="registrationLink">
          Registration Link
        </Label>

        <Input
          id="registrationLink"
          value={competition.registrationLink ?? ""}
          onChange={(e) =>
            updateCompetition({
              registrationLink: e.target.value,
            })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="shortDescription">
          Short Description
        </Label>

        <Textarea
          id="shortDescription"
          rows={5}
          value={competition.shortDescription ?? ""}
          onChange={(e) =>
            updateCompetition({
              shortDescription: e.target.value,
            })
          }
        />
      </div>
    </div>
  );
}