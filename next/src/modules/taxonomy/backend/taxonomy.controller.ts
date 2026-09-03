/**
 * Taxonomy Module - Controller
 *
 * Responsible for:
 * - Request parsing
 * - Rate limiting
 * - Calling services
 * - Returning responses
 *
 * Controllers should never contain business logic.
 */

import { NextRequest } from "next/server";

import { RateLimitError } from "@/lib/errors";
import { ApiResponse, Route } from "@/lib/http";
import { checkRateLimit, clientIdentifier } from "@/lib/rate-limit";

import { TaxonomyQuerySchema } from "../schemas/taxonomy-query";
import { TaxonomyService } from "../services/taxonomy.service";

/**
 * Higher than the place limiter, because this route is cheap.
 *
 * It reads two indexed local tables and calls no external provider, so the
 * limiter here guards database load rather than a metered quota. It exists at
 * all because the route is public and unauthenticated.
 */
const RATE_LIMIT = {
  scope: "taxonomy:list",
  limit: 120,
  windowSeconds: 60,
} as const;

export class TaxonomyController {
  static async categories(request: NextRequest) {
    return this.list(request, (query) => TaxonomyService.listCategories(query));
  }

  static async technologies(request: NextRequest) {
    return this.list(request, (query) =>
      TaxonomyService.listTechnologies(query),
    );
  }

  /**
   * Shared handling for both lists.
   *
   * Written once because the two differ only in which service call they make;
   * duplicating the limiter and the parsing would create two places for the
   * public-endpoint protections to drift apart.
   */
  private static async list(
    request: NextRequest,
    load: (
      query: ReturnType<typeof TaxonomyQuerySchema.parse>,
    ) => Promise<unknown>,
  ) {
    return Route.execute(async () => {
      const limit = await checkRateLimit(clientIdentifier(request), RATE_LIMIT);

      if (!limit.allowed) {
        throw new RateLimitError({
          code: "TAXONOMY_RATE_LIMITED",
          message: "Too many requests. Try again in a moment.",
          retryAfterSeconds: limit.retryAfterSeconds,
        });
      }

      const raw = Object.fromEntries(request.nextUrl.searchParams.entries());

      const query = TaxonomyQuerySchema.parse(raw);

      return ApiResponse.ok(await load(query));
    });
  }
}
