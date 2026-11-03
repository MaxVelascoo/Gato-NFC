import { isDashboardAuthorized } from "@/lib/dashboard-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  if (!isDashboardAuthorized(request)) return Response.json({ error: "No autorizado" }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "JSON inválido" }, { status: 400 }); }

  const input = body as Record<string, unknown>;
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const kind = typeof input.kind === "string" ? input.kind : "other";
  const interval = Number(input.interval_hours);
  if (!name || name.length > 100 || !["water", "food", "litter", "other"].includes(kind) || !Number.isInteger(interval) || interval < 1 || interval > 8760) {
    return Response.json({ error: "Revisa el nombre, el tipo y la frecuencia de la tarea." }, { status: 400 });
  }
  const code = `${kind}_${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
  const { data, error } = await getSupabaseAdmin().from("care_tasks").insert({ code, name, kind, interval_hours: interval })
    .select("id,code,name,kind,interval_hours,last_completed_at,last_completed_by,next_due_at").single();
  if (error) {
    console.error("Error creando tarea:", error);
    return Response.json({ error: "No se pudo guardar la tarea." }, { status: 500 });
  }
  return Response.json(data, { status: 201 });
}
