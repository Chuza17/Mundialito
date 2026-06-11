-- Close all predictions at 1:00 p.m. Costa Rica time on June 11, 2026.
-- Costa Rica is UTC-6 year-round, so the stored UTC timestamp is 19:00.
update public.app_config
set
  value = '"2026-06-11T19:00:00Z"'::jsonb,
  updated_at = now()
where key = 'predictions_deadline';
