import { NextResponse } from "next/server";
import { generateCsrfToken, buildCsrfSetCookie } from "@/lib/csrf";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = generateCsrfToken();

  const response = NextResponse.json({ success: true, data: { token } });
  response.headers.set("Set-Cookie", buildCsrfSetCookie(token));

  return response;
}
