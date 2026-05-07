-- Align knockout source definitions with FIFA's published FIFA World Cup 2026 bracket.
-- This keeps the stored Supabase rows in sync with the local FALLBACK_MATCHES definitions.

alter table public.knockout_matches
  add column if not exists display_name text;

-- The current remote schema stores best-third slots as group_position with a
-- null group and position 3. Keep that convention while moving the option
-- arrays onto the actual best-third side of each match.
update public.knockout_matches
set
  home_third_options = null,
  away_source_type = 'group_position',
  away_source_group = null,
  away_source_position = 3,
  away_source_match = null,
  away_third_options = case match_code
    when 'R32_02' then array['A', 'B', 'C', 'D', 'F']::text[]
    when 'R32_05' then array['C', 'D', 'F', 'G', 'H']::text[]
    when 'R32_07' then array['C', 'E', 'F', 'H', 'I']::text[]
    when 'R32_08' then array['E', 'H', 'I', 'J', 'K']::text[]
    when 'R32_09' then array['B', 'E', 'F', 'I', 'J']::text[]
    when 'R32_10' then array['A', 'E', 'H', 'I', 'J']::text[]
    when 'R32_13' then array['E', 'F', 'G', 'I', 'J']::text[]
    when 'R32_15' then array['D', 'E', 'I', 'J', 'L']::text[]
  end
where match_code in ('R32_02', 'R32_05', 'R32_07', 'R32_08', 'R32_09', 'R32_10', 'R32_13', 'R32_15');

update public.knockout_matches
set
  round = 'round_of_32',
  display_name = 'Partido 74',
  home_source_type = 'group_position',
  home_source_group = 'E',
  home_source_position = 1,
  home_source_match = null,
  home_third_options = null,
  away_source_type = 'group_position',
  away_source_group = null,
  away_source_position = 3,
  away_source_match = null,
  away_third_options = array['A', 'B', 'C', 'D', 'F']::text[]
where match_code = 'R32_02';

update public.knockout_matches
set
  round = 'round_of_32',
  display_name = 'Partido 76',
  home_source_type = 'group_position',
  home_source_group = 'C',
  home_source_position = 1,
  home_source_match = null,
  home_third_options = null,
  away_source_type = 'group_position',
  away_source_group = 'F',
  away_source_position = 2,
  away_source_match = null,
  away_third_options = null
where match_code = 'R32_04';

update public.knockout_matches
set
  round = 'round_of_32',
  display_name = 'Partido 84',
  home_source_type = 'group_position',
  home_source_group = 'H',
  home_source_position = 1,
  home_source_match = null,
  home_third_options = null,
  away_source_type = 'group_position',
  away_source_group = 'J',
  away_source_position = 2,
  away_source_match = null,
  away_third_options = null
where match_code = 'R32_12';

update public.knockout_matches
set
  round = 'round_of_32',
  display_name = 'Partido 85',
  home_source_type = 'group_position',
  home_source_group = 'B',
  home_source_position = 1,
  home_source_match = null,
  home_third_options = null,
  away_source_type = 'group_position',
  away_source_group = null,
  away_source_position = 3,
  away_source_match = null,
  away_third_options = array['E', 'F', 'G', 'I', 'J']::text[]
where match_code = 'R32_13';

update public.knockout_matches
set
  round = 'round_of_32',
  display_name = 'Partido 86',
  home_source_type = 'group_position',
  home_source_group = 'J',
  home_source_position = 1,
  home_source_match = null,
  home_third_options = null,
  away_source_type = 'group_position',
  away_source_group = 'H',
  away_source_position = 2,
  away_source_match = null,
  away_third_options = null
where match_code = 'R32_14';

update public.knockout_matches
set
  round = 'round_of_32',
  display_name = 'Partido 87',
  home_source_type = 'group_position',
  home_source_group = 'K',
  home_source_position = 1,
  home_source_match = null,
  home_third_options = null,
  away_source_type = 'group_position',
  away_source_group = null,
  away_source_position = 3,
  away_source_match = null,
  away_third_options = array['D', 'E', 'I', 'J', 'L']::text[]
where match_code = 'R32_15';

update public.knockout_matches
set
  round = 'round_of_32',
  display_name = 'Partido 88',
  home_source_type = 'group_position',
  home_source_group = 'D',
  home_source_position = 2,
  home_source_match = null,
  home_third_options = null,
  away_source_type = 'group_position',
  away_source_group = 'G',
  away_source_position = 2,
  away_source_match = null,
  away_third_options = null
where match_code = 'R32_16';

update public.knockout_matches
set round = 'round_of_16', display_name = 'Partido 89',
  home_source_type = 'match_winner', home_source_group = null, home_source_position = null, home_source_match = 'R32_02', home_third_options = null,
  away_source_type = 'match_winner', away_source_group = null, away_source_position = null, away_source_match = 'R32_05', away_third_options = null
where match_code = 'R16_01';

update public.knockout_matches
set round = 'round_of_16', display_name = 'Partido 90',
  home_source_type = 'match_winner', home_source_group = null, home_source_position = null, home_source_match = 'R32_01', home_third_options = null,
  away_source_type = 'match_winner', away_source_group = null, away_source_position = null, away_source_match = 'R32_03', away_third_options = null
where match_code = 'R16_02';

update public.knockout_matches
set round = 'round_of_16', display_name = 'Partido 91',
  home_source_type = 'match_winner', home_source_group = null, home_source_position = null, home_source_match = 'R32_04', home_third_options = null,
  away_source_type = 'match_winner', away_source_group = null, away_source_position = null, away_source_match = 'R32_06', away_third_options = null
where match_code = 'R16_03';

update public.knockout_matches
set round = 'round_of_16', display_name = 'Partido 92',
  home_source_type = 'match_winner', home_source_group = null, home_source_position = null, home_source_match = 'R32_07', home_third_options = null,
  away_source_type = 'match_winner', away_source_group = null, away_source_position = null, away_source_match = 'R32_08', away_third_options = null
where match_code = 'R16_04';

update public.knockout_matches
set round = 'round_of_16', display_name = 'Partido 93',
  home_source_type = 'match_winner', home_source_group = null, home_source_position = null, home_source_match = 'R32_11', home_third_options = null,
  away_source_type = 'match_winner', away_source_group = null, away_source_position = null, away_source_match = 'R32_12', away_third_options = null
where match_code = 'R16_05';

update public.knockout_matches
set round = 'round_of_16', display_name = 'Partido 94',
  home_source_type = 'match_winner', home_source_group = null, home_source_position = null, home_source_match = 'R32_09', home_third_options = null,
  away_source_type = 'match_winner', away_source_group = null, away_source_position = null, away_source_match = 'R32_10', away_third_options = null
where match_code = 'R16_06';

update public.knockout_matches
set round = 'round_of_16', display_name = 'Partido 95',
  home_source_type = 'match_winner', home_source_group = null, home_source_position = null, home_source_match = 'R32_14', home_third_options = null,
  away_source_type = 'match_winner', away_source_group = null, away_source_position = null, away_source_match = 'R32_16', away_third_options = null
where match_code = 'R16_07';

update public.knockout_matches
set round = 'round_of_16', display_name = 'Partido 96',
  home_source_type = 'match_winner', home_source_group = null, home_source_position = null, home_source_match = 'R32_13', home_third_options = null,
  away_source_type = 'match_winner', away_source_group = null, away_source_position = null, away_source_match = 'R32_15', away_third_options = null
where match_code = 'R16_08';

update public.knockout_matches
set round = 'quarter_finals', display_name = 'Partido 97',
  home_source_type = 'match_winner', home_source_group = null, home_source_position = null, home_source_match = 'R16_01', home_third_options = null,
  away_source_type = 'match_winner', away_source_group = null, away_source_position = null, away_source_match = 'R16_02', away_third_options = null
where match_code = 'QF_01';

update public.knockout_matches
set round = 'quarter_finals', display_name = 'Partido 98',
  home_source_type = 'match_winner', home_source_group = null, home_source_position = null, home_source_match = 'R16_05', home_third_options = null,
  away_source_type = 'match_winner', away_source_group = null, away_source_position = null, away_source_match = 'R16_06', away_third_options = null
where match_code = 'QF_02';

update public.knockout_matches
set round = 'quarter_finals', display_name = 'Partido 99',
  home_source_type = 'match_winner', home_source_group = null, home_source_position = null, home_source_match = 'R16_03', home_third_options = null,
  away_source_type = 'match_winner', away_source_group = null, away_source_position = null, away_source_match = 'R16_04', away_third_options = null
where match_code = 'QF_03';

update public.knockout_matches
set round = 'quarter_finals', display_name = 'Partido 100',
  home_source_type = 'match_winner', home_source_group = null, home_source_position = null, home_source_match = 'R16_07', home_third_options = null,
  away_source_type = 'match_winner', away_source_group = null, away_source_position = null, away_source_match = 'R16_08', away_third_options = null
where match_code = 'QF_04';

update public.knockout_matches
set display_name = 'Partido 101'
where match_code = 'SF_01';

update public.knockout_matches
set display_name = 'Partido 102'
where match_code = 'SF_02';

update public.knockout_matches
set display_name = 'Partido 104'
where match_code in ('FIN_01', 'FINAL');
