import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "miaucare_session";
const SESSION_SECONDS = 60 * 60 * 24 * 7;

function signature(timestamp: string) {
  return createHmac("sha256", process.env.SUPABASE_SECRET_KEY ?? "")
    .update(timestamp)
    .digest("base64url");
}

export function hasDashboardPassword() {
  return Boolean(process.env.DASHBOARD_PASSWORD);
}

export function isDashboardAuthorized(request: Request) {
  if (!hasDashboardPassword()) return process.env.NODE_ENV !== "production";

  const cookie = request.headers.get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);
  if (!cookie) return false;

  const [timestamp, providedSignature] = cookie.split(".");
  if (!timestamp || !providedSignature || !/^\d+$/.test(timestamp)) return false;
  const issuedAt = Number(timestamp);
  const now = Math.floor(Date.now() / 1000);
  if (issuedAt > now || now - issuedAt > SESSION_SECONDS) return false;

  const expected = Buffer.from(signature(timestamp));
  const provided = Buffer.from(providedSignature);
  return expected.length === provided.length && timingSafeEqual(expected, provided);
}

export function sessionCookie(timestamp = String(Math.floor(Date.now() / 1000))) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${timestamp}.${signature(timestamp)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_SECONDS}${secure}`;
}

export function clearedSessionCookie() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`;
}
