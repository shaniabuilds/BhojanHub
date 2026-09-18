import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { readSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function GET() {
  const user = await readSessionToken(
    cookies().get(SESSION_COOKIE_NAME)?.value,
  );
  if (!user)
    return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
  return NextResponse.json({ user });
}
