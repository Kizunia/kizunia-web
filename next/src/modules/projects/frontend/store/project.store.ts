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

  /**
   * Replaces the snapshot in place with a resource already returned by a
   * mutation (e.g. updateProfile/updateContent), without a network round
   * trip. Section editor stores should call this after a successful save
   * so shared chrome (header, nav, other sections' read-only data) reflects
   * the change immediately.
   */
  setProject: (project: ProjectDetailsDto) => void;

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

    setProject: (project) => {
      set({
        project,
        error: null,
      });
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