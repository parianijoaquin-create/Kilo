-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.food_categories enable row level security;
alter table public.food_sources enable row level security;
alter table public.foods enable row level security;
alter table public.barcode_products enable row level security;
alter table public.meals enable row level security;
alter table public.meal_items enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.weight_logs enable row level security;
alter table public.audit enable row level security;

-- ─── profiles ─────────────────────────────────────────────────────────────────

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select to authenticated
using (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert to authenticated
with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- ─── Food catalog (public read) ───────────────────────────────────────────────

drop policy if exists "food_categories_public_read" on public.food_categories;
create policy "food_categories_public_read"
  on public.food_categories for select to anon, authenticated
using (true);

drop policy if exists "food_sources_public_read" on public.food_sources;
create policy "food_sources_public_read"
  on public.food_sources for select to anon, authenticated
using (true);

drop policy if exists "foods_public_read" on public.foods;
create policy "foods_public_read"
  on public.foods for select to anon, authenticated
using (true);

drop policy if exists "barcode_products_public_read" on public.barcode_products;
create policy "barcode_products_public_read"
  on public.barcode_products for select to anon, authenticated
using (true);

-- ─── meals ────────────────────────────────────────────────────────────────────

drop policy if exists "meals_select_own" on public.meals;
create policy "meals_select_own"
  on public.meals for select to authenticated
using (user_id = auth.uid());

drop policy if exists "meals_insert_own" on public.meals;
create policy "meals_insert_own"
  on public.meals for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "meals_update_own" on public.meals;
create policy "meals_update_own"
  on public.meals for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "meals_delete_own" on public.meals;
create policy "meals_delete_own"
  on public.meals for delete to authenticated
using (user_id = auth.uid());

-- ─── meal_items (ownership via meals join) ────────────────────────────────────

drop policy if exists "meal_items_select_own" on public.meal_items;
create policy "meal_items_select_own"
  on public.meal_items for select to authenticated
using (
  exists (
    select 1 from public.meals m
    where m.id = meal_id and m.user_id = auth.uid()
  )
);

drop policy if exists "meal_items_insert_own" on public.meal_items;
create policy "meal_items_insert_own"
  on public.meal_items for insert to authenticated
with check (
  exists (
    select 1 from public.meals m
    where m.id = meal_id and m.user_id = auth.uid()
  )
);

drop policy if exists "meal_items_update_own" on public.meal_items;
create policy "meal_items_update_own"
  on public.meal_items for update to authenticated
using (
  exists (
    select 1 from public.meals m
    where m.id = meal_id and m.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.meals m
    where m.id = meal_id and m.user_id = auth.uid()
  )
);

drop policy if exists "meal_items_delete_own" on public.meal_items;
create policy "meal_items_delete_own"
  on public.meal_items for delete to authenticated
using (
  exists (
    select 1 from public.meals m
    where m.id = meal_id and m.user_id = auth.uid()
  )
);

-- ─── habits ───────────────────────────────────────────────────────────────────

drop policy if exists "habits_select_own" on public.habits;
create policy "habits_select_own"
  on public.habits for select to authenticated
using (user_id = auth.uid());

drop policy if exists "habits_insert_own" on public.habits;
create policy "habits_insert_own"
  on public.habits for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "habits_update_own" on public.habits;
create policy "habits_update_own"
  on public.habits for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "habits_delete_own" on public.habits;
create policy "habits_delete_own"
  on public.habits for delete to authenticated
using (user_id = auth.uid());

-- ─── habit_logs ───────────────────────────────────────────────────────────────

drop policy if exists "habit_logs_select_own" on public.habit_logs;
create policy "habit_logs_select_own"
  on public.habit_logs for select to authenticated
using (user_id = auth.uid());

drop policy if exists "habit_logs_insert_own" on public.habit_logs;
create policy "habit_logs_insert_own"
  on public.habit_logs for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "habit_logs_update_own" on public.habit_logs;
create policy "habit_logs_update_own"
  on public.habit_logs for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "habit_logs_delete_own" on public.habit_logs;
create policy "habit_logs_delete_own"
  on public.habit_logs for delete to authenticated
using (user_id = auth.uid());

-- ─── weight_logs ──────────────────────────────────────────────────────────────

drop policy if exists "weight_logs_select_own" on public.weight_logs;
create policy "weight_logs_select_own"
  on public.weight_logs for select to authenticated
using (user_id = auth.uid());

drop policy if exists "weight_logs_insert_own" on public.weight_logs;
create policy "weight_logs_insert_own"
  on public.weight_logs for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "weight_logs_update_own" on public.weight_logs;
create policy "weight_logs_update_own"
  on public.weight_logs for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "weight_logs_delete_own" on public.weight_logs;
create policy "weight_logs_delete_own"
  on public.weight_logs for delete to authenticated
using (user_id = auth.uid());

-- ─── water_logs ───────────────────────────────────────────────────────────────

alter table public.water_logs enable row level security;

drop policy if exists "water_logs_select_own" on public.water_logs;
create policy "water_logs_select_own"
  on public.water_logs for select to authenticated
using (user_id = auth.uid());

drop policy if exists "water_logs_insert_own" on public.water_logs;
create policy "water_logs_insert_own"
  on public.water_logs for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "water_logs_update_own" on public.water_logs;
create policy "water_logs_update_own"
  on public.water_logs for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- audit: sin políticas de cliente => acceso sólo desde backend/service_role
