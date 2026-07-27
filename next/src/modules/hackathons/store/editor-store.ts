import { create } from "zustand";
import { toast } from "sonner";
import type { CompetitionEditDTO } from "../types/edit-dto";
import { CompetitionApi } from "../api/hackathon-api";
import { ApiError } from "@/lib/http";

interface CompetitionEditorStore {
  competition: CompetitionEditDTO | null;

  original: CompetitionEditDTO | null;

  dirty: boolean;

  initialize: (competition: CompetitionEditDTO) => void;
  saving: boolean;

  save: () => Promise<void>;

  updateCompetition(partial: Partial<CompetitionEditDTO>): void;
  setCompetition(competition: CompetitionEditDTO): void;
  reset(): void;
}

export const useCompetitionEditorStore = create<CompetitionEditorStore>(
  (set) => ({
    competition: null,
    saving: false,
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

        await CompetitionApi.update(state.competition.id, {
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
          status: state.competition.status,
          location: state.competition.location,
          prizePool: state.competition.prizePool,
          minTeamSize: state.competition.minTeamSize,
          maxTeamSize: state.competition.maxTeamSize,
          registrationDeadline: state.competition.registrationDeadline,
          startDate: state.competition.startDate,
          endDate: state.competition.endDate,
        });

        useCompetitionEditorStore.setState({
          original: structuredClone(state.competition),
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
            const cc= error.details as { fields: Record<string, string[]> };
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

    reset: () =>
      set((state) => ({
        competition: state.original ? structuredClone(state.original) : null,
        dirty: false,
      })),
  }),
);
