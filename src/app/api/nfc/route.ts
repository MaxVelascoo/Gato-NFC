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

  const { task } = await request.json();

  const validTasks = ["comida", "agua", "arenero"];

  if (!validTasks.includes(task)) {
    return Response.json(
      { error: "Tarea no válida" },
      { status: 400 }
    );
  }

  return Response.json({
    success: true,
    task,
    timestamp: new Date().toISOString(),
  });
}