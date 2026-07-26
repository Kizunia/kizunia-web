import { SuccessResponse } from ".";
export class HttpClient {
  // private static async getBaseUrl() {
  //   if (typeof window !== "undefined") {
  //     return "";
  //   }

  //   const h = await headers();

  //   const protocol =
  //     process.env.NODE_ENV === "development"
  //       ? "http"
  //       : "https";

  //   const host = h.get("host");

  //   return `${protocol}://${host}`;
  // }

  static async patch<TResponse, TBody>(
    url: string,
    body: TBody,
    init?: RequestInit,
  ): Promise<SuccessResponse<TResponse>> {
    const response = await fetch(url, {
      method: "PATCH",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
      ...init,
    });
    const responseData = await response.json();
    if (!response.ok) {
      console.error("Request failed:", responseData.toString());
      throw new Error("Request failed.");
    }

    return response.json();
  }

  static async get<T>(
    url: string,
    init?: RequestInit,
  ): Promise<SuccessResponse<T>> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL!;

    const response = await fetch(`${baseUrl}${url}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });

    if (!response.ok) {
      throw new Error("Request failed.");
    }

    return response.json();
  }

  static async post<TResponse, TBody>(
    url: string,
    body: TBody,
    init?: RequestInit,
  ): Promise<SuccessResponse<TResponse>> {
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
      ...init,
    });

    if (!response.ok) {
      throw new Error("Request failed.");
    }

    return response.json();
  }
}
