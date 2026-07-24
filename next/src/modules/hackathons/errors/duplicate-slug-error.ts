import { ConflictError } from "@/lib/errors";
import { HttpStatus } from "@/lib/errors";

import { HackathonErrorCode } from "./error-code";

export class DuplicateSlugError extends ConflictError {
    constructor(slug: string) {
        super({
            code: HackathonErrorCode.DUPLICATE_SLUG,
            status: HttpStatus.CONFLICT,
            message: `Hackathon slug "${slug}" already exists.`,
            details: {
                slug,
            },
        });
    }
}