import { create } from "zustand";
import { toast } from "sonner";
import type { CompetitionEditDTO } from "../types/edit-dto";
import { CompetitionApi } from "../api/hackathon-api";

interface CompetitionEditorStore {
  competition: CompetitionEditDTO | null;

  original: CompetitionEditDTO | null;

  dirty: boolean;

  initialize: (competition: CompetitionEditDTO) => void;
  saving: boolean;

  save: () => Promise<void>;

  updateCompetition(partial: Partial<CompetitionEditDTO>): void;

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

    save: async () => {
      const state = useCompetitionEditorStore.getState();

      if (!state.competition) {
        return;
      }

      try {
        useCompetitionEditorStore.setState({
          saving: true,
        });

        await CompetitionApi.update(state.competition.id, state.competition);

        useCompetitionEditorStore.setState({
          original: structuredClone(state.competition),
          dirty: false,
          saving: false,
        });

        toast.success("Competition updated successfully.");
      } catch (error) {
        console.error(error);

        useCompetitionEditorStore.setState({
          saving: false,
        });

        toast.error("Failed to update competition.");
      }
    },

    reset: () =>
      set((state) => ({
        competition: state.original ? structuredClone(state.original) : null,
        dirty: false,
      })),
  }),
);
