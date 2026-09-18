import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { UserModel } from "@/lib/db/models";
import { connectToDatabase } from "@/lib/db/mongodb";
import {
  createSessionToken,
  sessionCookieOptions,
  SESSION_COOKIE_NAME,
  type SessionUser,
} from "@/lib/auth/session";

export async function GET() {
  await connectToDatabase();
  return NextResponse.json({
    setupRequired: (await UserModel.estimatedDocumentCount()) === 0,
  });
}

export async function POST(request: Request) {
  let body: { name?: unknown; email?: unknown; password?: unknown };
  try {
    body = (await request.json()) as {
      name?: unknown;
      email?: unknown;
      password?: unknown;
    };
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  if (
    typeof body.name !== "string" ||
    body.name.trim().length < 2 ||
    typeof body.email !== "string" ||
    !/^\S+@\S+\.\S+$/.test(body.email.trim()) ||
    typeof body.password !== "string" ||
    body.password.length < 8
  ) {
    return NextResponse.json(
      {
        error:
          "Enter a name, valid email, and password of at least 8 characters.",
      },
      { status: 400 },
    );
  }

  await connectToDatabase();
  if ((await UserModel.estimatedDocumentCount()) > 0) {
    return NextResponse.json(
      { error: "Initial setup has already been completed." },
      { status: 403 },
    );
  }

  try {
    const user = await UserModel.create({
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      passwordHash: await bcrypt.hash(body.password, 12),
      role: "admin",
    });
    const sessionUser: SessionUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };
    const response = NextResponse.json({ user: sessionUser }, { status: 201 });
    response.cookies.set(
      SESSION_COOKIE_NAME,
      await createSessionToken(sessionUser),
      sessionCookieOptions,
    );
    return response;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === 11000) {
      return NextResponse.json(
        { error: "An account with that email already exists." },
        { status: 409 },
      );
    }
    throw error;
  }
}
