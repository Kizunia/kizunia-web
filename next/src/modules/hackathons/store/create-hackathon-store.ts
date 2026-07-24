import {create}  from "zustand";

import type { CreateHackathonInput } from "../schemas/create-hackathon";
import { HackathonApi } from "../api/hackathon-api";

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
                await HackathonApi.create(data);

            } finally {
                set({
                    loading: false,
                });
            }
        },
    }));