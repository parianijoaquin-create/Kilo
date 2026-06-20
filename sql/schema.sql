create extension if not exists pgcrypto;
create extension if not exists citext;

-- ─── Profiles ────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email citext,
  display_name text not null default '',
  locale text not null default 'es-AR',
  country_code text not null default 'AR',
  unit_system text not null default 'metric' check (unit_system in ('metric','imperial')),
  birth_date date,
  sex text check (sex in ('male','female','other','prefer_not_to_say')),
  height_cm numeric(5,2) check (height_cm > 0),
  current_weight_kg numeric(6,2) check (current_weight_kg > 0),
  goal_weight_kg numeric(6,2) check (goal_weight_kg > 0),
  activity_level text default 'moderate' check (activity_level in ('sedentary','light','moderate','very','extra')),
  goal_type text default 'maintain' check (goal_type in ('lose','maintain','gain','recomp')),
  daily_target_kcal integer check (daily_target_kcal > 0),
  protein_target_g numeric(7,2),
  carbs_target_g numeric(7,2),
  fat_target_g numeric(7,2),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Food catalog ─────────────────────────────────────────────────────────────

create table if not exists public.food_categories (
  id bigserial primary key,
  parent_id bigint references public.food_categories(id) on delete set null,
  slug text not null unique,
  name text not null,
  sort_order integer not null default 0
);

create table if not exists public.food_sources (
  id bigserial primary key,
  code text not null unique,
  name text not null,
  source_type text not null check (source_type in ('official','community','vendor','manual')),
  base_url text,
  license_name text,
  license_url text,
  refresh_strategy text,
  priority integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.foods (
  id bigserial primary key,
  category_id bigint references public.food_categories(id) on delete set null,
  source_id bigint references public.food_sources(id) on delete restrict,
  source_food_id text,
  canonical_name text not null,
  brand_name text,
  country_code text not null default 'AR',
  is_generic boolean not null default true,
  is_recipe boolean not null default false,
  is_verified boolean not null default false,
  verification_status text not null default 'pending'
    check (verification_status in ('pending','verified','rejected','draft')),
  confidence_score numeric(4,3) default 0.500 check (confidence_score >= 0 and confidence_score <= 1),
  default_portion_name text,
  default_portion_g numeric(8,2),
  density_g_ml numeric(8,4),
  edible_yield_pct numeric(5,2),

  kcal_100g numeric(8,2),
  protein_g_100g numeric(8,2),
  carbs_g_100g numeric(8,2),
  fat_g_100g numeric(8,2),
  fiber_g_100g numeric(8,2),
  sugar_g_100g numeric(8,2),
  sodium_mg_100g numeric(10,2),

  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (source_id, source_food_id)
);

create index if not exists foods_name_idx on public.foods (canonical_name);
create index if not exists foods_verified_idx on public.foods (is_verified, verification_status);
create index if not exists foods_category_idx on public.foods (category_id);

create table if not exists public.barcode_products (
  id bigserial primary key,
  barcode text not null unique,
  food_id bigint not null references public.foods(id) on delete restrict,
  source_id bigint references public.food_sources(id) on delete restrict,
  gtin_type text check (gtin_type in ('EAN8','UPC','EAN13','GTIN14')),
  product_name text not null,
  brand_name text,
  quantity_label text,
  serving_size_label text,
  ingredients_text text,
  image_front_url text,
  label_lang text default 'es',
  package_size_value numeric(10,2),
  package_size_unit text,
  is_official_label boolean not null default false,
  last_synced_at timestamptz,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists barcode_products_food_idx on public.barcode_products (food_id);
create index if not exists barcode_products_brand_idx on public.barcode_products (brand_name);

-- ─── Meals & diary ────────────────────────────────────────────────────────────

create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  eaten_at timestamptz not null,
  meal_type text not null
    check (meal_type in ('morning','lunch','snack','dinner','custom')),
  title text,
  capture_method text not null default 'manual'
    check (capture_method in ('manual','search','barcode','ocr','photo','recipe')),
  estimation_status text not null default 'final'
    check (estimation_status in ('draft','estimated','pending_review','final')),
  photo_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists meals_user_date_idx on public.meals(user_id, eaten_at desc);

create table if not exists public.meal_items (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.meals(id) on delete cascade,
  food_id bigint references public.foods(id) on delete set null,
  barcode_product_id bigint references public.barcode_products(id) on delete set null,
  item_name_snapshot text not null,
  quantity numeric(10,2),
  unit text,
  grams numeric(10,2) check (grams >= 0),
  servings numeric(10,2) check (servings >= 0),
  calories_kcal numeric(10,2),
  protein_g numeric(10,2),
  carbs_g numeric(10,2),
  fat_g numeric(10,2),
  fiber_g numeric(10,2),
  sodium_mg numeric(10,2),
  sugar_g numeric(10,2),
  confidence_score numeric(4,3) default 1.000 check (confidence_score >= 0 and confidence_score <= 1),
  source_method text default 'manual'
    check (source_method in ('manual','barcode','ocr','photo','recipe')),
  raw_estimation jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists meal_items_meal_idx on public.meal_items(meal_id);

-- ─── Habits ───────────────────────────────────────────────────────────────────

create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  code text,
  title text not null,
  target_value numeric(10,2),
  target_unit text,
  frequency text not null default 'daily'
    check (frequency in ('daily','weekly','custom')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists habits_user_idx on public.habits(user_id);

create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  logged_at timestamptz not null,
  log_date date generated always as ((logged_at at time zone 'UTC')::date) stored,
  value numeric(10,2),
  status text not null default 'done'
    check (status in ('done','partial','skipped')),
  note text,
  created_at timestamptz not null default now(),
  unique(habit_id, log_date)
);

create index if not exists habit_logs_user_date_idx on public.habit_logs(user_id, log_date desc);

-- ─── Weight logs ──────────────────────────────────────────────────────────────

create table if not exists public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  logged_at timestamptz not null,
  weight_kg numeric(6,2) not null check (weight_kg > 0),
  body_fat_pct numeric(5,2),
  muscle_mass_kg numeric(6,2),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists weight_logs_user_date_idx on public.weight_logs(user_id, logged_at desc);

-- ─── Water logs ───────────────────────────────────────────────────────────────

create table if not exists public.water_logs (
  user_id uuid not null references public.profiles(id) on delete cascade,
  log_date date not null,
  glasses int not null default 0 check (glasses >= 0 and glasses <= 50),
  updated_at timestamptz not null default now(),
  primary key (user_id, log_date)
);

create index if not exists water_logs_user_date_idx on public.water_logs(user_id, log_date desc);

drop trigger if exists water_logs_updated_at on public.water_logs;
create trigger water_logs_updated_at before update on public.water_logs
  for each row execute function public.set_updated_at();

-- ─── Reminders ────────────────────────────────────────────────────────────────

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('meal','water','habit','weight','custom')),
  label text not null,
  time_of_day time not null,
  days_of_week int[] not null default '{1,2,3,4,5,6,7}',
  enabled boolean not null default true,
  last_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Idempotente para bases ya creadas sin la columna.
alter table public.reminders add column if not exists last_sent_at timestamptz;

create index if not exists reminders_user_idx on public.reminders(user_id, enabled);

drop trigger if exists reminders_updated_at on public.reminders;
create trigger reminders_updated_at before update on public.reminders
  for each row execute function public.set_updated_at();

-- ─── Push subscriptions ───────────────────────────────────────────────────────

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions(user_id);

-- ─── Audit log ────────────────────────────────────────────────────────────────

create table if not exists public.audit (
  id bigserial primary key,
  actor_user_id uuid references public.profiles(id) on delete set null,
  table_name text not null,
  record_pk text not null,
  action text not null check (action in ('insert','update','delete','verify','reject','sync')),
  before_data jsonb,
  after_data jsonb,
  request_id text,
  created_at timestamptz not null default now()
);

-- ─── Trigger: auto-update updated_at ─────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists foods_updated_at on public.foods;
create trigger foods_updated_at before update on public.foods
  for each row execute function public.set_updated_at();

drop trigger if exists barcode_products_updated_at on public.barcode_products;
create trigger barcode_products_updated_at before update on public.barcode_products
  for each row execute function public.set_updated_at();

drop trigger if exists meals_updated_at on public.meals;
create trigger meals_updated_at before update on public.meals
  for each row execute function public.set_updated_at();

-- ─── Trigger: auto-create profile on signup ───────────────────────────────────

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
