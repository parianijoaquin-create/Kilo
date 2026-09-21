-- Programador de recordatorios push para producción.
--
-- Requisito previo (NO guardar el valor en Git): crear en Supabase Vault un
-- secreto llamado `kilo_cron_secret` con exactamente el mismo valor de
-- `CRON_SECRET` configurado en Vercel.
--
-- Ejemplo para ejecutar manualmente en el SQL Editor, reemplazando el valor:
-- select vault.create_secret('VALOR_DE_CRON_SECRET', 'kilo_cron_secret');
--
-- Si el secreto ya existe, actualizarlo desde Database > Vault o con
-- vault.update_secret(). Este archivo falla de forma segura si falta el secreto.

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

do $$
begin
  if not exists (
    select 1
    from vault.secrets
    where name = 'kilo_cron_secret'
  ) then
    raise exception 'Falta el secreto kilo_cron_secret en Supabase Vault';
  end if;
end
$$;

-- cron.schedule reemplaza el job si ya existe otro con el mismo nombre.
select cron.schedule(
  'kilo-reminders-every-5-minutes',
  '*/5 * * * *',
  $job$
    select net.http_get(
      url := 'https://kilo-rho.vercel.app/api/notifications/cron-send?window=5',
      headers := jsonb_build_object(
        'Authorization',
        'Bearer ' || (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'kilo_cron_secret'
        )
      ),
      timeout_milliseconds := 10000
    ) as request_id;
  $job$
);

-- Verificación: debe devolver una fila activa con el nombre anterior.
select jobid, jobname, schedule, active
from cron.job
where jobname = 'kilo-reminders-every-5-minutes';
