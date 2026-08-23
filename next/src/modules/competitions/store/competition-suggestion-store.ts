import { create } from "zustand";
import { toast } from "sonner";

import { ApiError } from "@/lib/http";

import type { CreateCompetitionSuggestionInput } from "../schemas/create-competition-suggestion";
import type { CompetitionSuggestionDTO } from "../types/suggestion";

import { CompetitionSuggestionApi } from "../api/competition-suggestion-api";

interface CompetitionSuggestionStore {
  loading: boolean;

  create(
    data: CreateCompetitionSuggestionInput,
  ): Promise<CompetitionSuggestionDTO>;

  findById(
    id: string,
  ): Promise<CompetitionSuggestionDTO>;

  submit(
    id: string,
  ): Promise<CompetitionSuggestionDTO>;
}

export const useCompetitionSuggestionStore =
  create<CompetitionSuggestionStore>((set) => ({
    loading: false,

    // =========================================================================
    // Create
    // =========================================================================

    async create(data) {
      try {
        set({ loading: true });

        return await CompetitionSuggestionApi.create(data);
      } catch (error: unknown) {
        if (error instanceof ApiError) {
          toast.error(error.message);
        } else {
          toast.error(
            "Failed to create competition suggestion.",
          );
        }

        throw error;
      } finally {
        set({ loading: false });
      }
    },

    // =========================================================================
    // Read
    // =========================================================================

    async findById(id) {
      try {
        set({ loading: true });

        return await CompetitionSuggestionApi.findById(id);
      } catch (error: unknown) {
        if (error instanceof ApiError) {
          toast.error(error.message);
        } else {
          toast.error(
            "Failed to load competition suggestion.",
          );
        }

        throw error;
      } finally {
        set({ loading: false });
      }
    },

    // =========================================================================
    // Submit
    // =========================================================================

    async submit(id) {
      try {
        set({ loading: true });

        return await CompetitionSuggestionApi.submit(id);
      } catch (error: unknown) {
        if (error instanceof ApiError) {
          toast.error(error.message);
        } else {
          toast.error(
            "Failed to submit competition suggestion.",
          );
        }

        throw error;
      } finally {
        set({ loading: false });
      }
    },
  }));