import { create } from "zustand";

import { ApiError } from "@/lib/http";
import { ProjectApi } from "../api/project-api";
import { UpdateProjectContentDto } from "../../backend/dto/input";
import { ProjectDetailsDto } from "../../backend/dto/output";


interface ProjectContentStore {
  content: string;

  isSaving: boolean;
  error: string | null;

  initialize: (project: ProjectDetailsDto) => void;

  setContent: (content: string) => void;

  updateContent: (params: {
    id: string;
  }) => Promise<ProjectDetailsDto | null>;

  reset: () => void;
}

export const useProjectContentStore =
  create<ProjectContentStore>((set, get) => ({
    content: "",

    isSaving: false,
    error: null,

    initialize: (project) => {
      set({
        content: project.content ?? "",
        error: null,
      });
    },

    setContent: (content) => {
      set({
        content,
        error: null,
      });
    },

    updateContent: async ({ id }) => {
      const { content } = get();

      const dto: UpdateProjectContentDto = {
        content,
      };

      set({
        isSaving: true,
        error: null,
      });

      try {
        const project = await ProjectApi.updateContent(
          id,
          dto,
        );

        set({
          isSaving: false,
          error: null,
        });

        return project;
      } catch (error) {
        set({
          isSaving: false,
          error:
            error instanceof ApiError
              ? error.message
              : error instanceof Error
                ? error.message
                : "Failed to update project content.",
        });

        return null;
      }
    },

    reset: () => {
      set({
        content: "",
        isSaving: false,
        error: null,
      });
    },
  }));