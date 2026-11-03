import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

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

type StoredSubscription = {
  endpoint: string;
  p256dh: string;
  auth_key: string;
};

type ClaimedNotification = {
  id: string;
  task_id: string;
  task_name: string;
  task_kind: string;
  interval_hours: number;
  due_at: string;
  claim_token: string;
};

function configureWebPush() {
  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!subject || !publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

async function dispatchDueNotifications() {
  if (!configureWebPush()) {
    return Response.json({ error: "Falta configurar Web Push en el servidor." }, { status: 503 });
  }

  const { data: subscriptions, error: subscriptionError } = await supabase
    .from("push_subscriptions")
    .select("endpoint,p256dh,auth_key");
  if (subscriptionError) {
    console.error("Error consultando suscripciones push:", subscriptionError);
    return Response.json({ error: "No se pudieron consultar los móviles suscritos." }, { status: 500 });
  }

  const { data: enqueued, error: enqueueError } = await supabase.rpc("enqueue_due_push_notifications");
  if (enqueueError) {
    console.error("Error preparando notificaciones de cuidados:", enqueueError);
    return Response.json({ error: "No se pudieron calcular las rutinas vencidas." }, { status: 500 });
  }

  if (!subscriptions?.length) {
    return Response.json({ enqueued, attempted: 0, sent: 0, waitingForSubscriptions: true });
  }

  const { data: notifications, error: claimError } = await supabase.rpc("claim_due_push_notifications", { p_limit: 50 });
  if (claimError) {
    console.error("Error reservando notificaciones push:", claimError);
    return Response.json({ error: "No se pudieron reservar las notificaciones." }, { status: 500 });
  }

  let sent = 0;
  let failed = 0;
  const storedSubscriptions = subscriptions as StoredSubscription[];

  for (const notification of (notifications ?? []) as ClaimedNotification[]) {
    const payload = JSON.stringify({
      title: `Cuidados de hoy · ${notification.task_name}`,
      body: `Toca registrar ${notification.task_name}; han pasado ${notification.interval_hours} h desde el último cuidado.`,
      url: "/",
    });

    const results = await Promise.allSettled(storedSubscriptions.map((item) =>
      webpush.sendNotification({
        endpoint: item.endpoint,
        keys: { p256dh: item.p256dh, auth: item.auth_key },
      }, payload)
    ));

    const delivered = results.filter((result) => result.status === "fulfilled").length;
    const expiredEndpoints = results.flatMap((result, index) => {
      if (result.status !== "rejected") return [];
      const statusCode = (result.reason as { statusCode?: number })?.statusCode;
      return statusCode === 404 || statusCode === 410 ? [storedSubscriptions[index].endpoint] : [];
    });
    if (expiredEndpoints.length) {
      const { error } = await supabase.from("push_subscriptions").delete().in("endpoint", expiredEndpoints);
      if (error) console.error("No se pudieron retirar suscripciones push caducadas:", error);
    }

    const failureMessages = results.flatMap((result) => result.status === "rejected" ? [String(result.reason)] : []);
    const { error: finishError } = await supabase.rpc("finish_push_notification", {
      p_id: notification.id,
      p_claim_token: notification.claim_token,
      p_sent: delivered > 0,
      p_error: failureMessages.slice(0, 3).join("; ").slice(0, 1000) || null,
    });
    if (finishError) {
      console.error("No se pudo cerrar el intento de notificación:", finishError);
      failed++;
    } else if (delivered > 0) {
      sent++;
    } else {
      failed++;
    }
  }

  return Response.json({ enqueued, attempted: notifications?.length ?? 0, sent, failed });
}

export async function POST(request: Request) {
  let body;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "JSON inválido" },
      { status: 400 }
    );
  }

  const expectedToken = process.env.PUSH_SETUP_TOKEN;
  if (!expectedToken || request.headers.get("authorization") !== `Bearer ${expectedToken}`) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  if (body.action === "dispatch_due") return dispatchDueNotifications();

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

    if (!configureWebPush()) return Response.json({ error: "Falta configurar Web Push en el servidor." }, { status: 503 });

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
