export const ROUND_POINTS = {
  round_of_32: 2,
  round_of_16: 3,
  quarter_finals: 5,
  semi_finals: 8,
  final: 10,
} as const

export const PROVIDER_STAGE_TO_ROUND: Record<string, string> = {
  LAST_32: 'round_of_32',
  ROUND_OF_32: 'round_of_32',
  LAST_16: 'round_of_16',
  ROUND_OF_16: 'round_of_16',
  QUARTER_FINALS: 'quarter_finals',
  SEMI_FINALS: 'semi_finals',
  FINAL: 'final',
}

const TEAM_NAME_ALIASES: Record<string, string[]> = {
  mexico: ['mexico'],
  'corea del sur': ['south korea', 'republic of korea', 'korea republic', 'korea'],
  sudafrica: ['south africa'],
  'republica checa': ['czech republic', 'czechia'],
  canada: ['canada'],
  'bosnia y herzegovina': ['bosnia and herzegovina', 'bosnia-herzegovina', 'bosnia'],
  catar: ['qatar'],
  suiza: ['switzerland'],
  brasil: ['brazil'],
  marruecos: ['morocco'],
  escocia: ['scotland'],
  haiti: ['haiti'],
  'estados unidos': ['united states', 'usa', 'u.s.a.'],
  australia: ['australia'],
  paraguay: ['paraguay'],
  turquia: ['turkiye', 'turkey'],
  alemania: ['germany'],
  cameroon: ['cameroun', 'cameroon'],
  nigeria: ['nigeria'],
  peru: ['peru'],
  'paises bajos': ['netherlands', 'holland'],
  japon: ['japan'],
  tunez: ['tunisia'],
  suecia: ['sweden'],
  belgica: ['belgium'],
  egipto: ['egypt'],
  iran: ['ir iran', 'iran'],
  'nueva zelanda': ['new zealand'],
  espana: ['spain'],
  'cabo verde': ['cape verde', 'cape verde islands'],
  'arabia saudita': ['saudi arabia'],
  uruguay: ['uruguay'],
  francia: ['france'],
  senegal: ['senegal'],
  irak: ['iraq'],
  noruega: ['norway'],
  argentina: ['argentina'],
  argelia: ['algeria'],
  austria: ['austria'],
  jordania: ['jordan'],
  portugal: ['portugal'],
  'r d del congo': ['dr congo', 'democratic republic of the congo', 'congo dr'],
  uzbekistan: ['uzbekistan'],
  colombia: ['colombia'],
  inglaterra: ['england'],
  croacia: ['croatia'],
  ghana: ['ghana'],
  panama: ['panama'],
}

export type DbTeam = {
  id: string
  name: string
  code?: string | null
  group_letter: string
}

export type RealGroupRow = {
  team_id: string
  group_letter: string
  final_position: number
  points: number
  goals_for: number
  goals_against: number
  goal_difference: number
  qualified_direct: boolean
  qualified_best_third: boolean
}

type ProviderTeam = {
  name?: string | null
  shortName?: string | null
  tla?: string | null
}

export function normalizeText(value = '') {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function buildTeamLookup(teams: DbTeam[]) {
  const lookup = new Map<string, DbTeam>()

  for (const team of teams) {
    const normalizedName = normalizeText(team.name)
    lookup.set(normalizedName, team)

    if (team.code) {
      lookup.set(normalizeText(team.code), team)
    }

    const aliases = TEAM_NAME_ALIASES[normalizedName] ?? []
    for (const alias of aliases) {
      lookup.set(normalizeText(alias), team)
    }
  }

  return lookup
}

export function resolveProviderTeamToDbTeam(
  providerTeam: ProviderTeam,
  teamLookup: Map<string, DbTeam>
) {
  const candidates = [providerTeam.name, providerTeam.shortName, providerTeam.tla].filter(Boolean) as string[]

  for (const candidate of candidates) {
    const found = teamLookup.get(normalizeText(candidate))
    if (found) return found
  }

  return null
}

export function computeGroupResults(matches: any[], teams: DbTeam[]) {
  const teamLookup = buildTeamLookup(teams)
  const stats = new Map<
    string,
    {
      team_id: string
      group_letter: string
      points: number
      goals_for: number
      goals_against: number
      played: number
      name: string
    }
  >()

  for (const team of teams) {
    stats.set(team.id, {
      team_id: team.id,
      group_letter: team.group_letter,
      points: 0,
      goals_for: 0,
      goals_against: 0,
      played: 0,
      name: team.name,
    })
  }

  for (const match of matches) {
    if (match.stage !== 'GROUP_STAGE') continue
    if (!['FINISHED', 'AWARDED'].includes(match.status)) continue

    const homeTeam = resolveProviderTeamToDbTeam(match.homeTeam, teamLookup)
    const awayTeam = resolveProviderTeamToDbTeam(match.awayTeam, teamLookup)
    if (!homeTeam || !awayTeam) continue

    const homeGoals = Number(match.score?.fullTime?.home ?? 0)
    const awayGoals = Number(match.score?.fullTime?.away ?? 0)

    const homeStats = stats.get(homeTeam.id)
    const awayStats = stats.get(awayTeam.id)
    if (!homeStats || !awayStats) continue

    homeStats.played += 1
    awayStats.played += 1
    homeStats.goals_for += homeGoals
    homeStats.goals_against += awayGoals
    awayStats.goals_for += awayGoals
    awayStats.goals_against += homeGoals

    if (homeGoals > awayGoals) {
      homeStats.points += 3
    } else if (awayGoals > homeGoals) {
      awayStats.points += 3
    } else {
      homeStats.points += 1
      awayStats.points += 1
    }
  }

  const byGroup = new Map<string, any[]>()
  for (const value of stats.values()) {
    const list = byGroup.get(value.group_letter) ?? []
    list.push(value)
    byGroup.set(value.group_letter, list)
  }

  const rankedRows: RealGroupRow[] = []

  for (const [groupLetter, list] of byGroup.entries()) {
    list.sort((left, right) => {
      const leftGoalDiff = left.goals_for - left.goals_against
      const rightGoalDiff = right.goals_for - right.goals_against
      if (right.points !== left.points) return right.points - left.points
      if (rightGoalDiff !== leftGoalDiff) return rightGoalDiff - leftGoalDiff
      if (right.goals_for !== left.goals_for) return right.goals_for - left.goals_for
      return left.name.localeCompare(right.name)
    })

    list.forEach((entry, index) => {
      rankedRows.push({
        team_id: entry.team_id,
        group_letter: groupLetter,
        final_position: index + 1,
        points: entry.points,
        goals_for: entry.goals_for,
        goals_against: entry.goals_against,
        goal_difference: entry.goals_for - entry.goals_against,
        qualified_direct: index < 2,
        qualified_best_third: false,
      })
    })
  }

  const bestThirds = rankedRows
    .filter((row) => row.final_position === 3)
    .sort((left, right) => {
      if (right.points !== left.points) return right.points - left.points
      if (right.goal_difference !== left.goal_difference) return right.goal_difference - left.goal_difference
      if (right.goals_for !== left.goals_for) return right.goals_for - left.goals_for
      return left.group_letter.localeCompare(right.group_letter)
    })

  const qualifiedThirdIds = new Set(bestThirds.slice(0, 8).map((row) => row.team_id))

  return rankedRows.map((row) => ({
    ...row,
    qualified_best_third: qualifiedThirdIds.has(row.team_id),
  }))
}

export function buildGroupLookup(realGroupRows: RealGroupRow[]) {
  return realGroupRows.reduce<Record<string, string>>((accumulator, row) => {
    accumulator[`${row.group_letter}:${row.final_position}`] = row.team_id
    return accumulator
  }, {})
}

export function getQualifiedThirds(realGroupRows: RealGroupRow[]) {
  return realGroupRows
    .filter((row) => row.final_position === 3 && row.qualified_best_third)
    .sort((left, right) => {
      if (right.points !== left.points) return right.points - left.points
      if (right.goal_difference !== left.goal_difference) return right.goal_difference - left.goal_difference
      if (right.goals_for !== left.goals_for) return right.goals_for - left.goals_for
      return left.group_letter.localeCompare(right.group_letter)
    })
}

export function getWinnerTeamIdFromProviderMatch(match: any, homeTeamId: string, awayTeamId: string) {
  const explicitWinner = match.score?.winner
  if (explicitWinner === 'HOME_TEAM') return homeTeamId
  if (explicitWinner === 'AWAY_TEAM') return awayTeamId

  const homePenalties = match.score?.penalties?.home
  const awayPenalties = match.score?.penalties?.away
  if (homePenalties != null && awayPenalties != null) {
    if (homePenalties > awayPenalties) return homeTeamId
    if (awayPenalties > homePenalties) return awayTeamId
  }

  const homeExtra = match.score?.extraTime?.home
  const awayExtra = match.score?.extraTime?.away
  if (homeExtra != null && awayExtra != null) {
    if (homeExtra > awayExtra) return homeTeamId
    if (awayExtra > homeExtra) return awayTeamId
  }

  const homeFullTime = match.score?.fullTime?.home
  const awayFullTime = match.score?.fullTime?.away
  if (homeFullTime != null && awayFullTime != null) {
    if (homeFullTime > awayFullTime) return homeTeamId
    if (awayFullTime > homeFullTime) return awayTeamId
  }

  return null
}

export function mapProviderStageToRound(stage?: string | null) {
  if (!stage) return null
  return PROVIDER_STAGE_TO_ROUND[stage] ?? null
}

function buildRoundOf32Candidates(matchRow: any, groupLookup: Record<string, string>, qualifiedThirds: RealGroupRow[]) {
  const candidates = { fixedIds: [] as string[], thirdCandidateIds: [] as string[] }

  if (matchRow.home_source_type === 'group_position') {
    const teamId = groupLookup[`${matchRow.home_source_group}:${matchRow.home_source_position}`]
    if (teamId) candidates.fixedIds.push(teamId)
  }

  if (matchRow.away_source_type === 'group_position') {
    const teamId = groupLookup[`${matchRow.away_source_group}:${matchRow.away_source_position}`]
    if (teamId) candidates.fixedIds.push(teamId)
  }

  if (matchRow.home_source_type === 'best_third') {
    candidates.thirdCandidateIds.push(
      ...qualifiedThirds
        .filter((row) => matchRow.home_third_options?.includes(row.group_letter))
        .map((row) => row.team_id)
    )
  }

  if (matchRow.away_source_type === 'best_third') {
    candidates.thirdCandidateIds.push(
      ...qualifiedThirds
        .filter((row) => matchRow.away_third_options?.includes(row.group_letter))
        .map((row) => row.team_id)
    )
  }

  return candidates
}

function fixtureMatchesRoundOf32(internalMatch: any, apiMatch: any, groupLookup: Record<string, string>, qualifiedThirds: RealGroupRow[]) {
  const homeTeamId = apiMatch.__homeTeamId
  const awayTeamId = apiMatch.__awayTeamId
  if (!homeTeamId || !awayTeamId) return false

  const ids = [homeTeamId, awayTeamId]
  const { fixedIds, thirdCandidateIds } = buildRoundOf32Candidates(internalMatch, groupLookup, qualifiedThirds)

  if (!fixedIds.every((id) => ids.includes(id))) return false
  if (!thirdCandidateIds.length) return fixedIds.length === 2

  const thirdId = ids.find((id) => thirdCandidateIds.includes(id))
  return Boolean(thirdId)
}

export function mapRoundOf32Matches(internalMatches: any[], apiMatches: any[], realGroupRows: RealGroupRow[]) {
  const groupLookup = buildGroupLookup(realGroupRows)
  const qualifiedThirds = getQualifiedThirds(realGroupRows)
  const assignments = new Map<string, any>()
  const usedApiMatchIds = new Set<number>()

  let progress = true
  while (assignments.size < internalMatches.length && progress) {
    progress = false

    for (const internalMatch of internalMatches) {
      if (assignments.has(internalMatch.match_code)) continue

      const candidates = apiMatches.filter((apiMatch) => {
        if (usedApiMatchIds.has(apiMatch.id)) return false
        return fixtureMatchesRoundOf32(internalMatch, apiMatch, groupLookup, qualifiedThirds)
      })

      if (candidates.length === 1) {
        assignments.set(internalMatch.match_code, candidates[0])
        usedApiMatchIds.add(candidates[0].id)
        progress = true
      }
    }
  }

  return assignments
}

function resolveExactSourceTeamId(
  sourceType: string,
  sourceGroup: string | null,
  sourcePosition: number | null,
  sourceMatch: string | null,
  groupLookup: Record<string, string>,
  winnerMap: Map<string, string>
) {
  if (sourceType === 'group_position' && sourceGroup && sourcePosition) {
    return groupLookup[`${sourceGroup}:${sourcePosition}`] ?? null
  }

  if (sourceType === 'match_winner' && sourceMatch) {
    return winnerMap.get(sourceMatch) ?? null
  }

  return null
}

export function mapKnockoutRoundByExactTeams(
  internalMatches: any[],
  apiMatches: any[],
  realGroupRows: RealGroupRow[],
  winnerMap: Map<string, string>
) {
  const groupLookup = buildGroupLookup(realGroupRows)
  const assignments = new Map<string, any>()
  const usedApiMatchIds = new Set<number>()

  for (const internalMatch of internalMatches) {
    const expectedHomeId = resolveExactSourceTeamId(
      internalMatch.home_source_type,
      internalMatch.home_source_group,
      internalMatch.home_source_position,
      internalMatch.home_source_match,
      groupLookup,
      winnerMap
    )

    const expectedAwayId = resolveExactSourceTeamId(
      internalMatch.away_source_type,
      internalMatch.away_source_group,
      internalMatch.away_source_position,
      internalMatch.away_source_match,
      groupLookup,
      winnerMap
    )

    if (!expectedHomeId || !expectedAwayId) continue

    const expectedSet = [expectedHomeId, expectedAwayId].sort().join(':')

    const matchedApiMatch = apiMatches.find((apiMatch) => {
      if (usedApiMatchIds.has(apiMatch.id)) return false
      const actualSet = [apiMatch.__homeTeamId, apiMatch.__awayTeamId].sort().join(':')
      return expectedSet === actualSet
    })

    if (matchedApiMatch) {
      assignments.set(internalMatch.match_code, matchedApiMatch)
      usedApiMatchIds.add(matchedApiMatch.id)
    }
  }

  return assignments
}

export function computeCompletionPercentage(groupPredictionsCount: number, bestThirdsCount: number, knockoutCount: number) {
  const groupsDone = Math.min(Math.round(groupPredictionsCount / 4), 12)
  const thirdsDone = Math.min(bestThirdsCount, 8)
  const knockoutsDone = Math.min(knockoutCount, 31)
  return Math.round(((groupsDone + thirdsDone + knockoutsDone) / 51) * 100)
}
