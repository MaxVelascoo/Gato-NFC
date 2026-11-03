"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import CatsOverview from "@/components/cats-overview";
import type { CatCardData, CatCareReminder } from "@/components/cats-overview";

type IconName =
  | "home"
  | "cats"
  | "calendar"
  | "clock"
  | "chart"
  | "box"
  | "nfc"
  | "settings"
  | "water"
  | "food"
  | "litter"
  | "check"
  | "sync"
  | "bell"
  | "arrow"
  | "vaccine"
  | "warning"
  | "list"
  | "plus"
  | "users";

function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  const paths: Record<IconName, ReactNode> = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-7h6v7" /></>,
    cats: <><path d="M4 10 3 4l5 3a11 11 0 0 1 8 0l5-3-1 7a9 9 0 1 1-16 0Z" /><path d="M9 12h.01M15 12h.01M9 16c1.8 1.4 4.2 1.4 6 0" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    chart: <><path d="M4 20v-6M10 20V9M16 20V4M22 20V12" /></>,
    box: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 8 9 5 9-5M3 8v9l9 5 9-5V8M12 13v9" /></>,
    nfc: <><path d="M5 9a5 5 0 0 0 0 6M9 6a9 9 0 0 0 0 12M13 3a13 13 0 0 0 0 18" /><circle cx="18" cy="12" r="2" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.6.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.6-.9l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.9l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.6-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.6.9l1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1 0 1.8Z" transform="translate(-1 -2)" /></>,
    water: <><path d="M12 3s-7 7.2-7 12a7 7 0 0 0 14 0c0-4.8-7-12-7-12Z" /><path d="M9 16a3 3 0 0 0 3 3" /></>,
    food: <><path d="M3 11c0-4 4-7 9-7s9 3 9 7v2c0 2-1.5 3-3 3H6c-1.5 0-3-1-3-3v-2Z" /><path d="M4 11h16M7 7l1 2m8-2-1 2" /></>,
    litter: <><path d="m14 4 6 6M13 5 4 14l-1 7 7-1 9-9" /><path d="m8 18-3-3" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    sync: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.6 9A7 7 0 0 1 18 6l2 2M4 16l2 2a7 7 0 0 0 12.4-3" /></>,
    bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    vaccine: <><path d="m14 4 6 6M12 6l6 6M4 20l8-8M8 16l-3-3M10 18l-3-3M17 3l4 4" /><path d="m3 21 2-1" /></>,
    warning: <><path d="M10.3 4.3 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4m0 4h.01" /></>,
    list: <><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM20 8v6m3-3h-6" /></>,
  };

  return <svg {...common}>{paths[name]}</svg>;
}

const navigation: { label: string; icon: IconName; target: string }[] = [
  { label: "Inicio", icon: "home", target: "inicio" },
  { label: "Mis gatos", icon: "cats", target: "cats" },
  { label: "Calendario", icon: "calendar", target: "tasks" },
  { label: "Historial", icon: "clock", target: "activity" },
  { label: "Estadísticas", icon: "chart", target: "stats" },
  { label: "Inventario", icon: "box", target: "inventory" },
];

type Cat = { id: string; name: string; weight_kg: number | null; birthday: string | null; next_vaccine_on: string | null; avatar_emoji: string; sex: "male" | "female" | "unknown" | null; is_sterilized: boolean | null; daily_meals_goal: number | null; photo_url: string | null };
type HouseholdMember = { id: string; name: string; role: string; created_at: string };
type CareTask = { id: string; code: string; name: string; kind: "water" | "food" | "litter" | "other"; interval_hours: number; last_completed_at: string | null; last_completed_by: string | null; next_due_at: string | null };
type CareEvent = { id: string; task_id: string; actor: string; occurred_at: string; cat_id: string | null; amount_grams: number | null; note: string | null };
type InventoryItem = { id: string; name: string; quantity: number; unit: string; low_stock_at: number };
type WeightLog = { id: string; cat_id: string; weight_kg: number; measured_at: string; note: string | null };
type CareReminder = { id: string; cat_id: string; title: string; category: "vaccine" | "deworming" | "weight" | "other"; due_on: string; notes: string | null; completed_at: string | null };
type CatDocument = { id: string; cat_id: string; name: string; document_type: "veterinary" | "vaccination" | "lab" | "other"; document_date: string | null; storage_path: string; created_at: string; url: string };
type CatMedicalRecord = { id: string; cat_id: string; title: string; record_type: "visit" | "diagnosis" | "treatment" | "vaccination" | "other"; recorded_on: string; clinic: string | null; notes: string | null; created_at: string };
type DashboardData = { cats: Cat[]; tasks: CareTask[]; events: CareEvent[]; inventory: InventoryItem[]; members: HouseholdMember[]; weightLogs: WeightLog[]; reminders: CareReminder[]; documents: CatDocument[]; medicalRecords: CatMedicalRecord[]; serverTime: string };
type EntryMode = "cat" | "task" | "inventory" | "member" | "reminder" | "weight" | "document" | "medical" | null;

const kindPresentation: Record<CareTask["kind"], { icon: IconName; color: string; label: string }> = {
  water: { icon: "water", color: "blue", label: "Agua" },
  food: { icon: "food", color: "mint", label: "Comida" },
  litter: { icon: "litter", color: "amber", label: "Arenero" },
  other: { icon: "check", color: "coral", label: "Otro cuidado" },
};

function elapsedLabel(date: string | null, now: number | null) {
  if (!date) return "Sin registros";
  if (now === null) return "—";
  const hours = Math.max(0, Math.floor((now - new Date(date).getTime()) / 3_600_000));
  if (hours < 1) return "Hace menos de 1 h";
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} d`;
}

function dueLabel(date: string | null, now: number | null) {
  if (!date) return "Sin programar";
  if (now === null) return "—";
  const milliseconds = new Date(date).getTime() - now;
  const minutes = Math.round(Math.abs(milliseconds) / 60_000);
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  const value = hours ? `${hours} h${remainder ? ` ${remainder} min` : ""}` : `${minutes} min`;
  return milliseconds <= 0 ? `Retrasada ${value}` : `En ${value}`;
}

function dateLabel(date: string) {
  return new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long" }).format(new Date(date));
}

function ageLabel(birthday: string | null, nowTimestamp: number | null) {
  if (!birthday || nowTimestamp === null) return null;
  const born = new Date(`${birthday}T12:00:00`);
  const now = new Date(nowTimestamp);
  let months = (now.getFullYear() - born.getFullYear()) * 12 + now.getMonth() - born.getMonth();
  if (now.getDate() < born.getDate()) months--;
  return months < 12 ? `${Math.max(0, months)} meses` : `${Math.floor(months / 12)} años`;
}

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const [activeNav, setActiveNav] = useState("Inicio");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);
  const [password, setPassword] = useState("");
  const [entryMode, setEntryMode] = useState<EntryMode>(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [householdOpen, setHouseholdOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Cat | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/dashboard", { cache: "no-store" });
      const result = await response.json();
      if (response.status === 401) {
        setNeedsLogin(true);
        setLoadError("");
        return;
      }
      if (!response.ok) throw new Error(result.error || "No se pudieron cargar los datos.");
      setNeedsLogin(false);
      setData(result as DashboardData);
      setLoadError("");
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "No se pudieron cargar los datos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadDashboard(); }, [loadDashboard]);
  useEffect(() => {
    const updateClock = () => setNow(Date.now());
    updateClock();
    const timer = window.setInterval(updateClock, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const taskById = useMemo(() => new Map((data?.tasks ?? []).map((task) => [task.id, task])), [data?.tasks]);
  const catById = useMemo(() => new Map((data?.cats ?? []).map((cat) => [cat.id, cat])), [data?.cats]);
  const actor = data?.events[0]?.actor || "";
  const members = data?.members ?? [];
  const defaultActor = actor || members[0]?.name || "";
  const pendingTasks = now === null ? [] : (data?.tasks ?? []).filter((task) => !task.last_completed_at || !task.next_due_at || new Date(task.next_due_at).getTime() <= now);
  const weekEvents = now === null ? [] : (data?.events ?? []).filter((event) => now - new Date(event.occurred_at).getTime() <= 7 * 86_400_000);
  const overdueTasks = now === null ? 0 : (data?.tasks ?? []).filter((task) => task.next_due_at && new Date(task.next_due_at).getTime() < now).length;

  const sendJson = async (url: string, body: Record<string, unknown>, method = "POST") => {
    const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "No se pudo guardar.");
    return result;
  };

  const finishTask = async (task: CareTask) => {
    const actorName = window.prompt("¿Quién ha realizado este cuidado?", defaultActor);
    if (!actorName?.trim()) return;
    let catId: string | null = null;
    let amountGrams: number | null = null;
    if (task.kind === "food") {
      const amount = window.prompt("Cantidad servida en gramos (opcional)", "");
      if (amount === null) return;
      amountGrams = amount.trim() ? Number(amount) : null;
      if (amountGrams !== null && (!Number.isInteger(amountGrams) || amountGrams <= 0)) {
        setNotice("La cantidad debe ser un número de gramos mayor que cero.");
        window.setTimeout(() => setNotice(""), 2800);
        return;
      }
      if (data?.cats.length) {
        const catName = window.prompt(`¿Para qué gato? (${data.cats.map((cat) => cat.name).join(", ")}). Déjalo vacío si fue para todos.`, "");
        if (catName === null) return;
        const selectedCat = data.cats.find((cat) => cat.name.toLocaleLowerCase("es") === catName.trim().toLocaleLowerCase("es"));
        if (catName.trim() && !selectedCat) {
          setNotice("No encontré ese gato. Escribe uno de los nombres indicados.");
          window.setTimeout(() => setNotice(""), 2800);
          return;
        }
        catId = selectedCat?.id ?? null;
      }
    }
    try {
      await sendJson("/api/care", { code: task.code, actor: actorName.trim(), cat_id: catId, amount_grams: amountGrams });
      setNotice(`${task.name}: cuidado guardado en Supabase`);
      await loadDashboard();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No se pudo registrar el cuidado");
    }
    window.setTimeout(() => setNotice(""), 3200);
  };

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    try {
      await sendJson("/api/auth", { password });
      setPassword("");
      await loadDashboard();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se pudo iniciar sesión.");
    }
  };

  const submitEntry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    const form = new FormData(event.currentTarget);
    try {
      if (entryMode === "cat") {
        const sterilizedValue = String(form.get("is_sterilized") || "");
        const catInput = {
          name: form.get("name"), weight_kg: form.get("weight_kg"), birthday: form.get("birthday") || null,
          next_vaccine_on: form.get("next_vaccine_on") || null, sex: form.get("sex") || null,
          is_sterilized: sterilizedValue === "true" ? true : sterilizedValue === "false" ? false : null,
          daily_meals_goal: form.get("daily_meals_goal") || null,
        };
        const cat = editingCat
          ? await sendJson(`/api/cats?id=${encodeURIComponent(editingCat.id)}`, catInput, "PATCH")
          : await sendJson("/api/cats", catInput);
        const photo = form.get("photo");
        if (photo instanceof File && photo.size > 0) {
          const photoForm = new FormData(); photoForm.append("cat_id", cat.id); photoForm.append("photo", photo);
          const upload = await fetch("/api/cats/photo", { method: "POST", body: photoForm });
          const result = await upload.json();
          if (!upload.ok) throw new Error(result.error || "No se pudo guardar la foto.");
        }
      } else if (entryMode === "task") {
        await sendJson("/api/care-tasks", { name: form.get("name"), kind: form.get("kind"), interval_hours: form.get("interval_hours") });
      } else if (entryMode === "inventory") {
        await sendJson("/api/inventory", { name: form.get("name"), quantity: form.get("quantity"), unit: form.get("unit"), low_stock_at: form.get("low_stock_at") });
      } else if (entryMode === "member") {
        await sendJson("/api/household-members", { name: form.get("name"), role: form.get("role") });
      } else if (entryMode === "reminder") {
        await sendJson("/api/care-reminders", { cat_id: form.get("cat_id"), title: form.get("title"), category: form.get("category"), due_on: form.get("due_on"), notes: form.get("notes") });
      } else if (entryMode === "weight") {
        await sendJson("/api/cat-weights", { cat_id: form.get("cat_id"), weight_kg: form.get("weight_kg"), note: form.get("note") });
      } else if (entryMode === "medical") {
        await sendJson("/api/cat-medical-records", { cat_id: form.get("cat_id"), title: form.get("title"), record_type: form.get("record_type"), recorded_on: form.get("recorded_on"), clinic: form.get("clinic"), notes: form.get("notes") });
      } else if (entryMode === "document") {
        const documentForm = new FormData();
        documentForm.append("cat_id", String(form.get("cat_id")));
        documentForm.append("document_type", String(form.get("document_type")));
        documentForm.append("document_date", String(form.get("document_date") || ""));
        const file = form.get("document");
        if (file instanceof File) documentForm.append("document", file);
        const response = await fetch("/api/cat-documents", { method: "POST", body: documentForm });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "No se pudo subir el documento.");
      }
      setEditingCat(null);
      setEntryMode(null);
      await loadDashboard();
      setNotice("Guardado en Supabase");
      window.setTimeout(() => setNotice(""), 2600);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  const openAddCat = () => { setEditingCat(null); setFormError(""); setEntryMode("cat"); };
  const openEditCat = (cat: CatCardData) => { setEditingCat(cat); setFormError(""); setEntryMode("cat"); };

  const completeReminder = async (reminder: CatCareReminder) => {
    const response = await fetch(`/api/care-reminders?id=${encodeURIComponent(reminder.id)}`, { method: "PATCH" });
    if (!response.ok) { setNotice("No se pudo completar el cuidado."); return; }
    await loadDashboard();
  };

  const removeMember = async (member: HouseholdMember) => {
    if (!window.confirm(`¿Quitar a ${member.name} del hogar? Sus registros de cuidados se conservarán.`)) return;
    const response = await fetch(`/api/household-members?id=${encodeURIComponent(member.id)}`, { method: "DELETE" });
    if (!response.ok) {
      const result = await response.json();
      setNotice(result.error || "No se pudo quitar a la persona.");
      return;
    }
    await loadDashboard();
  };

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#inicio" aria-label="MiauCare, inicio">
          <span className="brand-icon"><Icon name="cats" size={31} /></span>
          <span>MiauCare</span>
        </a>

        <nav className="main-nav" aria-label="Navegación principal">
          {navigation.map((item) => (
            <a
              className={`nav-link ${activeNav === item.label ? "active" : ""}`}
              key={item.label}
              href={`#${item.target}`}
              onClick={(event) => {
                if (item.label === "Mis gatos") event.preventDefault();
                setActiveNav(item.label);
              }}
            >
              <Icon name={item.icon} size={23} />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="household">
          <button className="household-title" onClick={() => setHouseholdOpen(true)}>
            <Icon name="users" size={23} /><span>Mi hogar</span><span className="household-count">{members.length}</span><Icon name="arrow" size={19} />
          </button>
          <div className="household-avatars" aria-label="Miembros del hogar">
            {members.slice(0, 4).map((member) => <span className="person-avatar" title={`${member.name} · ${member.role}`} key={member.id}>{member.name.slice(0, 1).toLocaleUpperCase("es")}</span>)}
            {members.length === 0 && <span className="household-empty">Sin personas añadidas</span>}
            <button className="add-person" aria-label="Añadir persona al hogar" onClick={() => { setFormError(""); setEntryMode("member"); }}><Icon name="plus" size={20} /></button>
          </div>
        </div>
        <div className="sidebar-note"><span className={`online-dot ${pendingTasks.length ? "attention-dot" : ""}`} />{pendingTasks.length ? `${pendingTasks.length} cuidados pendientes` : data?.tasks.length ? "Rutinas al día" : "Añade una rutina"}</div>
      </aside>

      <section className="workspace" id="inicio">
        <header className="topbar">
          <div className="breadcrumb">Hogar <span>/</span> <strong>{activeNav === "Inicio" ? "Resumen" : activeNav}</strong></div>
          <div className="topbar-actions">
            <span className="today">{now === null ? "" : dateLabel(new Date(now).toISOString())}</span>
            <button className="icon-button notification-button" aria-label={`${pendingTasks.length} tareas pendientes`} onClick={() => setNotice(pendingTasks.length ? `Pendiente: ${pendingTasks.map((task) => task.name).join(", ")}` : "No hay cuidados pendientes")}><Icon name="bell" size={23} />{pendingTasks.length > 0 && <span className="notification-count">{pendingTasks.length}</span>}</button>
            <button className="profile-button" aria-label={members[0] ? `Personas del hogar: ${members.map((member) => member.name).join(", ")}` : "Añadir personas al hogar"} onClick={() => setHouseholdOpen(true)}>{members[0] ? <span className="profile-avatar">{members[0].name.slice(0, 1).toLocaleUpperCase("es")}</span> : <span className="profile-avatar"><Icon name="users" size={19} /></span>}</button>
          </div>
        </header>

        <div className="page-heading">
          <div><h1>{activeNav === "Mis gatos" ? "Mis gatos" : "Estado del hogar"}</h1><p>{activeNav === "Mis gatos" ? "Toda su información y cuidados en un solo lugar" : "Resumen de rutinas, actividad e inventario guardados"}</p></div>
          {activeNav === "Mis gatos"
            ? <button className="cats-add-button" onClick={openAddCat}><Icon name="plus" size={19} /> Añadir gato</button>
            : <button className="date-select" onClick={() => void loadDashboard()}><Icon name="sync" size={18} /> Actualizar</button>}
        </div>

        {activeNav === "Mis gatos" ? <CatsOverview
          cats={data?.cats ?? []}
          tasks={data?.tasks ?? []}
          events={data?.events ?? []}
          reminders={data?.reminders ?? []}
          weightLogs={data?.weightLogs ?? []}
          documents={data?.documents ?? []}
          medicalRecords={data?.medicalRecords ?? []}
          now={now}
          loading={loading}
          error={loadError}
          onRetry={() => void loadDashboard()}
          onAddCat={openAddCat}
          onEditCat={openEditCat}
          onAddReminder={() => setEntryMode("reminder")}
          onAddWeight={() => setEntryMode("weight")}
          onAddDocument={() => setEntryMode("document")}
          onAddMedicalRecord={() => setEntryMode("medical")}
          onCompleteReminder={(reminder) => void completeReminder(reminder)}
        /> : <>
        <div className="sync-banner">
          <div className="pending-label"><span className="check-disc"><Icon name="check" size={18} /></span><strong>{now === null ? "—" : pendingTasks.length} tareas pendientes</strong></div>
          <div className="sync-label"><Icon name="sync" size={20} /><span>{loading ? "Sincronizando…" : loadError ? "Sin conexión" : "Datos guardados en Supabase"}</span></div>
        </div>

        {loadError && <div className="load-error" role="alert">{loadError}<button onClick={() => void loadDashboard()}>Reintentar</button></div>}

        <section className="status-grid" aria-label="Estado de cuidados">
          {(data?.tasks ?? []).map((task) => {
            const presentation = kindPresentation[task.kind];
            const overdue = now !== null && Boolean(!task.last_completed_at || !task.next_due_at || new Date(task.next_due_at).getTime() <= now);
            return <article className="status-card" key={task.id}>
              <div className="status-card-top"><span className={`icon-tile ${presentation.color}`}><Icon name={presentation.icon} size={27} /></span><strong>{task.name}</strong><span className={`badge ${overdue ? "amber-badge" : "green-badge"}`}>{overdue ? "Pendiente" : "Al día"}</span></div>
              <div className={`status-main ${overdue ? "overdue" : ""}`}><strong>{elapsedLabel(task.last_completed_at, now)}</strong><span>{task.last_completed_by || "Aún sin registrar"}{task.last_completed_at ? ` · ${new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" }).format(new Date(task.last_completed_at))}` : ""}</span></div>
              <div className={`next-action ${presentation.color}-tint`}><Icon name="calendar" size={19} /> {task.next_due_at ? `Próxima ${new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" }).format(new Date(task.next_due_at))}` : `Cada ${task.interval_hours} h`}</div>
            </article>;
          })}
          {!loading && !loadError && !(data?.tasks.length) && <div className="empty-panel">Aún no hay rutinas configuradas. Añade una tarea para empezar.</div>}
        </section>

        <div className="primary-grid">
          <section className="panel tasks-panel" id="tasks">
            <div className="panel-heading"><h2><Icon name="calendar" size={24} /> Próximas tareas</h2><button className="text-link" onClick={() => { setFormError(""); setEntryMode("task"); }}>Añadir tarea <Icon name="plus" size={17} /></button></div>
            <div className="task-list">
              {(data?.tasks ?? []).slice(0, 5).map((task) => {
                const presentation = kindPresentation[task.kind];
                const due = task.next_due_at ? new Date(task.next_due_at) : null;
                const dueText = due ? dueLabel(task.next_due_at, now) : `Cada ${task.interval_hours} h`;
                return <div className="task-row" key={task.id}>
                  <span className={`icon-tile small ${presentation.color}`}><Icon name={presentation.icon} size={22} /></span>
                  <div className="task-copy"><strong>{task.name}</strong><span>{task.last_completed_at ? `Última vez · ${task.last_completed_by || "Hogar"}` : `Sin registros · cada ${task.interval_hours} h`}</span></div>
                  <span className={`task-time ${presentation.color}`}>{dueText}</span>
                  <button className="register-button" onClick={() => void finishTask(task)}><Icon name="check" size={17} /> Registrar</button>
                </div>;
              })}
              {!loading && !loadError && !(data?.tasks.length) && <div className="empty-row">Crea una rutina de agua, comida o arenero para que aparezca aquí.</div>}
            </div>
          </section>

          <section className="panel cats-panel" id="cats">
            <div className="panel-heading"><h2><Icon name="cats" size={24} /> Mis gatos</h2><button className="text-link" onClick={openAddCat}>Añadir gato <Icon name="plus" size={17} /></button></div>
            {(data?.cats ?? []).slice(0, 3).map((cat) => <div className="cat-row" key={cat.id}><span className="cat-portrait">{cat.photo_url ? <img src={cat.photo_url} alt={`Foto de ${cat.name}`} /> : cat.avatar_emoji}</span><span className="cat-info"><strong>{cat.name}</strong><span>{[ageLabel(cat.birthday, now), cat.weight_kg ? `${Number(cat.weight_kg).toLocaleString("es-ES")} kg` : null].filter(Boolean).join(" · ") || "Añade edad y peso desde su ficha"}</span></span><span className="cat-online" /></div>)}
            {!loading && !loadError && !(data?.cats.length) && <div className="cats-empty"><p>Aún no has añadido gatos.</p><button className="register-button" onClick={openAddCat}><Icon name="plus" size={16} /> Añadir el primero</button></div>}
            {(() => {
              const upcoming = (data?.cats ?? []).filter((cat) => cat.next_vaccine_on).sort((a, b) => (a.next_vaccine_on ?? "").localeCompare(b.next_vaccine_on ?? ""))[0];
              return upcoming ? <div className="care-reminder"><span className="care-icon"><Icon name="vaccine" size={22} /></span><span><strong>Vacuna de {upcoming.name}</strong><span> · {new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(new Date(`${upcoming.next_vaccine_on}T12:00:00`))}</span></span></div> : null;
            })()}
          </section>
        </div>

        <div className="secondary-grid">
          <section className="panel activity-panel" id="activity">
            <div className="panel-heading"><h2><Icon name="clock" size={24} /> Actividad reciente</h2><button className="text-link" onClick={() => setActiveNav("Historial")}>Ver historial <Icon name="arrow" size={17} /></button></div>
            <div className="activity-list">
              {(data?.events ?? []).slice(0, 4).map((event) => {
                const task = taskById.get(event.task_id);
                const cat = event.cat_id ? catById.get(event.cat_id) : null;
                const presentation = kindPresentation[task?.kind ?? "other"];
                return <div className="activity-item" key={event.id}><span className="activity-marker" /><span className={`icon-tile small ${presentation.color}`}><Icon name={presentation.icon} size={21} /></span><p><strong>{new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" }).format(new Date(event.occurred_at))}</strong><span> · {event.actor} {task?.name ? `registró ${task.name.toLowerCase()}` : "registró un cuidado"}{cat ? ` para ${cat.name}` : ""}{event.amount_grams ? ` · ${event.amount_grams} g` : ""}</span></p></div>;
              })}
              {!loading && !loadError && !(data?.events.length) && <div className="empty-row">Los cuidados registrados aparecerán aquí.</div>}
            </div>
          </section>

          <section className="panel week-panel" id="stats">
            <div className="panel-heading"><h2><Icon name="chart" size={24} /> Esta semana</h2></div>
            <div className="metrics-row">
              <div className="metric mint"><Icon name="calendar" size={24} /><strong>{data?.tasks.length ?? 0}<small>rutinas</small></strong></div>
              <div className="metric blue"><Icon name="list" size={24} /><strong>{weekEvents.length}<small>registros / 7 días</small></strong></div>
              <div className="metric coral"><Icon name="warning" size={24} /><strong>{overdueTasks}<small>pendientes</small></strong></div>
            </div>
            <div className="distribution-label">Cuidados registrados por persona</div>
            {(() => {
              const counts = weekEvents.reduce<Record<string, number>>((result, event) => { result[event.actor] = (result[event.actor] ?? 0) + 1; return result; }, {});
              const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 2);
              const total = entries.reduce((sum, [, count]) => sum + count, 0);
              const firstShare = total ? Math.round(entries[0][1] / total * 100) : 50;
              return entries.length ? <div className="distribution-bar" style={{ gridTemplateColumns: `${firstShare}fr ${100 - firstShare}fr` }}><span>{entries[0][0]} {firstShare}%</span><span>{entries[1] ? `${entries[1][0]} ${100 - firstShare}%` : ""}</span></div> : <div className="empty-bar">Sin registros esta semana</div>;
            })()}
          </section>
        </div>

        <div className="bottom-cards">
          <div className="bottom-card static-card"><span className="icon-tile mint"><Icon name="calendar" size={23} /></span><span><strong>Próxima vacuna</strong><small>{(data?.cats ?? []).find((cat) => cat.next_vaccine_on)?.next_vaccine_on ? `${(data?.cats ?? []).find((cat) => cat.next_vaccine_on)?.name} · ${new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(new Date(`${(data?.cats ?? []).find((cat) => cat.next_vaccine_on)?.next_vaccine_on}T12:00:00`))}` : "Añade una fecha en la ficha de un gato"}</small></span></div>
          <button className="bottom-card" id="inventory" onClick={() => setEntryMode("inventory")}><span className="icon-tile mint"><Icon name="box" size={23} /></span><span><strong>Inventario</strong><small>{data?.inventory.length ? `${data.inventory[0].name}: ${data.inventory[0].quantity} ${data.inventory[0].unit}` : "Añade el pienso y otros productos"}</small></span><Icon name="plus" size={20} /></button>
          <div className="nfc-status"><span className="online-dot" /> {loading ? "Conectando…" : loadError ? "Sin conexión" : "Supabase conectado"}</div>
        </div>
        </>}
      </section>

      {needsLogin && <div className="modal-overlay"><form className="entry-form login-form" onSubmit={submitLogin}><span className="brand-icon"><Icon name="cats" size={34} /></span><h2>Accede a MiauCare</h2><p>Introduce la contraseña de tu hogar para abrir el panel.</p><label>Contraseña<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>{formError && <p className="form-error">{formError}</p>}<button className="register-button form-submit">Entrar</button></form></div>}

      {householdOpen && <div className="modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setHouseholdOpen(false); }}><section className="entry-form household-manager">
        <button type="button" className="modal-close" onClick={() => setHouseholdOpen(false)} aria-label="Cerrar">×</button>
        <h2>Mi hogar</h2><p>Personas registradas en este hogar y en sus cuidados.</p>
        <div className="household-member-list">
          {members.map((member) => <div className="household-member-row" key={member.id}><span className="person-avatar">{member.name.slice(0, 1).toLocaleUpperCase("es")}</span><span><strong>{member.name}</strong><small>{member.role}</small></span><button type="button" onClick={() => void removeMember(member)} aria-label={`Quitar a ${member.name}`}>Quitar</button></div>)}
          {members.length === 0 && <div className="empty-row">Aún no hay personas guardadas en el hogar.</div>}
        </div>
        <button className="register-button form-submit" onClick={() => { setHouseholdOpen(false); setFormError(""); setEntryMode("member"); }}><Icon name="plus" size={17} /> Añadir persona</button>
      </section></div>}

      {entryMode && <div className="modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setEntryMode(null); }}><form className="entry-form" onSubmit={submitEntry}>
        <button type="button" className="modal-close" onClick={() => setEntryMode(null)} aria-label="Cerrar">×</button>
        <h2>{entryMode === "cat" ? editingCat ? `Editar ficha de ${editingCat.name}` : "Añadir gato" : entryMode === "task" ? "Crear rutina" : entryMode === "inventory" ? "Añadir al inventario" : entryMode === "member" ? "Añadir persona al hogar" : entryMode === "reminder" ? "Añadir cuidado" : entryMode === "weight" ? "Registrar peso" : entryMode === "document" ? "Subir documento veterinario" : "Añadir al historial médico"}</h2>
        {entryMode === "cat" && <>
          <label>Nombre<input name="name" autoFocus maxLength={80} required defaultValue={editingCat?.name ?? ""} placeholder="Nombre del gato" /></label>
          <div className="form-row"><label>Sexo<select name="sex" defaultValue={editingCat?.sex ?? ""}><option value="">Sin especificar</option><option value="male">Macho</option><option value="female">Hembra</option><option value="unknown">No se conoce</option></select></label><label>Esterilización<select name="is_sterilized" defaultValue={editingCat?.is_sterilized == null ? "" : String(editingCat.is_sterilized)}><option value="">Sin especificar</option><option value="true">Sí</option><option value="false">No</option></select></label></div>
          <div className="form-row"><label>Peso (kg)<input name="weight_kg" type="number" min="0.1" max="100" step="0.1" defaultValue={editingCat?.weight_kg ?? ""} /></label><label>Fecha de nacimiento<input name="birthday" type="date" defaultValue={editingCat?.birthday ?? ""} /></label></div>
          <div className="form-row"><label>Comidas diarias objetivo<input name="daily_meals_goal" type="number" min="1" max="12" step="1" defaultValue={editingCat?.daily_meals_goal ?? ""} /></label><label>Próxima vacuna<input name="next_vaccine_on" type="date" defaultValue={editingCat?.next_vaccine_on ?? ""} /></label></div>
          <label>Foto del gato<input name="photo" type="file" accept="image/jpeg,image/png,image/webp,image/avif" />{editingCat?.photo_url && <small>Deja el campo vacío para conservar la foto actual.</small>}</label>
        </>}
        {entryMode === "task" && <><label>Nombre de la rutina<input name="name" autoFocus maxLength={100} required placeholder="Nombre de la rutina" /></label><div className="form-row"><label>Tipo<select name="kind" defaultValue="" required><option value="" disabled>Elige el tipo</option><option value="water">Agua</option><option value="food">Comida</option><option value="litter">Arenero</option><option value="other">Otro cuidado</option></select></label><label>Repetir cada (horas)<input name="interval_hours" type="number" min="1" max="8760" required /></label></div></>}
        {entryMode === "inventory" && <><label>Producto<input name="name" autoFocus maxLength={100} required placeholder="Nombre del producto" /></label><div className="form-row"><label>Cantidad<input name="quantity" type="number" min="0" step="0.1" required /></label><label>Unidad<input name="unit" maxLength={30} required placeholder="g, kg, bolsas…" /></label></div><label>Avisar cuando quede menos de<input name="low_stock_at" type="number" min="0" step="0.1" required /></label></>}
        {entryMode === "member" && <><label>Nombre<input name="name" autoFocus maxLength={80} required placeholder="Nombre de la persona" /></label><label>Rol en el hogar<input name="role" maxLength={40} defaultValue="miembro" required /></label></>}
        {entryMode === "reminder" && <><label>Gato<select name="cat_id" defaultValue={data?.cats[0]?.id ?? ""} required>{(data?.cats ?? []).map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select></label><label>Cuidado<input name="title" autoFocus maxLength={120} required placeholder="Ej. Desparasitación" /></label><div className="form-row"><label>Tipo<select name="category" defaultValue="other"><option value="vaccine">Vacuna</option><option value="deworming">Desparasitación</option><option value="weight">Control de peso</option><option value="other">Otro</option></select></label><label>Fecha<input name="due_on" type="date" required /></label></div><label>Notas<textarea name="notes" maxLength={500} rows={2} /></label></>}
        {entryMode === "weight" && <><label>Gato<select name="cat_id" defaultValue={data?.cats[0]?.id ?? ""} required>{(data?.cats ?? []).map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select></label><label>Peso (kg)<input name="weight_kg" type="number" min="0.1" max="100" step="0.01" required /></label><label>Nota<input name="note" maxLength={250} placeholder="Opcional" /></label></>}
        {entryMode === "medical" && <><label>Gato<select name="cat_id" defaultValue={data?.cats[0]?.id ?? ""} required>{(data?.cats ?? []).map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select></label><label>Registro<input name="title" autoFocus maxLength={120} required placeholder="Ej. Revisión anual" /></label><div className="form-row"><label>Tipo<select name="record_type" defaultValue="visit"><option value="visit">Visita</option><option value="diagnosis">Diagnóstico</option><option value="treatment">Tratamiento</option><option value="vaccination">Vacunación</option><option value="other">Otro</option></select></label><label>Fecha<input name="recorded_on" type="date" /></label></div><label>Clínica<input name="clinic" maxLength={120} /></label><label>Notas<textarea name="notes" maxLength={1000} rows={3} /></label></>}
        {entryMode === "document" && <><label>Gato<select name="cat_id" defaultValue={data?.cats[0]?.id ?? ""} required>{(data?.cats ?? []).map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select></label><label>Archivo<input name="document" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" required /></label><div className="form-row"><label>Tipo<select name="document_type" defaultValue="veterinary"><option value="veterinary">Veterinario</option><option value="vaccination">Vacunación</option><option value="lab">Analítica</option><option value="other">Otro</option></select></label><label>Fecha<input name="document_date" type="date" /></label></div></>}
        {formError && <p className="form-error">{formError}</p>}
        <button className="register-button form-submit" disabled={saving}>{saving ? "Guardando…" : "Guardar en Supabase"}</button>
      </form></div>}
      {notice && <div className="toast" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Cerrar">×</button></div>}
    </main>
  );
}
