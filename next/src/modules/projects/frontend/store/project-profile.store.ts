import { create } from "zustand";

import { ApiError } from "@/lib/http";
import { ProjectApi } from "../api/project-api";
import { UpdateProjectProfileDto } from "../../backend/dto/input";
import { ProjectDetailsDto } from "../../backend/dto/output";


interface ProjectProfileStore {
  form: UpdateProjectProfileDto;

  isSaving: boolean;

  error: string | null;

  initialize: (project: ProjectDetailsDto) => void;

  setField: <K extends keyof UpdateProjectProfileDto>(
    field: K,
    value: UpdateProjectProfileDto[K],
  ) => void;

  updateProfile: (params: {
    id: string;
  }) => Promise<ProjectDetailsDto | null>;

  reset: () => void;
}

const initialForm: UpdateProjectProfileDto = {
  title: "",
  slug: "",
  shortDescription: "",
  status: "DRAFT",
  visibility: "PUBLIC",
};

export const useProjectProfileStore =
  create<ProjectProfileStore>((set, get) => ({
    form: initialForm,

    isSaving: false,

    error: null,

    initialize: (project) => {
      set({
        form: {
          title: project.title,
          slug: project.slug,
          shortDescription: project.shortDescription,
          status: project.status,
          visibility: project.visibility,
        },
        error: null,
      });
    },

    setField: (field, value) => {
      set((state) => ({
        form: {
          ...state.form,
          [field]: value,
        },
        error: null,
      }));
    },

    updateProfile: async ({ id }) => {
      const { form } = get();

      set({
        isSaving: true,
        error: null,
      });

      try {
        const project = await ProjectApi.updateProfile(
          id,
          form,
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
                : "Failed to update project.",
        });

        return null;
      }
    },

    reset: () => {
      set({
        form: initialForm,
        isSaving: false,
        error: null,
      });
    },
  }));