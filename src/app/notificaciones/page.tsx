"use client";

import { useState } from "react";

function base64ToArrayBuffer(value: string): ArrayBuffer {
  const base64 = value
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const padded = base64.padEnd(
    Math.ceil(base64.length / 4) * 4,
    "="
  );

  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes.buffer;
}

export default function NotificacionesPage() {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState("");

  async function activarNotificaciones() {
    try {
      if (
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        setStatus(
          "Abre la web desde el icono de la pantalla de inicio."
        );
        return;
      }

      const permission =
        await Notification.requestPermission();

      if (permission !== "granted") {
        setStatus("Permiso de notificaciones denegado");
        return;
      }

      const registration =
        await navigator.serviceWorker.register("/sw.js");

      await navigator.serviceWorker.ready;

      let subscription =
        await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription =
          await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: base64ToArrayBuffer(
              process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
            ),
          });
      }

      const response = await fetch("/api/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "subscribe",
          subscription: subscription.toJSON(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      setStatus("✅ Notificaciones activadas");
    } catch (error) {
      setStatus(`Error: ${String(error)}`);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 p-6">
      <h1 className="text-3xl font-bold">
        🐱 Gato NFC
      </h1>

      <p className="text-center text-gray-600">
        Activa las notificaciones para recibir
        recordatorios de los cuidados.
      </p>

      <input
        type="password"
        placeholder="Token de configuración"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        className="rounded-lg border p-3"
      />

      <button
        onClick={activarNotificaciones}
        className="rounded-xl bg-green-600 px-6 py-3 font-semibold text-white"
      >
        🔔 Activar notificaciones
      </button>

      <p>{status}</p>
    </main>
  );
}