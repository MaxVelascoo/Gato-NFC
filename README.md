# MiauCare

Panel doméstico para registrar los cuidados de los gatos con Next.js y Supabase.

## Variables de entorno

Configura estas variables en `.env` para desarrollo y también en Vercel para producción:

```text
SUPABASE_URL=...
SUPABASE_SECRET_KEY=...
DASHBOARD_PASSWORD=...
```

`SUPABASE_SECRET_KEY` se usa solo en Route Handlers del servidor. No la conviertas en una variable `NEXT_PUBLIC_`.

En producción, `DASHBOARD_PASSWORD` protege el panel y las operaciones de escritura. Al iniciar sesión se crea una cookie HTTP only de siete días.

## Base de datos

Las migraciones de `supabase/migrations/` amplían las tablas existentes `care_tasks` y `care_events`, crean `cats`, `inventory_items`, `household_members`, historial de peso, recordatorios, historial médico y documentos. La migración del hogar registra como miembros solo a los actores que ya aparecen en el historial. Las fotos y documentos se guardan en buckets privados y la aplicación usa enlaces firmados. Las migraciones conservan las tareas, el historial y la función NFC ya existentes. Aplícalas en orden en Supabase SQL Editor o con una conexión PostgreSQL directa:

```bash
for migration in supabase/migrations/*.sql; do
  psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f "$migration"
done
```

Después de aplicar la migración, la página principal carga gatos, rutinas, actividad e inventario desde Supabase. Los formularios de la home y el botón Registrar escriben en la base de datos.

## Recordatorios push de las rutinas

La migración `20261103100000_care_push_cron.sql` activa `pg_cron` y `pg_net`, y programa una comprobación cada minuto. Para cada rutina calcula el vencimiento desde el evento más reciente de `care_events` más `interval_hours` (si todavía no existe un evento, usa la fecha de creación de la rutina). Cada ciclo de la rutina se notifica una sola vez; si falla el envío, se reintenta hasta cinco veces. El endpoint `/api/push` manda el aviso a todos los móviles suscritos.

Configura una vez estos dos secretos en Supabase Vault, usando la URL base HTTPS de producción y el mismo `PUSH_SETUP_TOKEN` configurado en Vercel. No añadas `/api/push` al valor de la URL:

```sql
select vault.create_secret('https://tu-app.vercel.app', 'miau_care_app_url');
select vault.create_secret('tu-PUSH_SETUP_TOKEN-de-Vercel', 'miau_care_push_token');
```

Los móviles de la casa deben activar las notificaciones desde `/notificaciones`. La programación y sus ejecuciones se pueden consultar en Supabase Dashboard → Integrations → Cron.

## Desarrollo

```bash
npm install
npm run dev
```
