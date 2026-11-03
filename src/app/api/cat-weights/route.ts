import { isDashboardAuthorized } from "@/lib/dashboard-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  if (!isDashboardAuthorized(request)) return Response.json({ error: "No autorizado" }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return Response.json({ error: "JSON inválido" }, { status: 400 }); }
  const catId = typeof body.cat_id === "string" ? body.cat_id : "";
  const weight = Number(body.weight_kg);
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 250) || null : null;
  if (!catId || !Number.isFinite(weight) || weight <= 0 || weight > 100) return Response.json({ error: "Indica un peso válido." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const [{ data, error }, update] = await Promise.all([
    supabase.from("cat_weight_logs").insert({ cat_id: catId, weight_kg: weight, note }).select("id,cat_id,weight_kg,measured_at,note").single(),
    supabase.from("cats").update({ weight_kg: weight }).eq("id", catId),
  ]);
  if (error || update.error) {
    console.error("Error guardando peso:", error ?? update.error);
    return Response.json({ error: "No se pudo guardar el peso." }, { status: 500 });
  }
  return Response.json(data, { status: 201 });
}
