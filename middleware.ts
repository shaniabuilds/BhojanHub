import { NextResponse, type NextRequest } from "next/server";
import { readSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";

const publicPaths = new Set(["/login", "/api/auth/login", "/api/auth/logout", "/api/auth/me", "/api/auth/setup"]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const user = await readSessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  if (pathname === "/login") {
    if (user) return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  }

  if (publicPaths.has(pathname)) return NextResponse.next();
  if (user) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
