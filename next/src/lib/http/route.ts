import { ErrorHandler } from "@/lib/errors";

import { NextResponse } from "next/server";

export class Route {
    static async execute(
        handler: () => Promise<NextResponse>,
    ): Promise<NextResponse> {
        try {
            return await handler();
        } catch (error) {
            return ErrorHandler.handle(error);
        }
    }
}