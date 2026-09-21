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

export async function POST(request: Request) {
  let body: { email?: unknown; password?: unknown };
  try {
    body = (await request.json()) as { email?: unknown; password?: unknown };
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  if (
    typeof body.email !== "string" ||
    typeof body.password !== "string" ||
    !body.email.trim() ||
    !body.password
  ) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }

  await connectToDatabase();
  const user = await UserModel.findOne({
    email: body.email.trim().toLowerCase(),
  }).lean();
  if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    );
  }

  const sessionUser: SessionUser = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  };

  // Create the token ONCE and reuse it for both the browser cookie and the
  // JSON response — mobile apps can't rely on cookies, so they read the
  // token from the response body and send it back as an Authorization header.
  const token = await createSessionToken(sessionUser);

  const response = NextResponse.json({ user: sessionUser, token });
  response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions);
  return response;
}