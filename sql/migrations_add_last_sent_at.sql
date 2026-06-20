-- Migración: dedup de notificaciones por ventana.
-- Correr una vez en el SQL editor de Supabase (es idempotente).
alter table public.reminders add column if not exists last_sent_at timestamptz;
