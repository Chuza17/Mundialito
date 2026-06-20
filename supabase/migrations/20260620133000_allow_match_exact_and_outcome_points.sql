do $$
declare
  constraint_record record;
begin
  for constraint_record in
    select c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'match_score_predictions'
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%points_awarded%'
  loop
    execute format('alter table public.match_score_predictions drop constraint %I', constraint_record.conname);
  end loop;
end $$;

alter table public.match_score_predictions
  add constraint match_score_predictions_points_awarded_range
  check (points_awarded is null or points_awarded between 0 and 3);

comment on constraint match_score_predictions_points_awarded_range on public.match_score_predictions is
  'Match score predictions award 2 points for exact score plus 1 point for correct outcome: home win, draw, or away win.';
