import { isDashboardAuthorized } from "@/lib/dashboard-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type CatInput = {
  name?: unknown;
  weight_kg?: unknown;
  birthday?: unknown;
  next_vaccine_on?: unknown;
  sex?: unknown;
  is_sterilized?: unknown;
  daily_meals_goal?: unknown;
  avatar_emoji?: unknown;
};

function parseCat(input: CatInput) {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const weight = input.weight_kg === "" || input.weight_kg == null ? null : Number(input.weight_kg);
  const dailyMealsGoal = input.daily_meals_goal === "" || input.daily_meals_goal == null ? null : Number(input.daily_meals_goal);
  const sex = input.sex === "" || input.sex == null ? null : input.sex;
  const birthday = input.birthday === "" || input.birthday == null ? null : input.birthday;
  const nextVaccineOn = input.next_vaccine_on === "" || input.next_vaccine_on == null ? null : input.next_vaccine_on;
  const sterilized = input.is_sterilized === "" || input.is_sterilized == null ? null : input.is_sterilized;

  if (!name || name.length > 80) return { error: "El nombre es obligatorio y debe tener hasta 80 caracteres." };
  if (weight !== null && (!Number.isFinite(weight) || weight <= 0 || weight > 100)) return { error: "Indica un peso válido en kilogramos." };
  if (dailyMealsGoal !== null && (!Number.isInteger(dailyMealsGoal) || dailyMealsGoal < 1 || dailyMealsGoal > 12)) return { error: "El objetivo de comidas debe estar entre 1 y 12." };
  if (sex !== null && !["male", "female", "unknown"].includes(String(sex))) return { error: "Selecciona un sexo válido." };
  if (sterilized !== null && typeof sterilized !== "boolean") return { error: "El dato de esterilización no es válido." };
  for (const date of [birthday, nextVaccineOn]) {
    if (date !== null && (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T12:00:00Z`)))) {
      return { error: "Revisa las fechas del perfil." };
    }
  }

  return {
    data: {
      name,
      weight_kg: weight,
      birthday,
      next_vaccine_on: nextVaccineOn,
      sex,
      is_sterilized: sterilized,
      daily_meals_goal: dailyMealsGoal,
      avatar_emoji: typeof input.avatar_emoji === "string" && input.avatar_emoji.trim() ? input.avatar_emoji.trim().slice(0, 12) : "🐈",
    },
  };
}

async function syncWeightAndVaccine(cat: { id: string; weight_kg: number | null; next_vaccine_on: string | null }, previous: { weight_kg: number | null; next_vaccine_on: string | null } | null) {
  const supabase = getSupabaseAdmin();
  if (cat.weight_kg !== null && cat.weight_kg !== previous?.weight_kg) {
    const { error } = await supabase.from("cat_weight_logs").insert({ cat_id: cat.id, weight_kg: cat.weight_kg, note: previous ? "Peso actualizado desde la ficha" : "Peso inicial" });
    if (error) console.error("No se pudo guardar el peso inicial:", error);
  }

  if (cat.next_vaccine_on) {
    const { error } = await supabase.from("care_reminders").upsert({ cat_id: cat.id, title: "Vacuna", category: "vaccine", due_on: cat.next_vaccine_on }, { onConflict: "cat_id,title,due_on" });
    if (error) console.error("No se pudo crear el recordatorio de vacuna:", error);
  } else if (previous?.next_vaccine_on) {
    const { error } = await supabase.from("care_reminders").delete().eq("cat_id", cat.id).eq("title", "Vacuna").eq("due_on", previous.next_vaccine_on).is("completed_at", null);
    if (error) console.error("No se pudo actualizar el recordatorio de vacuna:", error);
  }
}

const catSelection = "id,name,weight_kg,birthday,next_vaccine_on,avatar_emoji,sex,is_sterilized,daily_meals_goal,photo_url,created_at";

export async function POST(request: Request) {
  if (!isDashboardAuthorized(request)) return Response.json({ error: "No autorizado" }, { status: 401 });
  let body: CatInput;
  try { body = await request.json() as CatInput; } catch { return Response.json({ error: "JSON inválido" }, { status: 400 }); }
  const parsed = parseCat(body);
  if ("error" in parsed) return Response.json({ error: parsed.error }, { status: 400 });

  const { data, error } = await getSupabaseAdmin().from("cats").insert(parsed.data).select(catSelection).single();
  if (error) {
    console.error("Error creando gato:", error);
    return Response.json({ error: "No se pudo guardar el gato." }, { status: 500 });
  }
  await syncWeightAndVaccine(data, null);
  return Response.json(data, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!isDashboardAuthorized(request)) return Response.json({ error: "No autorizado" }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "Falta el id del gato." }, { status: 400 });
  let body: CatInput;
  try { body = await request.json() as CatInput; } catch { return Response.json({ error: "JSON inválido" }, { status: 400 }); }
  const parsed = parseCat(body);
  if ("error" in parsed) return Response.json({ error: parsed.error }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: previous, error: readError } = await supabase.from("cats").select("weight_kg,next_vaccine_on").eq("id", id).single();
  if (readError) return Response.json({ error: "No se encontró el gato." }, { status: 404 });

  const { data, error } = await supabase.from("cats").update(parsed.data).eq("id", id).select(catSelection).single();
  if (error) {
    console.error("Error actualizando gato:", error);
    return Response.json({ error: "No se pudo actualizar la ficha." }, { status: 500 });
  }
  await syncWeightAndVaccine(data, previous);
  return Response.json(data);
}

export async function DELETE(request: Request) {
  if (!isDashboardAuthorized(request)) return Response.json({ error: "No autorizado" }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "Falta el id del gato." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  for (const bucket of ["cat-photos", "cat-documents"]) {
    const { data: files } = await supabase.storage.from(bucket).list(id);
    if (files?.length) await supabase.storage.from(bucket).remove(files.map((file) => `${id}/${file.name}`));
  }
  const { error } = await supabase.from("cats").delete().eq("id", id);
  if (error) {
    console.error("Error eliminando gato:", error);
    return Response.json({ error: "No se pudo eliminar el gato." }, { status: 500 });
  }
  return new Response(null, { status: 204 });
}
