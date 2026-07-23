import { NextResponse } from "next/server";

import { createErrorResponse } from "./error-response";
import { isAppError } from "./is-app-error";
import { ZodError } from "zod";
import { convertZodError } from "./zod";

export class ErrorHandler {
  static handle(error: unknown) {
    if (error instanceof ZodError) {
      error = convertZodError(error);
    }

    if (isAppError(error)) {
      console.error(error);

      return NextResponse.json(createErrorResponse(error), {
        status: error.status,
      });
    }

    console.error(error);

    return NextResponse.json(
      {
        success: false,

        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred.",
        },
      },
      {
        status: 500,
      },
    );
  }
}
