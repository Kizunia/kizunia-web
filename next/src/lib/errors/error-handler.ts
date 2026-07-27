import { NextResponse } from "next/server";

import { createErrorResponse } from "./error-response";
import { isAppError } from "./is-app-error";
import { ZodError } from "zod";
import { convertZodError } from "./zod";
import { ValidationFailedError } from "./validation-failed-error";
export class ErrorHandler {
  static handle(error: unknown) {
    console.error("ErrorHandler.handle() called with error");
    // if (error instanceof ZodError) {
    //   error = convertZodError(error);
    // }

    if (error instanceof ZodError) {
      error = new ValidationFailedError(convertZodError(error));
    }

    if (isAppError(error)) {
      console.error(error);
      console.error("ErrorHandler.handle() called with AppError");
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
