import { hasDashboardPassword, isDashboardAuthorized, sessionCookie, clearedSessionCookie } from "@/lib/dashboard-auth";
import { timingSafeEqual } from "node:crypto";

function sameSecret(provided: string, expected: string) {
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function GET(request: Request) {
  return Response.json({
    authenticated: isDashboardAuthorized(request),
    passwordConfigured: hasDashboardPassword(),
  });
}

export async function POST(request: Request) {
  const expected = process.env.DASHBOARD_PASSWORD;
  if (!expected) {
    return Response.json({ error: "Configura DASHBOARD_PASSWORD para activar el acceso." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const password = typeof body === "object" && body !== null && "password" in body && typeof body.password === "string"
    ? body.password
    : "";
  if (!sameSecret(password, expected)) {
    return Response.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }

  return new Response(JSON.stringify({ authenticated: true }), {
    headers: { "Content-Type": "application/json", "Set-Cookie": sessionCookie() },
  });
}

export async function DELETE() {
  return new Response(null, { status: 204, headers: { "Set-Cookie": clearedSessionCookie() } });
}
