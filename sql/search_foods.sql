-- ─── search_foods.sql ────────────────────────────────────────────────────────
-- Búsqueda de alimentos insensible a acentos + ranking, del lado del servidor.
--
-- NO es necesaria hoy: con <~1000 alimentos la app busca en memoria
-- (ver lib/foodSearch.ts). Cuando el catálogo crezca a decenas de miles
-- (ej. importar Open Food Facts), correr esto en el SQL editor de Supabase
-- y cambiar el cliente a `supabase.rpc("search_foods", { q, lim })`.
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists unaccent;
create extension if not exists pg_trgm;

-- unaccent no es IMMUTABLE por defecto; wrapper inmutable para poder indexar.
create or replace function public.immutable_unaccent(text)
returns text language sql immutable parallel safe as $$
  select public.unaccent('public.unaccent', $1)
$$;

-- Índice trigram sobre el nombre normalizado (acelera el %ILIKE%).
create index if not exists foods_name_unaccent_trgm
  on public.foods using gin (public.immutable_unaccent(canonical_name) gin_trgm_ops);

-- Función de búsqueda rankeada. Replica lib/foodSearch.ts:
-- exacto > empieza con la query > empieza una palabra > contiene; + verificado/genérico.
create or replace function public.search_foods(q text, lim int default 30)
returns setof public.foods language sql stable as $$
  with nq as (select public.immutable_unaccent(lower(trim(q))) as v)
  select f.*
  from public.foods f, nq
  where public.immutable_unaccent(f.canonical_name) ilike '%' || nq.v || '%'
  order by
    (case
       when public.immutable_unaccent(lower(f.canonical_name)) = nq.v then 1000
       when public.immutable_unaccent(lower(f.canonical_name)) like nq.v || '%' then 800
       when public.immutable_unaccent(lower(f.canonical_name)) ~ ('\m' || nq.v) then 600
       else 400
     end)
    + (case when f.is_verified then 60 else 0 end)
    + (case when f.is_generic then 25 else 0 end)
    - least(length(f.canonical_name), 60) * 0.5
    desc
  limit lim
$$;
