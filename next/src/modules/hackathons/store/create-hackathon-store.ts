import {create}  from "zustand";

import type { CreateHackathonInput } from "../schemas/create-hackathon";
import { CompetitionApi } from "../api/hackathon-api";
import { ApiError } from "@/lib/http";
import { toast } from "sonner";
import { AuthorizationCode } from "@/authorization";

interface CreateHackathonStore {
    loading: boolean;

    create(
        data: CreateHackathonInput,
    ): Promise<void>;
}

export const useCreateHackathonStore =
    create<CreateHackathonStore>((set) => ({
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