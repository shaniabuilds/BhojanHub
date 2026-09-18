export const SESSION_COOKIE_NAME = "bhojanhub_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

export type UserRole = "admin" | "manager" | "staff";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface SessionPayload extends SessionUser {
  exp: number;
}

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("Missing or insecure AUTH_SECRET. Use a random value with at least 32 characters.");
  }
  return secret;
}

function toBase64Url(value: Uint8Array) {
  let binary = "";
  value.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function signingKey() {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function sign(value: string) {
  const signature = await crypto.subtle.sign("HMAC", await signingKey(), new TextEncoder().encode(value));
  return toBase64Url(new Uint8Array(signature));
}

export async function createSessionToken(user: SessionUser) {
  const payload: SessionPayload = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS,
  };
  const encodedPayload = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  return `${encodedPayload}.${await sign(encodedPayload)}`;
}

export async function readSessionToken(token?: string | null): Promise<SessionUser | null> {
  if (!token) return null;

  const [encodedPayload, encodedSignature, ...extra] = token.split(".");
  if (!encodedPayload || !encodedSignature || extra.length > 0) return null;

  try {
    const valid = await crypto.subtle.verify(
      "HMAC",
      await signingKey(),
      fromBase64Url(encodedSignature),
      new TextEncoder().encode(encodedPayload),
    );
    if (!valid) return null;

    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(encodedPayload))) as Partial<SessionPayload>;
    if (
      typeof payload.id !== "string" ||
      typeof payload.name !== "string" ||
      typeof payload.email !== "string" ||
      !["admin", "manager", "staff"].includes(payload.role ?? "") ||
      typeof payload.exp !== "number" ||
      payload.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return { id: payload.id, name: payload.name, email: payload.email, role: payload.role as UserRole };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_DURATION_SECONDS,
};
