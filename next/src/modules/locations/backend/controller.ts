/**
 * Locations Module - Controller
 *
 * Responsible for:
 * - Request parsing
 * - Authentication checks
 * - Calling services
 * - Returning responses
 *
 * Controllers should never contain business logic.
 */

import { NextRequest } from "next/server";

import { SessionService } from "@/lib/auth/index";
import { ApiResponse, Route } from "@/lib/http";

import { LocationSearchQuerySchema } from "../schemas/location-search";
import { LocationSearchService } from "../services/location-search.service";

export class LocationController {
  /**
   * Free-text location search for the competition editor.
   *
   * Authenticated because it fronts an external geocoding provider — leaving it
   * open would turn the platform into an unmetered proxy and put the shared
   * Nominatim instance's rate limit at the mercy of anonymous traffic.
   *
   * Never fails because of the provider: `LocationSearchService` degrades to
   * internal results, and `providerAvailable` tells the UI to offer manual entry.
   */
  static async search(request: NextRequest) {
    return Route.execute(async () => {
      // -----------------------------------------------------------------
      // Authentication
      // -----------------------------------------------------------------

      await SessionService.getActor(request);

      // -----------------------------------------------------------------
      // Validation
      // -----------------------------------------------------------------

      const query = Object.fromEntries(request.nextUrl.searchParams.entries());

      const { q, limit } = LocationSearchQuerySchema.parse(query);

      // -----------------------------------------------------------------
      // Business Logic
      // -----------------------------------------------------------------

      const result = await LocationSearchService.search(q, limit);

      // -----------------------------------------------------------------
      // Response
      // -----------------------------------------------------------------

      return ApiResponse.ok(result);
    });
  }
}
