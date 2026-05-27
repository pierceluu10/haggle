import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, init?: ResponseInit): NextResponse<T> {
  return NextResponse.json(data, init);
}

export function badRequest(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        errors: error.issues.map((issue) => ({
          field: issue.path.join(".") || "form",
          message: issue.message
        }))
      },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { errors: [{ field: "form", message: error instanceof Error ? error.message : "Bad request" }] },
    { status: 400 }
  );
}

export function notFound(message: string): NextResponse {
  return NextResponse.json({ errors: [{ field: "form", message }] }, { status: 404 });
}

export function serverError(error: unknown): NextResponse {
  console.error(error);
  return NextResponse.json(
    {
      errors: [
        {
          field: "form",
          message: error instanceof Error ? error.message : "Something went wrong."
        }
      ]
    },
    { status: 500 }
  );
}
