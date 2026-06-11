-- Ensure every official FIFA World Cup 2026 knockout match has its public number.
update public.knockout_matches
set display_name = case match_code
  when 'R32_01' then 'Partido 73'
  when 'R32_02' then 'Partido 74'
  when 'R32_03' then 'Partido 75'
  when 'R32_04' then 'Partido 76'
  when 'R32_05' then 'Partido 77'
  when 'R32_06' then 'Partido 78'
  when 'R32_07' then 'Partido 79'
  when 'R32_08' then 'Partido 80'
  when 'R32_09' then 'Partido 81'
  when 'R32_10' then 'Partido 82'
  when 'R32_11' then 'Partido 83'
  when 'R32_12' then 'Partido 84'
  when 'R32_13' then 'Partido 85'
  when 'R32_14' then 'Partido 86'
  when 'R32_15' then 'Partido 87'
  when 'R32_16' then 'Partido 88'
  when 'R16_01' then 'Partido 89'
  when 'R16_02' then 'Partido 90'
  when 'R16_03' then 'Partido 91'
  when 'R16_04' then 'Partido 92'
  when 'R16_05' then 'Partido 93'
  when 'R16_06' then 'Partido 94'
  when 'R16_07' then 'Partido 95'
  when 'R16_08' then 'Partido 96'
  when 'QF_01' then 'Partido 97'
  when 'QF_02' then 'Partido 98'
  when 'QF_03' then 'Partido 99'
  when 'QF_04' then 'Partido 100'
  when 'SF_01' then 'Partido 101'
  when 'SF_02' then 'Partido 102'
  when 'THIRD' then 'Partido 103'
  when 'FIN_01' then 'Partido 104'
  else display_name
end
where match_code in (
  'R32_01', 'R32_02', 'R32_03', 'R32_04',
  'R32_05', 'R32_06', 'R32_07', 'R32_08',
  'R32_09', 'R32_10', 'R32_11', 'R32_12',
  'R32_13', 'R32_14', 'R32_15', 'R32_16',
  'R16_01', 'R16_02', 'R16_03', 'R16_04',
  'R16_05', 'R16_06', 'R16_07', 'R16_08',
  'QF_01', 'QF_02', 'QF_03', 'QF_04',
  'SF_01', 'SF_02', 'THIRD', 'FIN_01'
);
