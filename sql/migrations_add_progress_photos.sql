-- ─────────────────────────────────────────────────────────────────────────────
-- Progress photos: fotos de avance físico del usuario.
-- Correr una vez en el SQL editor de Supabase.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Tabla ────────────────────────────────────────────────────────────────────
create table if not exists public.progress_photos (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null,              -- ruta dentro del bucket: {user_id}/{uuid}.jpg
  taken_at     timestamptz not null default now(),
  weight_kg    numeric(6,2) check (weight_kg is null or weight_kg > 0),
  note         text,
  created_at   timestamptz not null default now()
);

create index if not exists progress_photos_user_date_idx
  on public.progress_photos(user_id, taken_at desc);

-- ── RLS de la tabla ──────────────────────────────────────────────────────────
alter table public.progress_photos enable row level security;

drop policy if exists "progress_photos_select_own" on public.progress_photos;
create policy "progress_photos_select_own"
  on public.progress_photos for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "progress_photos_insert_own" on public.progress_photos;
create policy "progress_photos_insert_own"
  on public.progress_photos for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "progress_photos_update_own" on public.progress_photos;
create policy "progress_photos_update_own"
  on public.progress_photos for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "progress_photos_delete_own" on public.progress_photos;
create policy "progress_photos_delete_own"
  on public.progress_photos for delete to authenticated
  using (user_id = auth.uid());

-- ── Bucket privado ───────────────────────────────────────────────────────────
-- Privado: las imágenes solo se sirven vía URL firmada (nunca públicas).
insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', false)
on conflict (id) do nothing;

-- ── RLS del storage ──────────────────────────────────────────────────────────
-- Convención de path: {user_id}/{archivo}. El primer folder debe ser el uid del
-- usuario, así cada quien solo accede a sus propias fotos.
drop policy if exists "progress_photos_storage_select_own" on storage.objects;
create policy "progress_photos_storage_select_own"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "progress_photos_storage_insert_own" on storage.objects;
create policy "progress_photos_storage_insert_own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "progress_photos_storage_delete_own" on storage.objects;
create policy "progress_photos_storage_delete_own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
