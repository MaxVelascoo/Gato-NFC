import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  {
    auth: {
      persistSession: false,
    },
  }
);

export async function POST(request: Request) {
  const expectedToken = process.env.NFC_API_TOKEN;

  if (
    !expectedToken ||
    request.headers.get("authorization") !==
      `Bearer ${expectedToken}`
  ) {
    return Response.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "JSON inválido" },
      { status: 400 }
    );
  }

  const task =
    typeof body === "object" && body !== null &&
    "task" in body
      ? body.task
      : undefined;

  if (
    typeof task !== "string" ||
    !["agua", "comida", "arenero"].includes(task)
  ) {
    return Response.json(
      { error: "Tarea no válida" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase.rpc(
    "complete_care_task",
    {
      p_code: task,
      p_actor: "Max",
    }
  );

  if (error) {
    console.error("Error registrando tarea:", error);

    return Response.json(
      { error: "No se pudo registrar la tarea" },
      { status: 500 }
    );
  }

  return Response.json(data);
}