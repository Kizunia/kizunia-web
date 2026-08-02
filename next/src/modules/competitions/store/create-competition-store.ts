import {create}  from "zustand";

import type { CreateCompetitionInput } from "../schemas/create-competition";
import { CompetitionApi } from "../api/competition-api";
import { ApiError } from "@/lib/http";
import { toast } from "sonner";
import { AuthorizationCode } from "@/authorization";

interface CreateCompetitionStore {
    loading: boolean;

    create(
        data: CreateCompetitionInput,
    ): Promise<void>;
}

export const useCreateCompetitionStore =
    create<CreateCompetitionStore>((set) => ({
        loading: false,

        async create(data) {
            try {
                set({ loading: true });

                console.dir(data, {
                    depth: null,
                });

                // TODO:
                await CompetitionApi.create(data);

            } catch(e: unknown) {
                if (e instanceof ApiError) {
                    toast.error(e.message);
                    // if(e.code === AuthorizationCode.ROLE_PERMISSION_DENIED) toast.error("ROLE PERM DENIED");
                }
            } finally {
                set({
                    loading: false,
                });
            }
        },
    }));