alter table public.app_config
  add column if not exists first_place_prize numeric(12, 2) not null default 0;

alter table public.app_config
  add column if not exists second_place_prize numeric(12, 2) not null default 0;

alter table public.app_config
  add column if not exists third_place_prize numeric(12, 2) not null default 0;
