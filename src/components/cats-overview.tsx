"use client";

import type { ReactNode } from "react";

export type CatCardData = {
  id: string;
  name: string;
  weight_kg: number | null;
  birthday: string | null;
  next_vaccine_on: string | null;
  avatar_emoji: string;
  sex: "male" | "female" | "unknown" | null;
  is_sterilized: boolean | null;
  daily_meals_goal: number | null;
  photo_url: string | null;
};
export type CatTask = { id: string; kind: "water" | "food" | "litter" | "other" };
export type CatEvent = { id: string; task_id: string; actor: string; occurred_at: string; cat_id: string | null; amount_grams: number | null; note: string | null };
export type CatCareReminder = { id: string; cat_id: string; title: string; category: "vaccine" | "deworming" | "weight" | "other"; due_on: string; notes: string | null; completed_at: string | null };
export type CatWeightLog = { id: string; cat_id: string; weight_kg: number; measured_at: string; note: string | null };
export type CatDocument = { id: string; cat_id: string; name: string; document_type: "veterinary" | "vaccination" | "lab" | "other"; document_date: string | null; url: string };
export type CatMedicalRecord = { id: string; cat_id: string; title: string; record_type: "visit" | "diagnosis" | "treatment" | "vaccination" | "other"; recorded_on: string; clinic: string | null; notes: string | null };

function Glyph({ name }: { name: "calendar" | "food" | "weight" | "vaccine" | "file" | "plus" | "arrow" | "check" | "paw" | "shield" | "edit" }) {
  const shapes: Record<string, ReactNode> = {
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    food: <><path d="M3 11c0-4 4-7 9-7s9 3 9 7v2c0 2-1.5 3-3 3H6c-1.5 0-3-1-3-3v-2Z"/><path d="M4 11h16"/></>,
    weight: <><path d="M6 7h12l2 14H4L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0m-3 4 2 2"/></>,
    vaccine: <><path d="m14 4 6 6M12 6l6 6M4 20l8-8M8 16l-3-3M10 18l-3-3M17 3l4 4"/></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h8"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    paw: <><circle cx="7" cy="9" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="17" cy="9" r="2"/><path d="M5.5 16c0-2.2 2.9-4 6.5-4s6.5 1.8 6.5 4-2.9 3-6.5 3-6.5-.8-6.5-3Z"/></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/></>,
    edit: <><path d="m15 5 4 4M4 20l4-.8L19 8a2.8 2.8 0 0 0-4-4L4 15v5Z"/></>,
  };
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shapes[name]}</svg>;
}

function ageLabel(birthday: string | null, now: number) {
  if (!birthday) return null;
  const born = new Date(`${birthday}T12:00:00`);
  const current = new Date(now);
  let months = (current.getFullYear() - born.getFullYear()) * 12 + current.getMonth() - born.getMonth();
  if (current.getDate() < born.getDate()) months--;
  return months < 12 ? `${Math.max(0, months)} meses` : `${Math.floor(months / 12)} ${Math.floor(months / 12) === 1 ? "año" : "años"}`;
}

function dateText(value: string, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) {
  return new Intl.DateTimeFormat("es-ES", options).format(new Date(`${value.slice(0, 10)}T12:00:00`));
}

export default function CatsOverview({
  cats, tasks, events, reminders, weightLogs, documents, medicalRecords, now,
  loading, error, onRetry, onAddCat, onEditCat, onAddReminder, onAddWeight, onAddDocument, onAddMedicalRecord, onCompleteReminder,
}: {
  cats: CatCardData[];
  tasks: CatTask[];
  events: CatEvent[];
  reminders: CatCareReminder[];
  weightLogs: CatWeightLog[];
  documents: CatDocument[];
  medicalRecords: CatMedicalRecord[];
  now: number | null;
  loading: boolean;
  error: string;
  onRetry: () => void;
  onAddCat: () => void;
  onEditCat: (cat: CatCardData) => void;
  onAddReminder: () => void;
  onAddWeight: () => void;
  onAddDocument: () => void;
  onAddMedicalRecord: () => void;
  onCompleteReminder: (reminder: CatCareReminder) => void;
}) {
  const catsById = new Map(cats.map((cat) => [cat.id, cat]));
  const tasksById = new Map(tasks.map((task) => [task.id, task]));
  const todayStart = now === null ? null : new Date(now).setHours(0, 0, 0, 0);
  const todayMeals = (catId: string) => events.filter((event) => {
    const isMeal = tasksById.get(event.task_id)?.kind === "food";
    const eventTime = new Date(event.occurred_at).getTime();
    return isMeal && todayStart !== null && eventTime >= todayStart && eventTime <= now! && (event.cat_id === null || event.cat_id === catId);
  }).length;
  const upcoming = reminders.filter((reminder) => !reminder.completed_at).sort((a, b) => a.due_on.localeCompare(b.due_on));

  return <div className="cats-overview" id="mis-gatos">
    <section className="cat-cards-grid">
      {cats.map((cat) => {
        const age = now === null ? null : ageLabel(cat.birthday, now);
        const sex = cat.sex === "male" ? "Macho" : cat.sex === "female" ? "Hembra" : cat.sex === "unknown" ? "No especificado" : null;
        return <article className="cat-profile-card" key={cat.id}>
          <div className="cat-card-image">
            {cat.photo_url ? <img src={cat.photo_url} alt={`Foto de ${cat.name}`} /> : <div className="cat-photo-fallback">{cat.avatar_emoji || cat.name.slice(0, 1).toLocaleUpperCase("es")}</div>}
            <div className="cat-card-shade" />
            <span className="family-badge"><Glyph name="paw" /> Ficha de {cat.name}</span>
            <button className="cat-edit-button" aria-label={`Editar ficha de ${cat.name}`} onClick={() => onEditCat(cat)}><Glyph name="edit" /></button>
            <div className="cat-card-content">
              <h2>{cat.name}</h2>
              <p>{[sex, age].filter(Boolean).join(" · ") || "Completa su ficha para ver sus datos"}</p>
              <div className="cat-card-bottom">
                <div className="cat-facts">
                  {cat.weight_kg !== null && <span><Glyph name="weight" /> {Number(cat.weight_kg).toLocaleString("es-ES")} kg</span>}
                  {cat.is_sterilized !== null && <span><Glyph name="shield" /> {cat.is_sterilized ? "Esterilizado/a" : "Sin esterilizar"}</span>}
                </div>
                <button className="cat-full-button" onClick={() => onEditCat(cat)}>Editar ficha <Glyph name="arrow" /></button>
              </div>
            </div>
          </div>
        </article>;
      })}
      {cats.length === 0 && <div className="cats-empty-page"><span className="empty-paw"><Glyph name="paw" /></span><h2>{loading ? "Cargando fichas…" : error ? "No se pudieron cargar los gatos" : "Aún no hay gatos en tu hogar"}</h2><p>{error || (loading ? "Consultando los datos de tu hogar." : "Añade sus datos para organizar comidas, cuidados y evolución del peso.")}</p>{error ? <button className="register-button" onClick={onRetry}>Reintentar</button> : !loading && <button className="register-button" onClick={onAddCat}><Glyph name="plus" /> Añadir el primer gato</button>}</div>}
    </section>

      <div className="cats-panels-grid">
        <section className="panel cats-data-panel" id="cats-care-reminders">
          <div className="panel-heading"><h2><Glyph name="calendar" /> Próximos cuidados</h2><button className="text-link" onClick={onAddReminder} disabled={cats.length === 0}>Añadir cuidado <Glyph name="plus" /></button></div>
          <div className="care-reminder-list">
            {upcoming.slice(0, 5).map((reminder) => {
              const cat = catsById.get(reminder.cat_id);
              return <div className="care-reminder-row" key={reminder.id}>
                <span className={`care-mark ${reminder.category}`} />
                <span className={`icon-tile small ${reminder.category === "vaccine" ? "mint" : reminder.category === "deworming" ? "amber" : "blue"}`}><Glyph name={reminder.category === "vaccine" ? "vaccine" : "calendar"} /></span>
                <span className="care-reminder-text"><strong>{reminder.title}{cat ? ` · ${cat.name}` : ""}</strong>{reminder.notes && <small>{reminder.notes}</small>}</span>
                <span className="care-date">{dateText(reminder.due_on)}</span>
                <button className="care-complete-button" onClick={() => onCompleteReminder(reminder)} aria-label={`Completar ${reminder.title}`}><Glyph name="check" /></button>
              </div>;
            })}
            {upcoming.length === 0 && <div className="cats-data-empty">No hay cuidados programados. Añade vacunas, desparasitaciones u otras citas.</div>}
          </div>
        </section>

        <section className="panel cats-data-panel feeding-panel">
          <div className="panel-heading"><h2><Glyph name="food" /> Alimentación de hoy</h2></div>
          <div className="feeding-list">
            {cats.map((cat) => {
              const meals = todayMeals(cat.id);
              const goal = cat.daily_meals_goal;
              const progress = goal ? Math.min(100, Math.round(meals / goal * 100)) : null;
              return <div className="feeding-row" key={cat.id}>
                <span className="feeding-cat-avatar">
                  {cat.photo_url
                    ? <img src={cat.photo_url} alt={`Foto de ${cat.name}`} />
                    : cat.avatar_emoji || cat.name.slice(0, 1).toLocaleUpperCase("es")}
                </span>
                <span className="feeding-cat-copy"><strong>{cat.name}</strong><small>{goal ? `${meals} de ${goal} comidas` : `${meals} ${meals === 1 ? "comida registrada" : "comidas registradas"}`}</small></span>
                {progress !== null ? <><span className="feeding-progress"><i style={{ width: `${progress}%` }} /></span><strong className="feeding-percent">{progress}%</strong></> : <span className="feeding-no-goal">Objetivo sin configurar</span>}
              </div>;
            })}
            {cats.length === 0 && <div className="cats-data-empty">Añade un gato y registra su objetivo diario para ver aquí las comidas reales.</div>}
            <div className="feeding-footnote"><Glyph name="food" /> El progreso usa los registros de comida guardados hoy.</div>
          </div>
        </section>
      </div>

      <div className="cats-lower-grid">
        <section className="panel cats-data-panel" id="medical-history">
          <div className="panel-heading"><h2><Glyph name="file" /> Historial médico</h2><button className="text-link" onClick={onAddMedicalRecord} disabled={cats.length === 0}>Añadir registro <Glyph name="plus" /></button></div>
          <div className="simple-record-list">
            {medicalRecords.slice(0, 4).map((record) => <div className="simple-record-row" key={record.id}><span><strong>{record.title}</strong><small>{catsById.get(record.cat_id)?.name}{record.clinic ? ` · ${record.clinic}` : ""}</small></span><time>{dateText(record.recorded_on)}</time></div>)}
            {medicalRecords.length === 0 && <div className="cats-data-empty">Los registros médicos que añadas aparecerán aquí.</div>}
          </div>
        </section>

        <section className="panel cats-data-panel">
          <div className="panel-heading"><h2><Glyph name="weight" /> Evolución del peso</h2><button className="text-link" onClick={onAddWeight} disabled={cats.length === 0}>Registrar peso <Glyph name="plus" /></button></div>
          <div className="weight-summary-list">
            {cats.map((cat) => {
              const logs = weightLogs.filter((log) => log.cat_id === cat.id).sort((a, b) => a.measured_at.localeCompare(b.measured_at)).slice(-7);
              const values = logs.map((log) => Number(log.weight_kg));
              const min = values.length ? Math.min(...values) : 0;
              const max = values.length ? Math.max(...values) : 0;
              return <div className="weight-summary-row" key={cat.id}><span><strong>{cat.name}</strong><small>{logs.at(-1) ? `${Number(logs.at(-1)!.weight_kg).toLocaleString("es-ES")} kg · ${dateText(logs.at(-1)!.measured_at)}` : "Sin pesos registrados"}</small></span>{values.length > 1 ? <div className="weight-sparkline" aria-label={`Evolución de peso de ${cat.name}`}>{values.map((value, index) => <i key={`${cat.id}-${index}`} style={{ height: `${max === min ? 52 : 18 + (value - min) / (max - min) * 44}%` }} />)}</div> : <span className="weight-no-trend">{values.length === 1 ? "1 registro" : "Sin evolución"}</span>}</div>;
            })}
            {cats.length === 0 && <div className="cats-data-empty">Añade gatos para registrar y consultar su evolución de peso.</div>}
          </div>
        </section>

        <section className="panel cats-data-panel documents-panel">
          <div className="panel-heading"><h2><Glyph name="file" /> Documentos veterinarios</h2><button className="text-link" onClick={onAddDocument} disabled={cats.length === 0}>Subir archivo <Glyph name="plus" /></button></div>
          <div className="simple-record-list">
            {documents.slice(0, 4).map((document) => <a className="simple-record-row document-row" href={document.url} target="_blank" rel="noreferrer" key={document.id}><span><strong>{document.name}</strong><small>{catsById.get(document.cat_id)?.name}</small></span><Glyph name="arrow" /></a>)}
            {documents.length === 0 && <div className="cats-data-empty">No hay documentos guardados. Puedes subir informes, recetas o cartillas.</div>}
          </div>
        </section>
      </div>
  </div>;
}
