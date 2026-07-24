import { NotFoundError } from "@/lib/errors";

import { HackathonErrorCode } from "./error-code";

export class HackathonNotFoundError extends NotFoundError {
    constructor(message = "Hackathon not found.") {
        super({
            code: HackathonErrorCode.NOT_FOUND,
            message,
        });
    }
}