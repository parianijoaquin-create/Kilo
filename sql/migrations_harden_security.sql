-- Endurecimiento para instalaciones existentes.
-- Ejecutar una vez en el SQL editor de Supabase.

-- El rate-limit contiene contadores por usuario y globales. Solo el backend con
-- service_role puede elegir el bucket que consume.
revoke execute on function public.consume_rate_limit(uuid, text, int, int)
  from public, anon, authenticated;
grant execute on function public.consume_rate_limit(uuid, text, int, int)
  to service_role;

-- Un habit_log debe pertenecer al usuario y apuntar a uno de sus propios hábitos.
drop policy if exists "habit_logs_insert_own" on public.habit_logs;
create policy "habit_logs_insert_own"
  on public.habit_logs for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.habits h
    where h.id = habit_id and h.user_id = auth.uid()
  )
);

drop policy if exists "habit_logs_update_own" on public.habit_logs;
create policy "habit_logs_update_own"
  on public.habit_logs for update to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.habits h
    where h.id = habit_id and h.user_id = auth.uid()
  )
);

-- El upsert de una suscripción existente necesita UPDATE además de INSERT.
drop policy if exists "push_subscriptions_update_own" on public.push_subscriptions;
create policy "push_subscriptions_update_own"
  on public.push_subscriptions for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Índices para consultas y relaciones inversas futuras del diario.
create index if not exists meal_items_food_idx on public.meal_items(food_id);
create index if not exists meal_items_barcode_product_idx on public.meal_items(barcode_product_id);
