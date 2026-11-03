import { randomUUID } from "node:crypto";
import { isDashboardAuthorized } from "@/lib/dashboard-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const allowedTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  if (!isDashboardAuthorized(request)) return Response.json({ error: "No autorizado" }, { status: 401 });
  const form = await request.formData();
  const catId = form.get("cat_id");
  const file = form.get("document");
  const documentType = form.get("document_type");
  const documentDate = form.get("document_date");
  if (typeof catId !== "string" || !(file instanceof File)) return Response.json({ error: "Selecciona el gato y un archivo." }, { status: 400 });
  if (!allowedTypes.has(file.type)) return Response.json({ error: "El documento debe ser PDF, JPG, PNG o WebP." }, { status: 400 });
  if (file.size > 15 * 1024 * 1024) return Response.json({ error: "El documento debe pesar menos de 15 MB." }, { status: 413 });
  const allowedDocumentTypes = ["veterinary", "vaccination", "lab", "other"];
  const type = typeof documentType === "string" && allowedDocumentTypes.includes(documentType) ? documentType : "veterinary";
  const date = typeof documentDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(documentDate) ? documentDate : null;

  const supabase = getSupabaseAdmin();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || "documento";
  const path = `${catId}/${randomUUID()}-${safeName}`;
  const { error: uploadError } = await supabase.storage.from("cat-documents").upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) {
    console.error("Error subiendo documento:", uploadError);
    return Response.json({ error: "No se pudo subir el documento." }, { status: 500 });
  }
  const { data, error } = await supabase.from("cat_documents").insert({ cat_id: catId, name: file.name.slice(0, 160), document_type: type, document_date: date, storage_path: path })
    .select("id,cat_id,name,document_type,document_date,storage_path,created_at").single();
  if (error) {
    await supabase.storage.from("cat-documents").remove([path]);
    console.error("Error guardando documento:", error);
    return Response.json({ error: "No se pudo guardar el documento." }, { status: 500 });
  }
  const { data: signedData, error: signedError } = await supabase.storage.from("cat-documents").createSignedUrl(path, 86_400);
  if (signedError) return Response.json({ error: "El documento se guardó, pero no se pudo preparar el enlace." }, { status: 500 });
  return Response.json({ ...data, url: signedData.signedUrl }, { status: 201 });
}
