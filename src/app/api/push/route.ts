import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

type Subscription = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export async function POST(request: Request) {
  const expectedToken = process.env.PUSH_SETUP_TOKEN;

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

  let body;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "JSON inválido" },
      { status: 400 }
    );
  }

  // Guardar una suscripción
  if (body.action === "subscribe") {
    const subscription = body.subscription as Subscription;

    if (
      !subscription?.endpoint ||
      !subscription.keys?.p256dh ||
      !subscription.keys?.auth ||
      !subscription.endpoint.startsWith("https://")
    ) {
      return Response.json(
        { error: "Suscripción inválida" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("push_subscriptions")
      .upsert({
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth_key: subscription.keys.auth,
      });

    if (error) {
      console.error(error);
      return Response.json(
        { error: "Error guardando suscripción" },
        { status: 500 }
      );
    }

    return Response.json({ success: true });
  }

  // Enviar notificación de prueba
  if (body.action === "test") {
    const { data, error } = await supabase
      .from("push_subscriptions")
      .select("*");

    if (error) {
      return Response.json(
        { error: "Error consultando suscripciones" },
        { status: 500 }
      );
    }

    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT!,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );

    const results = await Promise.allSettled(
      (data || []).map((item) =>
        webpush.sendNotification(
          {
            endpoint: item.endpoint,
            keys: {
              p256dh: item.p256dh,
              auth: item.auth_key,
            },
          },
          JSON.stringify({
            title: "🐱 Gato NFC",
            body: "¡Las notificaciones funcionan!",
            url: "/notificaciones",
          })
        )
      )
    );

    const sent = results.filter(
      (result) => result.status === "fulfilled"
    ).length;

    return Response.json({
      total: results.length,
      sent,
      failed: results.length - sent,
    });
  }

  return Response.json(
    { error: "Acción desconocida" },
    { status: 400 }
  );
}