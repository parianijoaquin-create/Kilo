-- Rate limiting persistente (serverless-safe).
-- El límite en memoria del proceso no sirve en Vercel: cada request puede caer
-- en otra instancia. Acá lo movemos a Postgres con un contador atómico por
-- ventana fija (fixed-window).

create table if not exists public.api_rate_limits (
  user_id      uuid        not null,
  action       text        not null,
  window_start timestamptz not null,
  count        int         not null default 0,
  primary key (user_id, action, window_start)
);

alter table public.api_rate_limits enable row level security;
-- Sin policies: solo se accede vía la función security-definer de abajo
-- (y el service_role, que bypassa RLS).

-- Suma 1 al contador de la ventana actual de forma atómica y devuelve si la
-- request está permitida (count <= max). El insert ... on conflict ... returning
-- es atómico, así que dos requests simultáneas no se pisan.
create or replace function public.consume_rate_limit(
  p_user_id        uuid,
  p_action         text,
  p_max            int,
  p_window_seconds int
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window timestamptz;
  v_count  int;
begin
  v_window := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.api_rate_limits (user_id, action, window_start, count)
    values (p_user_id, p_action, v_window, 1)
  on conflict (user_id, action, window_start)
    do update set count = public.api_rate_limits.count + 1
    returning count into v_count;

  return v_count <= p_max;
end;
$$;

-- Este RPC acepta un user_id y también protege un contador global. Exponerlo a
-- authenticated permitiría agotar el cupo de otra persona o el global. Solo los
-- Route Handlers del servidor, usando service_role, pueden ejecutarlo.
revoke execute on function public.consume_rate_limit(uuid, text, int, int)
  from public, anon, authenticated;
grant execute on function public.consume_rate_limit(uuid, text, int, int)
  to service_role;

-- Limpieza opcional de ventanas viejas (corré esto cada tanto o en el cron):
--   delete from public.api_rate_limits where window_start < now() - interval '1 day';
