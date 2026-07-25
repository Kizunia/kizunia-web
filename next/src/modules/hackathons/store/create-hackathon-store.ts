import {create}  from "zustand";

import type { CreateHackathonInput } from "../schemas/create-hackathon";
import { CompetitionApi } from "../api/hackathon-api";

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

                console.log("CREATE HACKATHON STORE");

                console.dir(data, {
                    depth: null,
                });

                // TODO:
                await CompetitionApi.create(data);

            } finally {
                set({
                    loading: false,
                });
            }
        },
    }));