/**
 * Assets Module - Controller
 *
 * Request parsing, authentication, calling services, returning responses.
 * No business logic or authorization here — that lives in
 * UploadIntentService / target-authorization.ts.
 */

import { NextRequest } from "next/server";

import { ApiResponse, Route } from "@/lib/http";
import { SessionService } from "@/lib/auth/session";

import { CreateUploadIntentSchema } from "../schemas/create-upload-intent";
import { FinalizeUploadSchema } from "../schemas/finalize-upload";
import { uploadIntentService } from "./upload-intent.service";

export class AssetController {
  static async createUploadIntent(request: NextRequest) {
    return Route.execute(async () => {
      // -----------------------------------------------------------------
      // Authentication
      // -----------------------------------------------------------------
      const actor = await SessionService.getStrictActor(request);

      // -----------------------------------------------------------------
      // Validation
      // -----------------------------------------------------------------
      const body = await request.json();

      const data = CreateUploadIntentSchema.parse(body);

      // -----------------------------------------------------------------
      // Business Logic
      // -----------------------------------------------------------------
      const result = await uploadIntentService.create({
        actor,
        purpose: data.purpose,
        targetEntityType: data.targetEntityType,
        targetEntityId: data.targetEntityId,
        declaredMimeType: data.declaredMimeType,
        declaredSize: data.declaredSize,
      });

      // -----------------------------------------------------------------
      // Response
      // -----------------------------------------------------------------
      return ApiResponse.created(result);
    });
  }

  static async finalize(request: NextRequest) {
    return Route.execute(async () => {
      // -----------------------------------------------------------------
      // Authentication
      // -----------------------------------------------------------------
      const actor = await SessionService.getStrictActor(request);

      // -----------------------------------------------------------------
      // Validation
      // -----------------------------------------------------------------
      const body = await request.json();

      const data = FinalizeUploadSchema.parse(body);

      // -----------------------------------------------------------------
      // Business Logic
      // -----------------------------------------------------------------
      const asset = await uploadIntentService.finalize({
        actor,
        intentId: data.intentId,
      });

      // -----------------------------------------------------------------
      // Response
      // -----------------------------------------------------------------
      return ApiResponse.created(asset);
    });
  }
}
