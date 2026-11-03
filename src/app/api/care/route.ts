import { isDashboardAuthorized } from "@/lib/dashboard-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  if (!isDashboardAuthorized(request)) return Response.json({ error: "No autorizado" }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "JSON inválido" }, { status: 400 }); }

  const input = body as Record<string, unknown>;
  const code = typeof input.code === "string" ? input.code : "";
  const actor = typeof input.actor === "string" ? input.actor.trim().slice(0, 80) : "";
  const amount = input.amount_grams == null || input.amount_grams === "" ? null : Number(input.amount_grams);
  if (!code || !actor || (amount !== null && (!Number.isInteger(amount) || amount <= 0))) {
    return Response.json({ error: "Indica la tarea, quién la hizo y una cantidad válida." }, { status: 400 });
  }

  const { data, error } = await getSupabaseAdmin().rpc("complete_care_task_with_details", {
    p_code: code,
    p_actor: actor,
    p_cat_id: typeof input.cat_id === "string" && input.cat_id ? input.cat_id : null,
    p_amount_grams: amount,
    p_note: typeof input.note === "string" ? input.note.trim().slice(0, 500) || null : null,
  });
  if (error) {
    console.error("Error registrando el cuidado:", error);
    return Response.json({ error: "No se pudo registrar el cuidado." }, { status: 500 });
  }
  return Response.json(data);
}
