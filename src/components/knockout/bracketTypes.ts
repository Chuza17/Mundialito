export interface BracketTeam {
  id: string | number
  name: string
  code?: string | null
  group_letter?: string | null
}

export interface BracketMatch {
  match_code: string
  round: string
  display_name?: string | null
  homeTeam?: BracketTeam | null
  awayTeam?: BracketTeam | null
  winnerTeamId?: string | number | BracketTeam | null
  canPredict?: boolean
  home_source_type?: string | null
  home_source_group?: string | null
  home_source_position?: string | number | null
  home_source_match?: string | null
  away_source_type?: string | null
  away_source_group?: string | null
  away_source_position?: string | number | null
  away_source_match?: string | null
}

export interface BracketBoardProps {
  matches: BracketMatch[]
  disabled?: boolean
  onPick: (matchCode: string, winnerTeamId: string | number) => void
  championTeam?: BracketTeam | null
  celebrate?: boolean
  isSimulationMode?: boolean
}
