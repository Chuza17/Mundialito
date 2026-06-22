create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

do $$
declare
  cron_job_name text;
begin
  foreach cron_job_name in array array[
    'sync-world-cup-results-every-10-minutes',
    'sync-world-cup-results-hourly',
    'calculate-world-cup-scores-hourly',
    'process-due-world-cup-result-syncs'
  ]
  loop
    if exists (select 1 from cron.job where jobname = cron_job_name) then
      perform cron.unschedule(cron_job_name);
    end if;
  end loop;
end $$;

create table if not exists public.world_cup_result_sync_jobs (
  id bigint generated always as identity primary key,
  match_id uuid not null references public.world_cup_matches(id) on delete cascade,
  api_match_id bigint,
  match_code text,
  scheduled_for timestamptz not null,
  requested_at timestamptz,
  request_id bigint,
  attempt_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (match_id)
);

alter table public.world_cup_result_sync_jobs enable row level security;

create index if not exists world_cup_result_sync_jobs_due_idx
  on public.world_cup_result_sync_jobs (scheduled_for)
  where requested_at is null;

comment on table public.world_cup_result_sync_jobs is
  'Internal schedule for one result sync after each match is expected to be finished.';

create or replace function public.refresh_world_cup_result_sync_jobs()
returns integer
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  affected_rows integer;
begin
  insert into public.world_cup_result_sync_jobs (
    match_id,
    api_match_id,
    match_code,
    scheduled_for
  )
  select
    m.id,
    m.api_match_id,
    m.match_code,
    m.utc_date + interval '130 minutes'
  from public.world_cup_matches as m
  where m.utc_date is not null
    and m.api_match_id is not null
  on conflict (match_id) do update
    set api_match_id = excluded.api_match_id,
        match_code = excluded.match_code,
        scheduled_for = excluded.scheduled_for,
        updated_at = now()
  where public.world_cup_result_sync_jobs.requested_at is null;

  get diagnostics affected_rows = row_count;
  return affected_rows;
end;
$$;

create or replace function public.run_due_world_cup_result_sync()
returns bigint
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  due_job_ids bigint[];
  http_request_id bigint;
begin
  perform public.refresh_world_cup_result_sync_jobs();

  select array_agg(id)
  into due_job_ids
  from (
    select id
    from public.world_cup_result_sync_jobs
    where requested_at is null
      and scheduled_for <= now()
    order by scheduled_for
    for update skip locked
  ) as due_jobs;

  if due_job_ids is null or array_length(due_job_ids, 1) = 0 then
    return null;
  end if;

  update public.world_cup_result_sync_jobs
  set requested_at = now(),
      attempt_count = attempt_count + 1,
      updated_at = now()
  where id = any(due_job_ids);

  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/sync-results',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := jsonb_build_object(
      'source', 'pg_cron_due_matches',
      'reason', 'match-finished-delay',
      'due_job_count', array_length(due_job_ids, 1),
      'triggered_at', now()
    ),
    timeout_milliseconds := 60000
  )
  into http_request_id;

  update public.world_cup_result_sync_jobs
  set request_id = http_request_id,
      updated_at = now()
  where id = any(due_job_ids);

  return http_request_id;
end;
$$;

revoke all on table public.world_cup_result_sync_jobs from anon, authenticated;
revoke all on function public.refresh_world_cup_result_sync_jobs() from anon, authenticated;
revoke all on function public.run_due_world_cup_result_sync() from anon, authenticated;

select public.refresh_world_cup_result_sync_jobs();

select cron.schedule(
  'process-due-world-cup-result-syncs',
  '* * * * *',
  $$ select public.run_due_world_cup_result_sync(); $$
);
