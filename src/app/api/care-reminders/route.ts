import { isDashboardAuthorized } from "@/lib/dashboard-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const categories = ["vaccine", "deworming", "weight", "other"];

export async function POST(request: Request) {
  if (!isDashboardAuthorized(request)) return Response.json({ error: "No autorizado" }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return Response.json({ error: "JSON inválido" }, { status: 400 }); }
  const catId = typeof body.cat_id === "string" ? body.cat_id : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const category = typeof body.category === "string" ? body.category : "other";
  const dueOn = typeof body.due_on === "string" ? body.due_on : "";
  const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 500) || null : null;
  if (!catId || !title || title.length > 120 || !categories.includes(category) || !/^\d{4}-\d{2}-\d{2}$/.test(dueOn)) {
    return Response.json({ error: "Revisa el gato, el nombre y la fecha del cuidado." }, { status: 400 });
  }
  const { data, error } = await getSupabaseAdmin().from("care_reminders").insert({ cat_id: catId, title, category, due_on: dueOn, notes }).select("id,cat_id,title,category,due_on,notes,completed_at").single();
  if (error) {
    console.error("Error guardando cuidado:", error);
    return Response.json({ error: "No se pudo guardar el cuidado." }, { status: 500 });
  }
  return Response.json(data, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!isDashboardAuthorized(request)) return Response.json({ error: "No autorizado" }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "Falta el id del cuidado." }, { status: 400 });
  const { error } = await getSupabaseAdmin().from("care_reminders").update({ completed_at: new Date().toISOString() }).eq("id", id);
  if (error) {
    console.error("Error completando cuidado:", error);
    return Response.json({ error: "No se pudo completar el cuidado." }, { status: 500 });
  }
  return Response.json({ success: true });
}
