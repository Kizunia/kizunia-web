import { create } from "zustand";

import { ApiError } from "@/lib/http";
import { ProjectApi } from "../api/project-api";
import { ProjectDetailsDto } from "../../backend/dto/output";

interface ProjectStore {
  project: ProjectDetailsDto | null;

  isLoading: boolean;

  error: string | null;

  getProject: (params: {
    id: string;
  }) => Promise<void>;

  clear: () => void;
}

export const useProjectStore = create<ProjectStore>(
  (set) => ({
    project: null,

    isLoading: true,

    error: null,

    getProject: async ({ id }) => {
      set({
        isLoading: true,
        error: null,
      });

      try {
        const project = await ProjectApi.getById(id);

        set({
          project,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        set({
          project: null,
          isLoading: false,
          error:
            error instanceof ApiError
              ? error.message
              : error instanceof Error
                ? error.message
                : "Failed to load project.",
        });
      }
    },

    clear: () => {
      set({
        project: null,
        isLoading: false,
        error: null,
      });
    },
  }),
);