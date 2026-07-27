import axios from "@/lib/axios";

import type { CreateHackathonInput } from "../schemas/create-hackathon";
import { HttpClient } from "@/lib/http/client";
import { CompetitionDetailDTO } from "../types/dto";
import { CompetitionEditDTO } from "../types/edit-dto";
import { UpdateCompetitionRequestDTO } from "../types/update-request-dto";
import { CreateAssetDTO } from "@/modules/assets/dto/create-asset.dto";

export class CompetitionApi {
  static async create(data: CreateHackathonInput) {
    const response = await axios.post("/api/v1/admin/hackathons/new", data);

    return response.data;
  }

  static getPublic(slug: string) {
    return HttpClient.get<CompetitionDetailDTO>(`/api/v1/competitions/${slug}`);
  }

  static async update(id: string, body: UpdateCompetitionRequestDTO) {
    const response = await HttpClient.patch<
      CompetitionDetailDTO,
      UpdateCompetitionRequestDTO
    >(`/api/v1/admin/hackathons/${id}`, body);

    return response.data;
  }

  static async getForEdit(id: string): Promise<CompetitionEditDTO> {
    const response = await HttpClient.get<CompetitionEditDTO>(
      `/api/v1/admin/hackathons/${id}`,
    );

    return response.data;
  }

  static async setAsset(
    id: string,
    slot: "logo" | "banner" | "cover",
    upload: CreateAssetDTO,
  ) {
    const response = await HttpClient.patch<CompetitionEditDTO, CreateAssetDTO>(
      `/api/v1/admin/hackathons/${id}/assets/${slot}`,
      upload,
    );

    return response.data;
  }
}
