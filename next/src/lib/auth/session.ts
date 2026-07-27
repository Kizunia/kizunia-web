import { auth } from "@/lib/auth";

import { AuthorizationCode, type AuthorizationActor } from "@/authorization";
import type { NextRequest } from "next/server";
import { AuthenticationError } from "../errors";
import { headers } from "next/headers";

export class SessionService {
  /**
   * Used by API Routes.
   */
  static async getActor(request: NextRequest): Promise<AuthorizationActor>;

  /**
   * Used by Server Components, Server Actions and other server-side code.
   */
  static async getActor(): Promise<AuthorizationActor>;

  static async getActor(
    request?: NextRequest,
  ): Promise<AuthorizationActor> {
    const requestHeaders = request
      ? request.headers
      : await headers();

    const session = await auth.api.getSession({
      headers: requestHeaders,
    });

    if (!session?.user) {
      throw new AuthenticationError({
        status: 401,
        message: "User is not authenticated.",
        code: "UNAUTHORIZED",
      });
    }

    return {
      id: session.user.id,
      role: session.user.role,
      banned: session.user.banned,
    };
  }

  /**
   * Used by API Routes.
   */
  static async getOptionalActor(
    request: NextRequest,
  ): Promise<AuthorizationActor | null>;

  /**
   * Used by Server Components.
   */
  static async getOptionalActor(): Promise<AuthorizationActor | null>;

  static async getOptionalActor(
    request?: NextRequest,
  ): Promise<AuthorizationActor | null> {
    const requestHeaders = request
      ? request.headers
      : await headers();

    const session = await auth.api.getSession({
      headers: requestHeaders,
    });

    if (!session?.user) {
      return null;
    }

    return {
      id: session.user.id,
      role: session.user.role,
      banned: session.user.banned,
    };
  }
}