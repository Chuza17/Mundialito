import logoElMundialito from '../assets/branding/logo_el_mundial.png'

// Auto-discover all flag images in any flags-* folder, any format
const flagModules = import.meta.glob('../assets/flags-*/*', { eager: true })

// Map: normalized filename (lowercase, no extension) → imported URL
const flagByName = {}
for (const [path, mod] of Object.entries(flagModules)) {
  const filename = path.split('/').pop().replace(/\.[^.]+$/, '').toLowerCase()
  flagByName[filename] = mod.default ?? mod
}

// Map: team code → normalized filename in the flags-* folders
// Normalized = lowercase, no extension (last dot stripped)
const CODE_TO_FILENAME = {
  // Group A
  MEX: 'mexico',
  KOR: 'korea del sur',
  RSA: 'sudafrica',
  CZE: 'republica checa',
  // Group B
  CAN: 'canada',
  BIH: 'bosnia',
  QAT: 'quatar',
  SUI: 'suiza',
  // Group C
  BRA: 'brasil',
  MAR: 'marruecos',
  SCO: 'escocia',
  HAI: 'haiti',
  // Group D
  USA: 'flag_of_the_united_states',
  AUS: 'flag_of_australia_(converted).svg',
  PAR: 'bandera-pais-paraguay-panorama-fondo-tela-seda-ondulada-ilustracion_532963-1211',
  TUR: 'flag_of_turkey',
  // Group E
  GER: 'flag_of_germany',
  CIV: '-flag-of-costa_de_marfil',
  CUW: 'flag_of_curaçao',
  ECU: 'flag_of_ecuador.svg',
  // Group F
  NED: 'flag_of_the_netherlands',
  JPN: 'flag_of_japan',
  TUN: 'flag_of_tunez',
  SWE: 'flag_of_sweden.svg',
  // Group G
  BEL: 'flag_of_belgium.svg',
  EGY: 'flag_of_egypt.svg',
  IRN: 'flag_of_iran',
  NZL: 'flag_of_new_zealand.svg',
  // Group H
  ESP: 'flag_of_spain.svg',
  CPV: 'flag_of_cape_verde.svg',
  SAU: 'flag_of_saudi_arabia',
  KSA: 'flag_of_saudi_arabia',
  URU: 'flag_of_uruguay.svg',
  // Group I
  FRA: 'ensign_of_france.svg',
  SEN: 'flag_of_senegal.svg',
  IRQ: 'flag_og_egypt',
  NOR: 'flag_og_noruega',
  // Group J
  ARG: 'flag_of_argentina.svg',
  ALG: 'argelia',
  AUT: 'flag_of_austria.svg',
  JOR: 'jordania',
  // Group K
  POR: 'flag_of_portugal.svg',
  COD: 'republica del congo',
  UZB: 'uzbekistan',
  COL: 'colombia',
  // Group L
  ENG: 'flag_of_england',
  CRO: 'croacia',
  GHA: 'ghana',
  PAN: 'panama',
}

export const TEAM_ASSET_MAP = Object.fromEntries(
  Object.entries(CODE_TO_FILENAME).map(([code, name]) => [code, flagByName[name]]).filter(([, v]) => v)
)

export const APP_NAME = 'El Mundialito'
export const APP_LOGO = logoElMundialito
export const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

export const ROUNDS = {
  ROUND_OF_32: 'round_of_32',
  ROUND_OF_16: 'round_of_16',
  QUARTER_FINALS: 'quarter_finals',
  SEMI_FINALS: 'semi_finals',
  FINAL: 'final',
}

export const ROUND_NAMES = {
  round_of_32: '16avos de Final',
  round_of_16: 'Octavos de Final',
  quarter_finals: 'Cuartos de Final',
  semi_finals: 'Semifinales',
  final: 'Final',
}

export const MATCH_COUNTS = {
  round_of_32: 16,
  round_of_16: 8,
  quarter_finals: 4,
  semi_finals: 2,
  final: 1,
}

export const DEFAULT_DEADLINE = '2026-06-11T00:00:00Z'


export const FALLBACK_TEAMS = [
  { id: 'fallback-mex', name: 'México', code: 'MEX', flag_emoji: '🇲🇽', group_letter: 'A' },
  { id: 'fallback-kor', name: 'Corea del Sur', code: 'KOR', flag_emoji: '🇰🇷', group_letter: 'A' },
  { id: 'fallback-rsa', name: 'Sudáfrica', code: 'RSA', flag_emoji: '🇿🇦', group_letter: 'A' },
  { id: 'fallback-cze', name: 'República Checa', code: 'CZE', flag_emoji: '🇨🇿', group_letter: 'A' },
  { id: 'fallback-can', name: 'Canadá', code: 'CAN', flag_emoji: '🇨🇦', group_letter: 'B' },
  { id: 'fallback-bih', name: 'Bosnia y Herzegovina', code: 'BIH', flag_emoji: '🇧🇦', group_letter: 'B' },
  { id: 'fallback-qat', name: 'Catar', code: 'QAT', flag_emoji: '🇶🇦', group_letter: 'B' },
  { id: 'fallback-sui', name: 'Suiza', code: 'SUI', flag_emoji: '🇨🇭', group_letter: 'B' },
  { id: 'fallback-bra', name: 'Brasil', code: 'BRA', flag_emoji: '🇧🇷', group_letter: 'C' },
  { id: 'fallback-mar', name: 'Marruecos', code: 'MAR', flag_emoji: '🇲🇦', group_letter: 'C' },
  { id: 'fallback-sco', name: 'Escocia', code: 'SCO', flag_emoji: '🏴', group_letter: 'C' },
  { id: 'fallback-hai', name: 'Haití', code: 'HAI', flag_emoji: '🇭🇹', group_letter: 'C' },
  { id: 'fallback-usa', name: 'Estados Unidos', code: 'USA', flag_emoji: '🇺🇸', group_letter: 'D' },
  { id: 'fallback-aus', name: 'Australia', code: 'AUS', flag_emoji: '🇦🇺', group_letter: 'D' },
  { id: 'fallback-par', name: 'Paraguay', code: 'PAR', flag_emoji: '🇵🇾', group_letter: 'D' },
  { id: 'fallback-tur', name: 'Turquía', code: 'TUR', flag_emoji: '🇹🇷', group_letter: 'D' },
  { id: 'fallback-ger', name: 'Alemania', code: 'GER', flag_emoji: '🇩🇪', group_letter: 'E' },
  { id: 'fallback-cuw', name: 'Curaçao', code: 'CUW', flag_emoji: '🇨🇼', group_letter: 'E' },
  { id: 'fallback-civ', name: 'Costa de Marfil', code: 'CIV', flag_emoji: '🇨🇮', group_letter: 'E' },
  { id: 'fallback-ecu', name: 'Ecuador', code: 'ECU', flag_emoji: '🇪🇨', group_letter: 'E' },
  { id: 'fallback-ned', name: 'Países Bajos', code: 'NED', flag_emoji: '🇳🇱', group_letter: 'F' },
  { id: 'fallback-jpn', name: 'Japón', code: 'JPN', flag_emoji: '🇯🇵', group_letter: 'F' },
  { id: 'fallback-tun', name: 'Túnez', code: 'TUN', flag_emoji: '🇹🇳', group_letter: 'F' },
  { id: 'fallback-swe', name: 'Suecia', code: 'SWE', flag_emoji: '🇸🇪', group_letter: 'F' },
  { id: 'fallback-bel', name: 'Bélgica', code: 'BEL', flag_emoji: '🇧🇪', group_letter: 'G' },
  { id: 'fallback-egy', name: 'Egipto', code: 'EGY', flag_emoji: '🇪🇬', group_letter: 'G' },
  { id: 'fallback-irn', name: 'Irán', code: 'IRN', flag_emoji: '🇮🇷', group_letter: 'G' },
  { id: 'fallback-nzl', name: 'Nueva Zelanda', code: 'NZL', flag_emoji: '🇳🇿', group_letter: 'G' },
  { id: 'fallback-esp', name: 'España', code: 'ESP', flag_emoji: '🇪🇸', group_letter: 'H' },
  { id: 'fallback-cpv', name: 'Cabo Verde', code: 'CPV', flag_emoji: '🇨🇻', group_letter: 'H' },
  { id: 'fallback-sau', name: 'Arabia Saudita', code: 'SAU', flag_emoji: '🇸🇦', group_letter: 'H' },
  { id: 'fallback-uru', name: 'Uruguay', code: 'URU', flag_emoji: '🇺🇾', group_letter: 'H' },
  { id: 'fallback-fra', name: 'Francia', code: 'FRA', flag_emoji: '🇫🇷', group_letter: 'I' },
  { id: 'fallback-sen', name: 'Senegal', code: 'SEN', flag_emoji: '🇸🇳', group_letter: 'I' },
  { id: 'fallback-irq', name: 'Irak', code: 'IRQ', flag_emoji: '🇮🇶', group_letter: 'I' },
  { id: 'fallback-nor', name: 'Noruega', code: 'NOR', flag_emoji: '🇳🇴', group_letter: 'I' },
  { id: 'fallback-arg', name: 'Argentina', code: 'ARG', flag_emoji: '🇦🇷', group_letter: 'J' },
  { id: 'fallback-alg', name: 'Argelia', code: 'ALG', flag_emoji: '🇩🇿', group_letter: 'J' },
  { id: 'fallback-aut', name: 'Austria', code: 'AUT', flag_emoji: '🇦🇹', group_letter: 'J' },
  { id: 'fallback-jor', name: 'Jordania', code: 'JOR', flag_emoji: '🇯🇴', group_letter: 'J' },
  { id: 'fallback-por', name: 'Portugal', code: 'POR', flag_emoji: '🇵🇹', group_letter: 'K' },
  { id: 'fallback-cod', name: 'R.D. del Congo', code: 'COD', flag_emoji: '🇨🇩', group_letter: 'K' },
  { id: 'fallback-uzb', name: 'Uzbekistán', code: 'UZB', flag_emoji: '🇺🇿', group_letter: 'K' },
  { id: 'fallback-col', name: 'Colombia', code: 'COL', flag_emoji: '🇨🇴', group_letter: 'K' },
  { id: 'fallback-eng', name: 'Inglaterra', code: 'ENG', flag_emoji: '🏴', group_letter: 'L' },
  { id: 'fallback-cro', name: 'Croacia', code: 'CRO', flag_emoji: '🇭🇷', group_letter: 'L' },
  { id: 'fallback-gha', name: 'Ghana', code: 'GHA', flag_emoji: '🇬🇭', group_letter: 'L' },
  { id: 'fallback-pan', name: 'Panamá', code: 'PAN', flag_emoji: '🇵🇦', group_letter: 'L' },
]

export const FALLBACK_MATCHES = [
  { match_code: 'R32_01', round: ROUNDS.ROUND_OF_32, display_name: 'Partido 73', home_source_type: 'group_position', home_source_group: 'A', home_source_position: 2, away_source_type: 'group_position', away_source_group: 'B', away_source_position: 2 },
  { match_code: 'R32_02', round: ROUNDS.ROUND_OF_32, display_name: 'Partido 74', home_source_type: 'group_position', home_source_group: 'C', home_source_position: 1, away_source_type: 'best_third', away_third_options: ['A', 'B', 'C', 'D', 'F'] },
  { match_code: 'R32_03', round: ROUNDS.ROUND_OF_32, display_name: 'Partido 75', home_source_type: 'group_position', home_source_group: 'F', home_source_position: 1, away_source_type: 'group_position', away_source_group: 'C', away_source_position: 2 },
  { match_code: 'R32_04', round: ROUNDS.ROUND_OF_32, display_name: 'Partido 76', home_source_type: 'group_position', home_source_group: 'E', home_source_position: 1, away_source_type: 'group_position', away_source_group: 'F', away_source_position: 2 },
  { match_code: 'R32_05', round: ROUNDS.ROUND_OF_32, display_name: 'Partido 77', home_source_type: 'group_position', home_source_group: 'I', home_source_position: 1, away_source_type: 'best_third', away_third_options: ['C', 'D', 'F', 'G', 'H'] },
  { match_code: 'R32_06', round: ROUNDS.ROUND_OF_32, display_name: 'Partido 78', home_source_type: 'group_position', home_source_group: 'E', home_source_position: 2, away_source_type: 'group_position', away_source_group: 'I', away_source_position: 2 },
  { match_code: 'R32_07', round: ROUNDS.ROUND_OF_32, display_name: 'Partido 79', home_source_type: 'group_position', home_source_group: 'A', home_source_position: 1, away_source_type: 'best_third', away_third_options: ['C', 'E', 'F', 'H', 'I'] },
  { match_code: 'R32_08', round: ROUNDS.ROUND_OF_32, display_name: 'Partido 80', home_source_type: 'group_position', home_source_group: 'L', home_source_position: 1, away_source_type: 'best_third', away_third_options: ['E', 'H', 'I', 'J', 'K'] },
  { match_code: 'R32_09', round: ROUNDS.ROUND_OF_32, display_name: 'Partido 81', home_source_type: 'group_position', home_source_group: 'D', home_source_position: 1, away_source_type: 'best_third', away_third_options: ['B', 'E', 'F', 'I', 'J'] },
  { match_code: 'R32_10', round: ROUNDS.ROUND_OF_32, display_name: 'Partido 82', home_source_type: 'group_position', home_source_group: 'G', home_source_position: 1, away_source_type: 'best_third', away_third_options: ['A', 'E', 'H', 'I', 'J'] },
  { match_code: 'R32_11', round: ROUNDS.ROUND_OF_32, display_name: 'Partido 83', home_source_type: 'group_position', home_source_group: 'K', home_source_position: 2, away_source_type: 'group_position', away_source_group: 'L', away_source_position: 2 },
  { match_code: 'R32_12', round: ROUNDS.ROUND_OF_32, display_name: 'Partido 84', home_source_type: 'group_position', home_source_group: 'H', home_source_position: 1, away_source_type: 'group_position', away_source_group: 'G', away_source_position: 2 },
  { match_code: 'R32_13', round: ROUNDS.ROUND_OF_32, display_name: 'Partido 85', home_source_type: 'group_position', home_source_group: 'J', home_source_position: 1, away_source_type: 'best_third', away_third_options: ['A', 'B', 'G', 'H', 'L'] },
  { match_code: 'R32_14', round: ROUNDS.ROUND_OF_32, display_name: 'Partido 86', home_source_type: 'group_position', home_source_group: 'B', home_source_position: 1, away_source_type: 'group_position', away_source_group: 'D', away_source_position: 2 },
  { match_code: 'R32_15', round: ROUNDS.ROUND_OF_32, display_name: 'Partido 87', home_source_type: 'group_position', home_source_group: 'H', home_source_position: 2, away_source_type: 'group_position', away_source_group: 'J', away_source_position: 2 },
  { match_code: 'R32_16', round: ROUNDS.ROUND_OF_32, display_name: 'Partido 88', home_source_type: 'group_position', home_source_group: 'K', home_source_position: 1, away_source_type: 'best_third', away_third_options: ['B', 'D', 'G', 'K', 'L'] },
  { match_code: 'R16_01', round: ROUNDS.ROUND_OF_16, display_name: 'Octavo 1', home_source_type: 'match_winner', home_source_match: 'R32_01', away_source_type: 'match_winner', away_source_match: 'R32_02' },
  { match_code: 'R16_02', round: ROUNDS.ROUND_OF_16, display_name: 'Octavo 2', home_source_type: 'match_winner', home_source_match: 'R32_03', away_source_type: 'match_winner', away_source_match: 'R32_04' },
  { match_code: 'R16_03', round: ROUNDS.ROUND_OF_16, display_name: 'Octavo 3', home_source_type: 'match_winner', home_source_match: 'R32_05', away_source_type: 'match_winner', away_source_match: 'R32_06' },
  { match_code: 'R16_04', round: ROUNDS.ROUND_OF_16, display_name: 'Octavo 4', home_source_type: 'match_winner', home_source_match: 'R32_07', away_source_type: 'match_winner', away_source_match: 'R32_08' },
  { match_code: 'R16_05', round: ROUNDS.ROUND_OF_16, display_name: 'Octavo 5', home_source_type: 'match_winner', home_source_match: 'R32_09', away_source_type: 'match_winner', away_source_match: 'R32_10' },
  { match_code: 'R16_06', round: ROUNDS.ROUND_OF_16, display_name: 'Octavo 6', home_source_type: 'match_winner', home_source_match: 'R32_11', away_source_type: 'match_winner', away_source_match: 'R32_12' },
  { match_code: 'R16_07', round: ROUNDS.ROUND_OF_16, display_name: 'Octavo 7', home_source_type: 'match_winner', home_source_match: 'R32_13', away_source_type: 'match_winner', away_source_match: 'R32_14' },
  { match_code: 'R16_08', round: ROUNDS.ROUND_OF_16, display_name: 'Octavo 8', home_source_type: 'match_winner', home_source_match: 'R32_15', away_source_type: 'match_winner', away_source_match: 'R32_16' },
  { match_code: 'QF_01', round: ROUNDS.QUARTER_FINALS, display_name: 'Cuarto 1', home_source_type: 'match_winner', home_source_match: 'R16_01', away_source_type: 'match_winner', away_source_match: 'R16_02' },
  { match_code: 'QF_02', round: ROUNDS.QUARTER_FINALS, display_name: 'Cuarto 2', home_source_type: 'match_winner', home_source_match: 'R16_03', away_source_type: 'match_winner', away_source_match: 'R16_04' },
  { match_code: 'QF_03', round: ROUNDS.QUARTER_FINALS, display_name: 'Cuarto 3', home_source_type: 'match_winner', home_source_match: 'R16_05', away_source_type: 'match_winner', away_source_match: 'R16_06' },
  { match_code: 'QF_04', round: ROUNDS.QUARTER_FINALS, display_name: 'Cuarto 4', home_source_type: 'match_winner', home_source_match: 'R16_07', away_source_type: 'match_winner', away_source_match: 'R16_08' },
  { match_code: 'SF_01', round: ROUNDS.SEMI_FINALS, display_name: 'Semi 1', home_source_type: 'match_winner', home_source_match: 'QF_01', away_source_type: 'match_winner', away_source_match: 'QF_02' },
  { match_code: 'SF_02', round: ROUNDS.SEMI_FINALS, display_name: 'Semi 2', home_source_type: 'match_winner', home_source_match: 'QF_03', away_source_type: 'match_winner', away_source_match: 'QF_04' },
  { match_code: 'FIN_01', round: ROUNDS.FINAL, display_name: 'Final', home_source_type: 'match_winner', home_source_match: 'SF_01', away_source_type: 'match_winner', away_source_match: 'SF_02' },
]
