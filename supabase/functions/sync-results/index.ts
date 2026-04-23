import { adminClient, requireAdminOrCron } from '../_shared/admin.ts'
import { corsHeaders, errorResponse, jsonResponse } from '../_shared/http.ts'
import {
  DbTeam,
  buildTeamLookup,
  computeGroupResults,
  getWinnerTeamIdFromProviderMatch,
  mapKnockoutRoundByExactTeams,
  mapProviderStageToRound,
  mapRoundOf32Matches,
  resolveProviderTeamToDbTeam,
} from '../_shared/worldcup.ts'

const FOOTBALL_DATA_BASE_URL = Deno.env.get('FOOTBALL_DATA_BASE_URL') ?? 'https://api.football-data.org/v4'
const FOOTBALL_DATA_API_KEY = Deno.env.get('FOOTBALL_DATA_API_KEY')
const FOOTBALL_DATA_COMPETITION_CODE = Deno.env.get('FOOTBALL_DATA_COMPETITION_CODE') ?? 'WC'
const WORLD_CUP_SEASON = Number(Deno.env.get('WORLD_CUP_SEASON') ?? '2026')
const CALCULATE_SCORES_ON_SYNC = (Deno.env.get('CALCULATE_SCORES_ON_SYNC') ?? 'true') === 'true'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')

async function fetchProviderMatches() {
  if (!FOOTBALL_DATA_API_KEY) {
    throw new Error('Missing FOOTBALL_DATA_API_KEY secret.')
  }

  const url = new URL(`${FOOTBALL_DATA_BASE_URL}/competitions/${FOOTBALL_DATA_COMPETITION_CODE}/matches`)
  url.searchParams.set('season', String(WORLD_CUP_SEASON))

  const response = await fetch(url.toString(), {
    headers: {
      'X-Auth-Token': FOOTBALL_DATA_API_KEY,
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`football-data.org request failed: ${response.status} ${text}`)
  }

  const payload = await response.json()
  return payload.matches ?? []
}

async function triggerScoreCalculation(req: Request) {
  if (!SUPABASE_URL) {
    throw new Error('Missing SUPABASE_URL environment variable.')
  }

  const headers = new Headers({ 'Content-Type': 'application/json' })
  const cronSecret = Deno.env.get('CRON_SECRET')
  const authHeader = req.headers.get('authorization')

  if (cronSecret) {
    headers.set('x-cron-secret', cronSecret)
  } else if (authHeader) {
    headers.set('authorization', authHeader)
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/calculate-scores`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ reason: 'sync-results' }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`calculate-scores failed after sync: ${response.status} ${text}`)
  }

  return response.json()
}

function mapProviderMatchToWorldCupRow(match: any) {
  const round = mapProviderStageToRound(match.stage) ?? (match.stage === 'GROUP_STAGE' ? 'group_stage' : null)
  const winnerTeamId = getWinnerTeamIdFromProviderMatch(
    match,
    match.__homeTeamId,
    match.__awayTeamId
  )

  return {
    api_match_id: match.id,
    match_code: match.id ? `FD_${match.id}` : null,
    competition_code: FOOTBALL_DATA_COMPETITION_CODE,
    season: WORLD_CUP_SEASON,
    stage: match.stage ?? null,
    round,
    group_letter: match.group ?? null,
    matchday: match.matchday ?? null,
    status: match.status ?? 'SCHEDULED',
    utc_date: match.utcDate,
    prediction_closes_at: match.utcDate,
    home_team_id: match.__homeTeamId,
    away_team_id: match.__awayTeamId,
    home_team_name: match.homeTeam?.name ?? null,
    away_team_name: match.awayTeam?.name ?? null,
    home_score: match.score?.fullTime?.home ?? null,
    away_score: match.score?.fullTime?.away ?? null,
    winner_team_id: winnerTeamId,
    synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed.', 405)
  }

  const authCheck = await requireAdminOrCron(req)
  if (!authCheck.ok) return authCheck.response

  try {
    const [{ data: teams, error: teamsError }, { data: knockoutMatches, error: knockoutError }, providerMatches] =
      await Promise.all([
        adminClient.from('teams').select('id, name, code, group_letter').order('group_letter').order('name'),
        adminClient.from('knockout_matches').select('*').order('match_code'),
        fetchProviderMatches(),
      ])

    if (teamsError || !teams) return errorResponse('Unable to load teams.', 500, teamsError?.message)
    if (knockoutError || !knockoutMatches) {
      return errorResponse('Unable to load knockout_matches.', 500, knockoutError?.message)
    }

    const dbTeams = teams as DbTeam[]
    const teamLookup = buildTeamLookup(dbTeams)

    const enrichedProviderMatches = providerMatches.map((match: any) => {
      const homeDbTeam = resolveProviderTeamToDbTeam(match.homeTeam, teamLookup)
      const awayDbTeam = resolveProviderTeamToDbTeam(match.awayTeam, teamLookup)

      return {
        ...match,
        __homeTeamId: homeDbTeam?.id ?? null,
        __awayTeamId: awayDbTeam?.id ?? null,
      }
    })

    const worldCupRows = enrichedProviderMatches
      .filter((match: any) => match.id && match.utcDate)
      .map(mapProviderMatchToWorldCupRow)

    const { error: worldCupMatchesError } = await adminClient
      .from('world_cup_matches')
      .upsert(worldCupRows, { onConflict: 'api_match_id' })

    if (worldCupMatchesError) {
      return errorResponse(
        'Unable to upsert world_cup_matches. Expected columns: api_match_id, match_code, competition_code, season, stage, round, group_letter, matchday, status, utc_date, prediction_closes_at, home_team_id, away_team_id, home_team_name, away_team_name, home_score, away_score, winner_team_id, synced_at, updated_at.',
        500,
        worldCupMatchesError.message
      )
    }

    const realGroupRows = computeGroupResults(enrichedProviderMatches, dbTeams)

    const { error: realGroupsError } = await adminClient.from('real_results_groups').upsert(
      realGroupRows.map((row) => ({
        ...row,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: 'group_letter,team_id' }
    )

    if (realGroupsError) {
      return errorResponse(
        'Unable to upsert real_results_groups. Expected columns: group_letter, team_id, final_position, points, goals_for, goals_against, goal_difference, qualified_direct, qualified_best_third, updated_at.',
        500,
        realGroupsError.message
      )
    }

    const knockoutApiMatches = enrichedProviderMatches
      .filter((match: any) => mapProviderStageToRound(match.stage))
      .sort((left: any, right: any) => new Date(left.utcDate).getTime() - new Date(right.utcDate).getTime())

    const providerByRound = knockoutApiMatches.reduce<Record<string, any[]>>((accumulator, match: any) => {
      const round = mapProviderStageToRound(match.stage)
      if (!round) return accumulator
      accumulator[round] = [...(accumulator[round] ?? []), match]
      return accumulator
    }, {})

    const internalByRound = knockoutMatches.reduce<Record<string, any[]>>((accumulator: Record<string, any[]>, match: any) => {
      accumulator[match.round] = [...(accumulator[match.round] ?? []), match]
      return accumulator
    }, {})

    const winnerMap = new Map<string, string>()
    const knockoutRows: Record<string, unknown>[] = []

    const round32Assignments = mapRoundOf32Matches(
      internalByRound.round_of_32 ?? [],
      providerByRound.round_of_32 ?? [],
      realGroupRows
    )

    for (const matchRow of internalByRound.round_of_32 ?? []) {
      const apiMatch = round32Assignments.get(matchRow.match_code)
      if (!apiMatch) continue

      const winnerTeamId = getWinnerTeamIdFromProviderMatch(
        apiMatch,
        apiMatch.__homeTeamId,
        apiMatch.__awayTeamId
      )

      if (winnerTeamId) winnerMap.set(matchRow.match_code, winnerTeamId)

      knockoutRows.push({
        match_code: matchRow.match_code,
        round: matchRow.round,
        home_team_id: apiMatch.__homeTeamId,
        away_team_id: apiMatch.__awayTeamId,
        winner_team_id: winnerTeamId,
        home_score: apiMatch.score?.fullTime?.home ?? null,
        away_score: apiMatch.score?.fullTime?.away ?? null,
        status: apiMatch.status,
        played_at: apiMatch.utcDate,
        api_match_id: apiMatch.id,
        updated_at: new Date().toISOString(),
      })
    }

    for (const round of ['round_of_16', 'quarter_finals', 'semi_finals', 'final']) {
      const assignments = mapKnockoutRoundByExactTeams(
        internalByRound[round] ?? [],
        providerByRound[round] ?? [],
        realGroupRows,
        winnerMap
      )

      for (const matchRow of internalByRound[round] ?? []) {
        const apiMatch = assignments.get(matchRow.match_code)
        if (!apiMatch) continue

        const winnerTeamId = getWinnerTeamIdFromProviderMatch(
          apiMatch,
          apiMatch.__homeTeamId,
          apiMatch.__awayTeamId
        )

        if (winnerTeamId) winnerMap.set(matchRow.match_code, winnerTeamId)

        knockoutRows.push({
          match_code: matchRow.match_code,
          round: matchRow.round,
          home_team_id: apiMatch.__homeTeamId,
          away_team_id: apiMatch.__awayTeamId,
          winner_team_id: winnerTeamId,
          home_score: apiMatch.score?.fullTime?.home ?? null,
          away_score: apiMatch.score?.fullTime?.away ?? null,
          status: apiMatch.status,
          played_at: apiMatch.utcDate,
          api_match_id: apiMatch.id,
          updated_at: new Date().toISOString(),
        })
      }
    }

    const { error: knockoutUpsertError } = await adminClient.from('real_results_knockout').upsert(knockoutRows, {
      onConflict: 'match_code',
    })

    if (knockoutUpsertError) {
      return errorResponse(
        'Unable to upsert real_results_knockout. Expected columns: match_code, round, home_team_id, away_team_id, winner_team_id, home_score, away_score, status, played_at, api_match_id, updated_at.',
        500,
        knockoutUpsertError.message
      )
    }

    let calculateScoresResult = null
    if (CALCULATE_SCORES_ON_SYNC) {
      calculateScoresResult = await triggerScoreCalculation(req)
    }

    return jsonResponse({
      message: 'Results synchronized successfully.',
      provider: 'football-data.org',
      competition_code: FOOTBALL_DATA_COMPETITION_CODE,
      season: WORLD_CUP_SEASON,
      matches_updated: worldCupRows.length,
      groups_updated: realGroupRows.length,
      knockout_updated: knockoutRows.length,
      score_recalculation: calculateScoresResult,
    })
  } catch (error) {
    return errorResponse(
      'Unexpected sync-results failure.',
      500,
      error instanceof Error ? error.message : String(error)
    )
  }
})
