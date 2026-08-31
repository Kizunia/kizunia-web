import { HttpClient } from "@/lib/http/client";

import type { LocationSearchResult } from "../types/provider";

export class LocationApi {
  /**
   * Searches for places to attach to a competition.
   *
   * Always resolves with a result — `providerAvailable: false` means external
   * lookup was skipped or failed, and the caller should offer manual entry
   * rather than treat it as an error.
   */
  static async search(query: string, limit = 10): Promise<LocationSearchResult> {
    const params = new URLSearchParams({
      q: query,
      limit: String(limit),
    });

    const response = await HttpClient.get<LocationSearchResult>(
      `/api/v1/locations/search?${params.toString()}`,
    );

    return response.data;
  }
}
