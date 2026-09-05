

import type { CreateCompetitionInput } from "../schemas/create-competition";
import { HttpClient } from "@/lib/http/client";
import { CompetitionDetailDTO } from "../types/dto";
import { CompetitionEditDTOWithPermissions } from "../types/edit-dto";
import { UpdateCompetitionRequestDTO } from "../types/update-request-dto";
import type { SetAssetInput } from "@/modules/assets/schemas/set-asset";
import type { BulkCompetitionActionInput } from "../schemas/bulk-competition-action";
import type { Competition } from "@/generated/prisma";

export class CompetitionApi {
  static async create(data: CreateCompetitionInput) {
    const response = await HttpClient.post<Competition, CreateCompetitionInput>(
      "/api/v1/admin/competitions/new",
      data,
    );

    return response;
  }

  static getPublic(slug: string) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL!;
    return HttpClient.get<CompetitionDetailDTO>(
      `${baseUrl}/api/v1/competitions/${slug}`,
    );
  }

  static async update(id: string, body: UpdateCompetitionRequestDTO) {
    const response = await HttpClient.patch<
      CompetitionDetailDTO,
      UpdateCompetitionRequestDTO
    >(`/api/v1/admin/competitions/${id}`, body);

    return response.data;
  }

  static async delete(id: string): Promise<void> {

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL!;
    await HttpClient.delete(`${baseUrl}/api/v1/admin/competitions/${id}`);
    // console.log(`Competition with ID ${id} deleted successfully.`);
  }

  static async restore(id: string): Promise<void> {
    await HttpClient.patch(`/api/v1/admin/competitions/${id}/restore`, {});
  }

  static async bulkUpdate(
    input: BulkCompetitionActionInput,
  ): Promise<{ updated: number }> {
    const response = await HttpClient.post<
      { updated: number },
      BulkCompetitionActionInput
    >("/api/v1/admin/competitions/bulk", input);

    return response.data;
  }

  static async getForEdit(
    id: string,
  ): Promise<CompetitionEditDTOWithPermissions> {
    const response = await HttpClient.get<CompetitionEditDTOWithPermissions>(
      `/api/v1/admin/competitions/${id}`,
    );

    return response.data;
  }

  static async setAsset(
    id: string,
    slot: "logo" | "banner" | "cover",
    input: SetAssetInput,
  ) {
    const response = await HttpClient.patch<
      CompetitionEditDTOWithPermissions,
      SetAssetInput
    >(`/api/v1/admin/competitions/${id}/assets/${slot}`, input);

    return response.data;
  }
}
