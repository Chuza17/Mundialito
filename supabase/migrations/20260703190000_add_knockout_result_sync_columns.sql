alter table public.real_results_knockout
  add column if not exists round text,
  add column if not exists status text,
  add column if not exists played_at timestamptz,
  add column if not exists api_match_id bigint;

create index if not exists real_results_knockout_api_match_id_idx
  on public.real_results_knockout (api_match_id)
  where api_match_id is not null;

comment on column public.real_results_knockout.round is
  'Knockout round copied from knockout_matches when provider results are synchronized.';

comment on column public.real_results_knockout.status is
  'Provider match status from football-data.org.';

comment on column public.real_results_knockout.played_at is
  'Provider kickoff timestamp for the matched knockout fixture.';

comment on column public.real_results_knockout.api_match_id is
  'football-data.org match id used to sync this knockout result.';
