import { isDashboardAuthorized } from "@/lib/dashboard-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  if (!isDashboardAuthorized(request)) return Response.json({ error: "No autorizado" }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "JSON inválido" }, { status: 400 }); }

  const input = body as Record<string, unknown>;
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const role = typeof input.role === "string" && input.role.trim() ? input.role.trim() : "miembro";
  if (!name || name.length > 80 || role.length > 40) {
    return Response.json({ error: "Indica un nombre válido y un rol de hasta 40 caracteres." }, { status: 400 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("household_members")
    .insert({ name, role })
    .select("id,name,role,created_at")
    .single();
  if (error) {
    const duplicate = error.code === "23505";
    return Response.json({ error: duplicate ? "Esa persona ya está en el hogar." : "No se pudo añadir a la persona." }, { status: duplicate ? 409 : 500 });
  }
  return Response.json(data, { status: 201 });
}

export async function DELETE(request: Request) {
  if (!isDashboardAuthorized(request)) return Response.json({ error: "No autorizado" }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "Falta el id de la persona." }, { status: 400 });

  const { error } = await getSupabaseAdmin().from("household_members").delete().eq("id", id);
  if (error) {
    console.error("Error quitando a la persona del hogar:", error);
    return Response.json({ error: "No se pudo quitar a la persona." }, { status: 500 });
  }
  return new Response(null, { status: 204 });
}
