import { randomUUID } from "node:crypto";
import { isDashboardAuthorized } from "@/lib/dashboard-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const allowedTypes: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };

export async function POST(request: Request) {
  if (!isDashboardAuthorized(request)) return Response.json({ error: "No autorizado" }, { status: 401 });
  const form = await request.formData();
  const catId = form.get("cat_id");
  const file = form.get("photo");
  if (typeof catId !== "string" || !(file instanceof File)) return Response.json({ error: "Falta el gato o la foto." }, { status: 400 });
  if (!allowedTypes[file.type]) return Response.json({ error: "Usa una foto JPG, PNG, WebP o AVIF." }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return Response.json({ error: "La foto debe pesar menos de 5 MB." }, { status: 413 });

  const supabase = getSupabaseAdmin();
  const path = `${catId}/${randomUUID()}.${allowedTypes[file.type]}`;
  const { error: uploadError } = await supabase.storage.from("cat-photos").upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) {
    console.error("Error subiendo foto:", uploadError);
    return Response.json({ error: "No se pudo subir la foto." }, { status: 500 });
  }

  const { error: updateError } = await supabase.from("cats").update({ photo_path: path, photo_url: null }).eq("id", catId);
  if (updateError) {
    await supabase.storage.from("cat-photos").remove([path]);
    console.error("Error guardando la foto del perfil:", updateError);
    return Response.json({ error: "La foto se subió, pero no se pudo asociar al gato." }, { status: 500 });
  }
  const { data: signedData, error: signedError } = await supabase.storage.from("cat-photos").createSignedUrl(path, 86_400);
  if (signedError) return Response.json({ error: "La foto se guardó, pero no se pudo preparar su vista." }, { status: 500 });
  return Response.json({ photo_url: signedData.signedUrl });
}
