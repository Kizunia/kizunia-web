import { auth } from "@/lib/auth";
import { UnauthorizedError } from "@/lib/errors";
import { v2 as cloudinary } from "cloudinary";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    const KEY = process.env.CLOUDINARY_API_SECRET;
    if (!KEY) {
      console.error("CLOUDINARY_API_KEY is not defined");
      throw new Error("CLOUDINARY_API_KEY is not defined");
    }
    const session = await auth.api.getSession({
      headers: await headers(), // you need to pass the headers object.
    });

    if (!session) {
      throw new UnauthorizedError({
        code: "UNAUTHORIZED",
        message: "User is not authenticated",
      });
    }
    const body = await request.json();
    const { paramsToSign } = body;

    const signature = cloudinary.utils.api_sign_request(paramsToSign, KEY);

    return Response.json({ signature });
  } catch (error) {
    console.log(error);
  }
}
