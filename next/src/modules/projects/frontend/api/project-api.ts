import { HttpClient } from "@/lib/http/client";
import { UpdateProjectProfileDto, UpdateProjectContentDto } from "../../backend/dto/input";
import { ProjectDetailsDto } from "../../backend/dto/output";



export class ProjectApi {
  static async getById(
    id: string,
  ): Promise<ProjectDetailsDto> {
    const response = await HttpClient.get<ProjectDetailsDto>(
      `/api/v1/projects/${id}`,
    );

    return response.data;
  }

  static async updateProfile(
    id: string,
    dto: UpdateProjectProfileDto,
  ): Promise<ProjectDetailsDto> {
    const response = await HttpClient.patch<
      ProjectDetailsDto,
      UpdateProjectProfileDto
    >(
      `/api/v1/projects/${id}`,
      dto,
    );

    return response.data;
  }

  static async updateContent(
    id: string,
    dto: UpdateProjectContentDto,
  ): Promise<ProjectDetailsDto> {
    const response = await HttpClient.patch<
      ProjectDetailsDto,
      UpdateProjectContentDto
    >(
      `/api/v1/projects/${id}/content`,
      dto,
    );

    return response.data;
  }

  static async delete(
    id: string,
  ): Promise<void> {
    await HttpClient.delete<Record<string, never>>(
      `/api/v1/projects/${id}`,
    );
  }
}