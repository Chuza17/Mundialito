-- Keep the remote final match code aligned with the frontend and scoring logic.
update public.knockout_matches
set
  match_code = 'FIN_01',
  display_name = 'Partido 104'
where match_code = 'FINAL';

update public.knockout_matches
set display_name = 'Partido 104'
where match_code = 'FIN_01';
