import { isDashboardAuthorized } from "@/lib/dashboard-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const recordTypes = ["visit", "diagnosis", "treatment", "vaccination", "other"];

export async function POST(request: Request) {
  if (!isDashboardAuthorized(request)) return Response.json({ error: "No autorizado" }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return Response.json({ error: "JSON inválido" }, { status: 400 }); }
  const catId = typeof body.cat_id === "string" ? body.cat_id : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const recordType = typeof body.record_type === "string" ? body.record_type : "visit";
  const recordedOn = typeof body.recorded_on === "string" && body.recorded_on ? body.recorded_on : new Date().toISOString().slice(0, 10);
  const clinic = typeof body.clinic === "string" ? body.clinic.trim().slice(0, 120) || null : null;
  const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 1000) || null : null;
  if (!catId || !title || title.length > 120 || !recordTypes.includes(recordType) || !/^\d{4}-\d{2}-\d{2}$/.test(recordedOn)) {
    return Response.json({ error: "Revisa el gato, el título y la fecha del registro." }, { status: 400 });
  }
  const { data, error } = await getSupabaseAdmin().from("cat_medical_records").insert({ cat_id: catId, title, record_type: recordType, recorded_on: recordedOn, clinic, notes })
    .select("id,cat_id,title,record_type,recorded_on,clinic,notes,created_at").single();
  if (error) {
    console.error("Error guardando historial médico:", error);
    return Response.json({ error: "No se pudo guardar el registro médico." }, { status: 500 });
  }
  return Response.json(data, { status: 201 });
}
