import { isDashboardAuthorized } from "@/lib/dashboard-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  if (!isDashboardAuthorized(request)) return Response.json({ error: "No autorizado" }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "JSON inválido" }, { status: 400 }); }

  const input = body as Record<string, unknown>;
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const quantity = Number(input.quantity);
  const lowStockAt = Number(input.low_stock_at ?? 1);
  const unit = typeof input.unit === "string" ? input.unit.trim() : "unidades";
  if (!name || name.length > 100 || !Number.isFinite(quantity) || quantity < 0 || !Number.isFinite(lowStockAt) || lowStockAt < 0 || !unit || unit.length > 30) {
    return Response.json({ error: "Revisa el nombre, la cantidad y la unidad." }, { status: 400 });
  }
  const { data, error } = await getSupabaseAdmin().from("inventory_items").insert({ name, quantity, low_stock_at: lowStockAt, unit })
    .select("id,name,quantity,unit,low_stock_at,updated_at").single();
  if (error) {
    console.error("Error guardando el inventario:", error);
    return Response.json({ error: "No se pudo guardar el producto." }, { status: 500 });
  }
  return Response.json(data, { status: 201 });
}
