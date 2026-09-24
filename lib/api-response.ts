import { NextResponse } from "next/server";

export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status = 500,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(
  message: string,
  status = 500,
  code?: string,
  details?: Record<string, unknown>,
) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code,
      ...(details ? { details } : {}),
    },
    { status },
  );
}

export function handleApiError(error: unknown) {
  if (error instanceof HttpError) {
    return apiError(error.message, error.status, error.code);
  }

  console.error(error);
  return apiError("Internal server error", 500, "INTERNAL_SERVER_ERROR");
}
