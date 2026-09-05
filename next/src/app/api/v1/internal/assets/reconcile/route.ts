/**
 * Internal reconciliation trigger.
 *
 * There is no background job/queue infrastructure in this repository (see
 * docs/architecture/domain/assets/security.md#orphan-and-cleanup-architecture).
 * This route exists purely as the invocation point an external scheduler
 * (a platform cron feature, etc.) calls — the scheduling mechanism itself is
 * deliberately kept outside this codebase, per the architecture docs.
 *
 * Not a user-facing endpoint: it is not part of Kizunia's session-based
 * authorization model, so it is protected by a shared secret instead.
 * Requires the INTERNAL_RECONCILE_SECRET environment variable to be set;
 * fails closed (401) if it is missing or does not match.
 */

import { NextRequest, NextResponse } from "next/server";

import { assetReconciliationService } from "@/modules/assets/backend/reconciliation.service";

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.INTERNAL_RECONCILE_SECRET;

  const providedSecret = request.headers.get("x-internal-secret");

  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized." } },
      { status: 401 },
    );
  }

  const summary = await assetReconciliationService.runAll();

  return NextResponse.json({ success: true, data: summary });
}
