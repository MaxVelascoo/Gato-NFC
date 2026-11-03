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
    <main className="notifications-page">
      <section className="notifications-card">
        <div className="notifications-brand"><span aria-hidden="true">◉</span> MiauCare</div>
        <div>
          <h1>Notificaciones</h1>
          <p>Activa los avisos para recibir recordatorios de los cuidados de tus gatos.</p>
        </div>
        <label>
          Token de configuración
          <input
            type="password"
            placeholder="Introduce el token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
        </label>
        <button onClick={activarNotificaciones}>Activar notificaciones</button>
        <p className="notifications-status" role="status">{status}</p>
      </section>
    </main>
  );
}
