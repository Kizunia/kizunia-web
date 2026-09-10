import { create } from "zustand";
import { toast } from "sonner";
import type { CompetitionEditDTOWithPermissions } from "../types/edit-dto";
import type { CompetitionLocationDTO } from "../types/competition-location.dto";
import type { CompetitionTechnologyDTO } from "../types/competition-technology.dto";
import { CompetitionApi } from "../api/competition-api";
import { ApiError } from "@/lib/http";

interface CompetitionEditorStore {
  competition: CompetitionEditDTOWithPermissions | null;

  original: CompetitionEditDTOWithPermissions | null;

  dirty: boolean;

  deleting: boolean;

  initialize: (competition: CompetitionEditDTOWithPermissions) => void;
  saving: boolean;

  save: () => Promise<void>;

  updateCompetition(partial: Partial<CompetitionEditDTOWithPermissions>): void;

  /**
   * Replaces the location list after a locations endpoint has already
   * persisted it.
   *
   * Writes to both `competition` and `original` and leaves `dirty` alone:
   * locations save through their own endpoints, so treating them as unsaved
   * edits would strand the save bar and let Reset silently undo work that is
   * already committed on the server.
   */
  setLocations(locations: CompetitionLocationDTO[]): void;

  /**
   * Replaces the technology list after a technologies endpoint has already
   * persisted it. Same reasoning as `setLocations`: technologies attach and
   * detach through their own endpoints, so this leaves `dirty` alone rather
   * than treating the change as an unsaved edit.
   */
  setTechnologies(technologies: CompetitionTechnologyDTO[]): void;

  deleteCompetition: () => Promise<void>;
  setCompetition(competition: CompetitionEditDTOWithPermissions): void;
  reset(): void;
}

export const useCompetitionEditorStore = create<CompetitionEditorStore>(
  (set) => ({
    competition: null,
    saving: false,
    deleting: false,
    original: null,

    dirty: false,

    initialize: (competition) =>
      set({
        competition,
        original: structuredClone(competition),
        dirty: false,
      }),

    updateCompetition: (partial) =>
      set((state) => {
        if (!state.competition) {
          return state;
        }

        return {
          competition: {
            ...state.competition,
            ...partial,
          },
          dirty: true,
        };
      }),

    setLocations: (locations) =>
      set((state) => {
        if (!state.competition) {
          return state;
        }

        return {
          competition: {
            ...state.competition,
            locations,
          },

          original: state.original
            ? {
                ...state.original,
                locations,
              }
            : state.original,
        };
      }),

    setTechnologies: (technologies) =>
      set((state) => {
        if (!state.competition) {
          return state;
        }

        return {
          competition: {
            ...state.competition,
            technologies,
          },

          original: state.original
            ? {
                ...state.original,
                technologies,
              }
            : state.original,
        };
      }),

    setCompetition: (competition) =>
      set({
        competition,

        original: structuredClone(competition),

        dirty: false,
      }),

    save: async () => {
      const state = useCompetitionEditorStore.getState();

      if (!state.competition) {
        return;
      }

      try {
        useCompetitionEditorStore.setState({
          saving: true,
        });

        // `status` is sent only when it actually changed from what the
        // server last returned. Its mere presence in the payload tells the
        // backend "this request is an explicit manual status choice" and
        // makes it skip automatic recalculation for the request (manual
        // always wins — see `CompetitionService.update`). Sending it
        // unconditionally would mean an ordinary date-only save could never
        // trigger reconciliation from this editor.
        const statusChanged =
          state.competition.status !== state.original?.status;

        const updated = await CompetitionApi.update(state.competition.id, {
          title: state.competition.title ?? undefined,
          shortDescription: state.competition.shortDescription,
          organizer: state.competition.organizer,
          website: state.competition.website,
          registrationLink: state.competition.registrationLink,
          registrationPlatform: state.competition.registrationPlatform,

          registrationFee: state.competition.registrationFee,

          registrationFeeType: state.competition.registrationFeeType,

          organizerType: state.competition.organizerType,

          difficulty: state.competition.difficulty,

          certificateType: state.competition.certificateType,

          content: state.competition.content,
          mode: state.competition.mode,
          visibility: state.competition.visibility,
          ...(statusChanged && { status: state.competition.status }),
          prizePool: state.competition.prizePool,
          minTeamSize: state.competition.minTeamSize,
          maxTeamSize: state.competition.maxTeamSize,
          registrationDeadline: state.competition.registrationDeadline,
          startDate: state.competition.startDate,
          endDate: state.competition.endDate,
          registrationStartDate: state.competition.registrationStartDate,
          automaticStatusUpdatesDisabled:
            state.competition.automaticStatusUpdatesDisabled,
        });

        // Adopt the server's response rather than the pre-save local
        // snapshot: the backend may have just recalculated `status` (a
        // lifecycle date changed, or automation was re-enabled), and this
        // is how that result reaches the UI immediately, without a page
        // refresh. Reading `useCompetitionEditorStore.getState()` again
        // here (rather than reusing the `state` captured at the top of this
        // function) also means edits made while the request was in flight
        // are not silently discarded and marked clean.
        const latest = useCompetitionEditorStore.getState();
        useCompetitionEditorStore.setState({
          competition: latest.competition
            ? { ...latest.competition, ...updated }
            : updated,
          original: structuredClone(updated),
          dirty: false,
          saving: false,
        });

        toast.success("Competition updated successfully.");
      } catch (error) {
        console.log("STORE CAUGHT", error);

        useCompetitionEditorStore.setState({
          saving: false,
        });

        if (error instanceof ApiError) {
          if (error.code === "VALIDATION_FAILED") {
            const cc = error.details as { fields: Record<string, string[]> };
            console.log("ApiError", cc.fields);
            toast.error("Validation failed. Please check your input.", {
              description: "error.details",
            });
            return;
          }
          toast.error(error.message);
          return;
        }

        toast.error("Unexpected error");
      }
    },

    deleteCompetition: async () => {
      const state = useCompetitionEditorStore.getState();

      if (!state.competition) {
        return;
      }

      try {
        useCompetitionEditorStore.setState({
          deleting: true,
        });

        await CompetitionApi.delete(state.competition.id);

        useCompetitionEditorStore.setState({
          deleting: false,
        });

        toast.success("Competition deleted.");
      } catch (error) {
        console.log("STORE CAUGHT", error);
        useCompetitionEditorStore.setState({
          deleting: false,
        });

        if (error instanceof ApiError) {
          toast.error(error.message);
          return;
        }

        toast.error("Unexpected error");
      }
    },

    reset: () =>
      set((state) => ({
        competition: state.original ? structuredClone(state.original) : null,
        dirty: false,
      })),
  }),
);
