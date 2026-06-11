-- Save a complete group in one transaction so position swaps cannot violate
-- the unique (user, group, predicted_position) constraint mid-update.
create or replace function public.save_group_predictions(
  p_group_letter text,
  p_rows jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_group_letter text := upper(trim(p_group_letter));
  v_team_count integer;
  v_position_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required.';
  end if;

  if v_group_letter !~ '^[A-L]$' then
    raise exception 'Invalid group letter.';
  end if;

  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) <> 4 then
    raise exception 'A group must contain exactly four predictions.';
  end if;

  select count(distinct (row_data ->> 'predicted_position')::integer)
  into v_position_count
  from jsonb_array_elements(p_rows) as rows(row_data)
  where (row_data ->> 'predicted_position')::integer between 1 and 4;

  if v_position_count <> 4 then
    raise exception 'Predicted positions must be unique from 1 to 4.';
  end if;

  select count(distinct teams.id)
  into v_team_count
  from jsonb_array_elements(p_rows) as rows(row_data)
  join public.teams
    on teams.id = (row_data ->> 'team_id')::bigint
   and teams.group_letter = v_group_letter;

  if v_team_count <> 4 then
    raise exception 'Every selected team must belong to the requested group.';
  end if;

  delete from public.group_predictions
  where user_id = v_user_id
    and group_letter = v_group_letter;

  insert into public.group_predictions (
    user_id,
    team_id,
    group_letter,
    predicted_position,
    predicted_points
  )
  select
    v_user_id,
    (row_data ->> 'team_id')::bigint,
    v_group_letter,
    (row_data ->> 'predicted_position')::integer,
    greatest(0, coalesce((row_data ->> 'predicted_points')::integer, 0))
  from jsonb_array_elements(p_rows) as rows(row_data);
end;
$$;

revoke execute on function public.save_group_predictions(text, jsonb) from public;
grant execute on function public.save_group_predictions(text, jsonb) to authenticated;
