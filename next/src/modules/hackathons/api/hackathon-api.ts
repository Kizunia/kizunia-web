import axios from "@/lib/axios";

import type { CreateHackathonInput } from "../schemas/create-hackathon";

export class HackathonApi {
    static async create(
        data: CreateHackathonInput,
    ) {

        console.dir(data, {
            depth: null,
        });

        const response = await axios.post(
            "/api/v1/admin/hackathons/new",
            data,
        );

        return response.data;
    }
}