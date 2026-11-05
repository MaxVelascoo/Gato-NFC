import { isDashboardAuthorized } from "@/lib/dashboard-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  if (!isDashboardAuthorized(request)) {
    return Response.json({ error: "Inicia sesión para ver los datos de tu hogar." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const [cats, tasks, events, inventory, members, weightLogs, reminders, documents, medicalRecords] = await Promise.all([
    supabase.from("cats").select("id,name,weight_kg,birthday,next_vaccine_on,avatar_emoji,sex,is_sterilized,daily_meals_goal,photo_url,photo_path,created_at").order("name"),
    supabase.from("care_tasks").select("id,code,name,kind,interval_hours,last_completed_at,last_completed_by,next_due_at,created_at").order("next_due_at", { ascending: true, nullsFirst: false }),
    supabase.from("care_events").select("id,task_id,actor,occurred_at,cat_id,amount_grams,note").order("occurred_at", { ascending: false }).limit(200),
    supabase.from("inventory_items").select("id,name,quantity,unit,low_stock_at,updated_at").order("name"),
    supabase.from("household_members").select("id,name,role,created_at").order("name"),
    supabase.from("cat_weight_logs").select("id,cat_id,weight_kg,measured_at,note").order("measured_at", { ascending: false }).limit(200),
    supabase.from("care_reminders").select("id,cat_id,title,category,due_on,notes,completed_at").is("completed_at", null).order("due_on").limit(100),
    supabase.from("cat_documents").select("id,cat_id,name,document_type,document_date,storage_path,created_at").order("created_at", { ascending: false }).limit(100),
    supabase.from("cat_medical_records").select("id,cat_id,title,record_type,recorded_on,clinic,notes,created_at").order("recorded_on", { ascending: false }).limit(100),
  ]);

  const failure = cats.error ?? tasks.error ?? events.error ?? inventory.error ?? members.error ?? weightLogs.error ?? reminders.error ?? documents.error ?? medicalRecords.error;
  if (failure) {
    console.error("Error cargando el panel:", failure);
    return Response.json({ error: "No se pudieron cargar los datos de Supabase. Aplica las migraciones de supabase/migrations." }, { status: 503 });
  }

  const [catsWithSignedPhotos, documentsWithSignedUrls] = await Promise.all([
    Promise.all((cats.data ?? []).map(async (cat) => {
      if (!cat.photo_path) return cat;
      const { data } = await supabase.storage.from("cat-photos").createSignedUrl(cat.photo_path, 86_400);
      return { ...cat, photo_url: data?.signedUrl ?? null };
    })),
    Promise.all((documents.data ?? []).map(async (document) => {
      const { data } = await supabase.storage.from("cat-documents").createSignedUrl(document.storage_path, 86_400);
      return { ...document, url: data?.signedUrl ?? "" };
    })),
  ]);

  return Response.json({
    cats: catsWithSignedPhotos,
    tasks: tasks.data,
    events: events.data,
    inventory: inventory.data,
    members: members.data,
    weightLogs: weightLogs.data,
    reminders: reminders.data,
    documents: documentsWithSignedUrls,
    medicalRecords: medicalRecords.data,
    serverTime: new Date().toISOString(),
  });
}
