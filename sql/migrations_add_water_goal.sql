-- Migración: meta diaria de vasos de agua configurable por usuario.
-- Correr una vez en el SQL editor de Supabase (es idempotente).
-- Hasta correrla, el código usa 8 como fallback y el editor de metas mostrará
-- un error al guardar (columna inexistente).
alter table public.profiles
  add column if not exists water_goal_glasses smallint not null default 8;
