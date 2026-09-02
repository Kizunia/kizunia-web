import { AppError, type AppErrorOptions } from "./app-error";
import { ErrorCategory } from "./error-category";
import { HttpStatus } from "./http-status";

export type RateLimitErrorOptions =
    Omit<AppErrorOptions, "category" | "status"> & {
        status?: number;
        /** Seconds until the caller may retry, surfaced as `Retry-After`. */
        retryAfterSeconds?: number;
    };

/**
 * The caller has exceeded a request budget.
 *
 * Retryable by definition — the limit is a pacing signal, not a rejection of
 * the request itself.
 */
export class RateLimitError extends AppError {
    readonly retryAfterSeconds?: number;

    constructor(options: RateLimitErrorOptions) {
        super({
            ...options,
            status: options.status ?? HttpStatus.TOO_MANY_REQUESTS,
            category: ErrorCategory.RATE_LIMIT,
            retryable: options.retryable ?? true,
        });

        this.retryAfterSeconds = options.retryAfterSeconds;
    }
}
