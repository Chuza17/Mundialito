create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'sync-world-cup-results-every-10-minutes') then
    perform cron.unschedule('sync-world-cup-results-every-10-minutes');
  end if;
end $$;

select cron.schedule(
  'sync-world-cup-results-every-10-minutes',
  '*/10 * * * *',
  $$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/sync-results',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
      ),
      body := jsonb_build_object(
        'source', 'pg_cron',
        'reason', 'scheduled-results-refresh',
        'triggered_at', now()
      )
    ) as request_id;
  $$
);
