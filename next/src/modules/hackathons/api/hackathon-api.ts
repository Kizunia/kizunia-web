import axios from "@/lib/axios";

import type { CreateHackathonInput } from "../schemas/create-hackathon";
import { HttpClient } from "@/lib/http/client";
import { CompetitionDetailDTO } from "../types/dto";

export class CompetitionApi {
  static async create(data: CreateHackathonInput) {
    const response = await axios.post("/api/v1/admin/hackathons/new", data);

    return response.data;
  }

  static getPublic(slug: string) {
    return HttpClient.get<CompetitionDetailDTO>(`/api/v1/competitions/${slug}`);
  }
}
