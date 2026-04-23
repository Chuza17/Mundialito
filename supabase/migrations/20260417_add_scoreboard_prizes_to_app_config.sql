alter table public.app_config
  add column if not exists group_stage_prize numeric(12, 2) not null default 0;

alter table public.app_config
  add column if not exists knockout_prize numeric(12, 2) not null default 0;
