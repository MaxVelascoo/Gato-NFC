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

## Desarrollo

```bash
npm install
npm run dev
```
