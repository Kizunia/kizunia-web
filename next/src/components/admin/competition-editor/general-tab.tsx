"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  COMPETITION_STATUS_OPTIONS,
  COMPETITION_VISIBILITY_OPTIONS,
  COMPETITION_MODE_OPTIONS,
  REGISTRATION_PLATFORM_OPTIONS,
  CERTIFICATE_OPTIONS,
  DIFFICULTY_OPTIONS,
  ORGANIZER_TYPE_OPTIONS,
  REGISTRATION_FEE_TYPE_OPTIONS,
} from "@/modules/competitions/constants";
import { useCompetitionEditorStore } from "@/modules/competitions/store/editor-store";
import { SelectField } from "./select-field";
import { AssetsTab } from "./assets-tab";

export function GeneralTab() {
  const competition = useCompetitionEditorStore((state) => state.competition);

  const updateCompetition = useCompetitionEditorStore(
    (state) => state.updateCompetition,
  );

  if (!competition) {
    return null;
  }

  return (
    <div className="grid gap-6 pt-6">
      <div className="space-y-2">
        <Label htmlFor="assets">Assets</Label>
        <AssetsTab />
      </div>
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>

        <Input
          id="title"
          value={competition.title ?? ""}
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
          value={competition.slug ?? ""}
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
        <Label htmlFor="registrationLink">Registration Link</Label>

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
        <Label htmlFor="shortDescription">Short Description</Label>

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

      <SelectField
        label="Status"
        value={competition.status}
        options={COMPETITION_STATUS_OPTIONS}
        onValueChange={(status) =>
          updateCompetition({
            status: status as typeof competition.status,
          })
        }
      />

      <SelectField
        label="Visibility"
        value={competition.visibility}
        options={COMPETITION_VISIBILITY_OPTIONS}
        onValueChange={(visibility) =>
          updateCompetition({
            visibility: visibility as typeof competition.visibility,
          })
        }
      />

      <SelectField
        label="Mode"
        value={competition.mode}
        options={COMPETITION_MODE_OPTIONS}
        onValueChange={(mode) =>
          updateCompetition({
            mode: mode as typeof competition.mode,
          })
        }
      />

      <SelectField
        label="Registration Platform"
        value={competition.registrationPlatform}
        options={REGISTRATION_PLATFORM_OPTIONS}
        onValueChange={(registrationPlatform) =>
          updateCompetition({
            registrationPlatform:
              registrationPlatform as typeof competition.registrationPlatform,
          })
        }
      />

      <div className="space-y-2">
        <Label>Prize Pool</Label>

        <Input
          placeholder="Prize Pool"
          value={competition.prizePool ?? ""}
          onChange={(e) =>
            updateCompetition({
              prizePool: e.target.value || null,
            })
          }
        />
      </div>

      <div className="space-y-2">
        <Label>Registration Fee</Label>
        <Input
          placeholder="Registration Fee"
          value={competition.registrationFee ?? ""}
          onChange={(e) =>
            updateCompetition({
              registrationFee: e.target.value || null,
            })
          }
        />
      </div>

      <SelectField
        label="Registration Fee Type"
        value={competition.registrationFeeType}
        options={REGISTRATION_FEE_TYPE_OPTIONS}
        onValueChange={(registrationFeeType) =>
          updateCompetition({
            registrationFeeType:
              registrationFeeType as typeof competition.registrationFeeType,
          })
        }
      />

      <SelectField
        label="Organizer Type"
        value={competition.organizerType}
        options={ORGANIZER_TYPE_OPTIONS}
        onValueChange={(organizerType) =>
          updateCompetition({
            organizerType: organizerType as typeof competition.organizerType,
          })
        }
      />

      <SelectField
        label="Difficulty"
        value={competition.difficulty}
        options={DIFFICULTY_OPTIONS}
        onValueChange={(difficulty) =>
          updateCompetition({
            difficulty: difficulty as typeof competition.difficulty,
          })
        }
      />

      <SelectField
        label="Certificate"
        value={competition.certificateType}
        options={CERTIFICATE_OPTIONS}
        onValueChange={(certificateType) =>
          updateCompetition({
            certificateType:
              certificateType as typeof competition.certificateType,
          })
        }
      />

      <div className="space-y-2">
        <Label>Min Team Size</Label>
        <Input
          type="number"
          placeholder="Minimum Team Size"
          value={competition.minTeamSize ?? ""}
          onChange={(e) =>
            updateCompetition({
              minTeamSize:
                e.target.value === "" ? null : Number(e.target.value),
            })
          }
        />
      </div>

      <div className="space-y-2">
        <Label>Max Team Size</Label>

        <Input
          type="number"
          placeholder="Maximum Team Size"
          value={competition.maxTeamSize ?? ""}
          onChange={(e) =>
            updateCompetition({
              maxTeamSize:
                e.target.value === "" ? null : Number(e.target.value),
            })
          }
        />
      </div>
    </div>
  );
}
