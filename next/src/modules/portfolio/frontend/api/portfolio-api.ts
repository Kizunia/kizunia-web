import { HttpClient } from "@/lib/http/client";
import { PortfolioEditorDto, PortfolioPublicDetailsDto } from "../../dtos";

export class PortfolioApi {
  static async create(): Promise<PortfolioEditorDto> {
    const response = await HttpClient.post<
      PortfolioEditorDto,
      Record<string, never>
    >("/api/v1/portfolio");

    return response.data;
  }

  static async getMine(): Promise<PortfolioEditorDto> {
    const response = await HttpClient.get<PortfolioEditorDto>(
      "/api/v1/portfolio/me",
    );

    return response.data;
  }

  static async getPublic(
    username: string,
  ): Promise<PortfolioPublicDetailsDto> {
    const response = await HttpClient.get<PortfolioPublicDetailsDto>(
      `/api/v1/portfolio/${username}`,
    );

    return response.data;
  }
}