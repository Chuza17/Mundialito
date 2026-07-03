import { adminClient, requireAdminOrCron } from '../_shared/admin.ts'
import { corsHeaders, errorResponse, jsonResponse } from '../_shared/http.ts'
import { ROUND_POINTS, computeCompletionPercentage } from '../_shared/worldcup.ts'

const FINISHED_MATCH_STATUSES = new Set(['FINISHED', 'AWARDED'])
const GROUP_STAGE_MATCHES_PER_GROUP = 6
const MATCH_EXACT_SCORE_POINTS = 2
const MATCH_OUTCOME_POINTS = 1
const SELECT_PAGE_SIZE = 1000

function groupBy<T>(items: T[], keyGetter: (item: T) => string) {
  return items.reduce<Record<string, T[]>>((accumulator, item) => {
    const key = keyGetter(item)
    accumulator[key] = [...(accumulator[key] ?? []), item]
    return accumulator
  }, {})
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

async function selectAllRows(
  table: string,
  columns = '*',
  configureQuery: (query: any) => any = (query) => query
) {
  const rows: any[] = []

  for (let start = 0; ; start += SELECT_PAGE_SIZE) {
    const end = start + SELECT_PAGE_SIZE - 1
    const query = configureQuery(adminClient.from(table).select(columns)).range(start, end)
    const { data, error } = await query

    if (error) return { data: null, error }

    rows.push(...(data ?? []))

    if (!data || data.length < SELECT_PAGE_SIZE) {
      return { data: rows, error: null }
    }
  }
}

function getScoreOutcome(homeScore: number, awayScore: number) {
  if (!Number.isFinite(homeScore) || !Number.isFinite(awayScore)) return null
  if (homeScore > awayScore) return 'home'
  if (awayScore > homeScore) return 'away'
  return 'draw'
}

function scoreMatchPrediction(prediction: any, realMatch: any) {
  if (!realMatch) {
    return { pointsAwarded: 0, exactScorePoints: 0, outcomePoints: 0 }
  }

  const predictedHomeScore = Number(prediction.predicted_home_score)
  const predictedAwayScore = Number(prediction.predicted_away_score)
  const realHomeScore = Number(realMatch.home_score)
  const realAwayScore = Number(realMatch.away_score)

  const exactScore =
    Number.isFinite(predictedHomeScore) &&
    Number.isFinite(predictedAwayScore) &&
    predictedHomeScore === realHomeScore &&
    predictedAwayScore === realAwayScore

  const predictedOutcome = getScoreOutcome(predictedHomeScore, predictedAwayScore)
  const actualOutcome = getScoreOutcome(realHomeScore, realAwayScore)
  const exactScorePoints = exactScore ? MATCH_EXACT_SCORE_POINTS : 0
  const outcomePoints =
    predictedOutcome && actualOutcome && predictedOutcome === actualOutcome
      ? MATCH_OUTCOME_POINTS
      : 0

  return {
    pointsAwarded: exactScorePoints + outcomePoints,
    exactScorePoints,
    outcomePoints,
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
    const [
      { data: profiles, error: profilesError },
      { data: realGroupRows, error: realGroupsError },
      { data: realKnockoutRows, error: realKnockoutError },
      { data: groupPredictions, error: groupPredictionsError },
      { data: bestThirdPredictions, error: bestThirdPredictionsError },
      { data: knockoutPredictions, error: knockoutPredictionsError },
      { data: knockoutMatches, error: knockoutMatchesError },
      { data: matchScorePredictions, error: matchScorePredictionsError },
      { data: worldCupMatches, error: worldCupMatchesError },
    ] = await Promise.all([
      selectAllRows(
        'profiles',
        'id, username, display_name, role, is_active',
        (query) => query.eq('role', 'user').eq('is_active', true).order('id')
      ),
      selectAllRows('real_results_groups', '*', (query) => query.order('group_letter').order('final_position')),
      selectAllRows('real_results_knockout', '*', (query) => query.order('match_code')),
      selectAllRows('group_predictions', '*', (query) => query.order('user_id')),
      selectAllRows('best_thirds_predictions', '*', (query) => query.order('user_id')),
      selectAllRows('knockout_predictions', '*', (query) => query.order('user_id')),
      selectAllRows('knockout_matches', 'match_code, round', (query) => query.order('match_code')),
      selectAllRows(
        'match_score_predictions',
        'id, user_id, match_id, predicted_home_score, predicted_away_score, points_awarded',
        (query) => query.order('id')
      ),
      selectAllRows(
        'world_cup_matches',
        'id, group_letter, round, status, home_team_id, away_team_id, home_score, away_score, winner_team_id',
        (query) => query.order('utc_date')
      ),
    ])

    if (profilesError || !profiles) return errorResponse('Unable to load profiles.', 500, profilesError?.message)
    if (realGroupsError || !realGroupRows) return errorResponse('Unable to load real_results_groups.', 500, realGroupsError?.message)
    if (realKnockoutError || !realKnockoutRows) return errorResponse('Unable to load real_results_knockout.', 500, realKnockoutError?.message)
    if (groupPredictionsError || !groupPredictions) return errorResponse('Unable to load group_predictions.', 500, groupPredictionsError?.message)
    if (bestThirdPredictionsError || !bestThirdPredictions) return errorResponse('Unable to load best_thirds_predictions.', 500, bestThirdPredictionsError?.message)
    if (knockoutPredictionsError || !knockoutPredictions) return errorResponse('Unable to load knockout_predictions.', 500, knockoutPredictionsError?.message)
    if (knockoutMatchesError || !knockoutMatches) return errorResponse('Unable to load knockout_matches.', 500, knockoutMatchesError?.message)
    if (matchScorePredictionsError || !matchScorePredictions) return errorResponse('Unable to load match_score_predictions.', 500, matchScorePredictionsError?.message)
    if (worldCupMatchesError || !worldCupMatches) return errorResponse('Unable to load world_cup_matches.', 500, worldCupMatchesError?.message)

    const finishedMatchById = new Map(
      worldCupMatches
        .filter(
          (row: any) =>
            FINISHED_MATCH_STATUSES.has(row.status) &&
            row.home_score !== null &&
            row.away_score !== null
        )
        .map((row: any) => [row.id, row])
    )
    const scoredMatchPredictions = matchScorePredictions.map((prediction: any) => {
      const realMatch: any = finishedMatchById.get(prediction.match_id)
      const score = scoreMatchPrediction(prediction, realMatch)

      return {
        ...prediction,
        points_awarded: score.pointsAwarded,
        match_score_exact_points: score.exactScorePoints,
        match_outcome_points: score.outcomePoints,
      }
    })
    const savedPointsByPredictionId = new Map(
      matchScorePredictions.map((prediction: any) => [
        prediction.id,
        Number(prediction.points_awarded ?? 0),
      ])
    )
    const changedMatchPredictions = scoredMatchPredictions.filter(
      (prediction: any) =>
        Number(prediction.points_awarded) !== savedPointsByPredictionId.get(prediction.id)
    )

    if (changedMatchPredictions.length) {
      for (const predictionBatch of chunkArray(changedMatchPredictions, 50)) {
        const updateResults = await Promise.all(
          predictionBatch.map((prediction: any) =>
            adminClient
              .from('match_score_predictions')
              .update({ points_awarded: prediction.points_awarded })
              .eq('id', prediction.id)
          )
        )
        const scorePredictionsError = updateResults.find((result) => result.error)?.error

        if (scorePredictionsError) {
          return errorResponse(
            'Unable to update match_score_predictions points.',
            500,
            scorePredictionsError.message
          )
        }
      }
    }

    const realGroupByTeamId = new Map(realGroupRows.map((row: any) => [row.team_id, row]))
    const realQualifiedThirdGroups = new Set(
      realGroupRows
        .filter((row: any) => row.final_position === 3 && row.qualified_best_third)
        .map((row: any) => row.group_letter)
    )
    const allGroupLetters = new Set(realGroupRows.map((row: any) => row.group_letter).filter(Boolean))
    const groupStageMatchesByGroup = groupBy(
      worldCupMatches.filter((row: any) => row.round === 'group_stage' && row.group_letter),
      (row: any) => row.group_letter
    )
    const completedGroupLetters = new Set(
      Object.entries(groupStageMatchesByGroup)
        .filter(([, rows]) => rows.length >= GROUP_STAGE_MATCHES_PER_GROUP && rows.every((row: any) => FINISHED_MATCH_STATUSES.has(row.status)))
        .map(([groupLetter]) => groupLetter)
    )
    const canScoreBestThirds =
      allGroupLetters.size > 0 && allGroupLetters.size === completedGroupLetters.size

    const roundByMatchCode = new Map(knockoutMatches.map((row: any) => [row.match_code, row.round]))
    const realWinnerByMatchCode = new Map(
      realKnockoutRows
        .filter((row: any) => row.winner_team_id && FINISHED_MATCH_STATUSES.has(row.status))
        .map((row: any) => [row.match_code, row.winner_team_id])
    )

    const championTeamId =
      realWinnerByMatchCode.get('FIN_01') ??
      realKnockoutRows.find((row: any) => row.round === 'final' && row.winner_team_id && FINISHED_MATCH_STATUSES.has(row.status))?.winner_team_id ??
      null

    const groupPredictionsByUser = groupBy(groupPredictions, (row: any) => row.user_id)
    const bestThirdPredictionsByUser = groupBy(bestThirdPredictions, (row: any) => row.user_id)
    const knockoutPredictionsByUser = groupBy(knockoutPredictions, (row: any) => row.user_id)
    const matchScoreBonusByUser = scoredMatchPredictions.reduce<Map<string, number>>(
      (accumulator, row: any) => {
        accumulator.set(
          row.user_id,
          (accumulator.get(row.user_id) ?? 0) + Number(row.points_awarded ?? 0)
        )
        return accumulator
      },
      new Map()
    )
    const matchScoreExactByUser = scoredMatchPredictions.reduce<Map<string, number>>(
      (accumulator, row: any) => {
        accumulator.set(
          row.user_id,
          (accumulator.get(row.user_id) ?? 0) + Number(row.match_score_exact_points ?? 0)
        )
        return accumulator
      },
      new Map()
    )
    const matchOutcomeByUser = scoredMatchPredictions.reduce<Map<string, number>>(
      (accumulator, row: any) => {
        accumulator.set(
          row.user_id,
          (accumulator.get(row.user_id) ?? 0) + Number(row.match_outcome_points ?? 0)
        )
        return accumulator
      },
      new Map()
    )

    const scoreRows = profiles.map((profile: any) => {
      const userGroupPredictions = groupPredictionsByUser[profile.id] ?? []
      const userBestThirds = bestThirdPredictionsByUser[profile.id] ?? []
      const userKnockoutPredictions = knockoutPredictionsByUser[profile.id] ?? []

      let groupExactPoints = 0
      let groupQualifiedPoints = 0
      let bestThirdPoints = 0
      let roundOf32Points = 0
      let roundOf16Points = 0
      let quarterFinalsPoints = 0
      let semiFinalsPoints = 0
      let finalPoints = 0
      let championBonusPoints = 0
      const matchScoreBonusPoints = matchScoreBonusByUser.get(profile.id) ?? 0
      const matchScoreExactPoints = matchScoreExactByUser.get(profile.id) ?? 0
      const matchOutcomePoints = matchOutcomeByUser.get(profile.id) ?? 0

      for (const prediction of userGroupPredictions) {
        const realRow = realGroupByTeamId.get(prediction.team_id)
        if (!realRow) continue
        if (!completedGroupLetters.has(realRow.group_letter)) continue

        if (realRow.final_position === prediction.predicted_position) {
          groupExactPoints += 3
        }

        if (Number(prediction.predicted_position) <= 2 && Number(realRow.final_position) <= 2) {
          groupQualifiedPoints += 1
        }
      }

      const predictedQualifiedThirdGroups = new Set(
        userBestThirds.filter((row: any) => row.qualifies).map((row: any) => row.group_letter)
      )

      if (canScoreBestThirds) {
        for (const groupLetter of predictedQualifiedThirdGroups) {
          if (realQualifiedThirdGroups.has(groupLetter)) {
            bestThirdPoints += 2
          }
        }
      }

      for (const prediction of userKnockoutPredictions) {
        const realWinnerTeamId = realWinnerByMatchCode.get(prediction.match_code)
        if (!realWinnerTeamId || prediction.winner_team_id !== realWinnerTeamId) continue

        const round = roundByMatchCode.get(prediction.match_code)
        if (!round) continue

        if (round === 'round_of_32') roundOf32Points += ROUND_POINTS.round_of_32
        if (round === 'round_of_16') roundOf16Points += ROUND_POINTS.round_of_16
        if (round === 'quarter_finals') quarterFinalsPoints += ROUND_POINTS.quarter_finals
        if (round === 'semi_finals') semiFinalsPoints += ROUND_POINTS.semi_finals
        if (round === 'final') finalPoints += ROUND_POINTS.final
      }

      const predictedChampionTeamId =
        userKnockoutPredictions.find((row: any) => row.match_code === 'FIN_01')?.winner_team_id ?? null

      if (championTeamId && predictedChampionTeamId === championTeamId) {
        championBonusPoints += 15
      }

      const totalPoints =
        groupExactPoints +
        groupQualifiedPoints +
        bestThirdPoints +
        roundOf32Points +
        roundOf16Points +
        quarterFinalsPoints +
        semiFinalsPoints +
        finalPoints +
        championBonusPoints +
        matchScoreBonusPoints

      const completionPercentage = computeCompletionPercentage(
        userGroupPredictions.length,
        userBestThirds.filter((row: any) => row.qualifies).length,
        userKnockoutPredictions.length
      )

      return {
        user_id: profile.id,
        group_exact_points: groupExactPoints,
        group_qualified_points: groupQualifiedPoints,
        best_third_points: bestThirdPoints,
        round_of_32_points: roundOf32Points,
        round_of_16_points: roundOf16Points,
        quarter_finals_points: quarterFinalsPoints,
        semi_finals_points: semiFinalsPoints,
        final_points: finalPoints,
        champion_bonus_points: championBonusPoints,
        match_score_bonus_points: matchScoreBonusPoints,
        total_points: totalPoints,
        completion_percentage: completionPercentage,
        breakdown: {
          group_exact_points: groupExactPoints,
          group_qualified_points: groupQualifiedPoints,
          best_third_points: bestThirdPoints,
          round_of_32_points: roundOf32Points,
          round_of_16_points: roundOf16Points,
          quarter_finals_points: quarterFinalsPoints,
          semi_finals_points: semiFinalsPoints,
          final_points: finalPoints,
          champion_bonus_points: championBonusPoints,
          match_score_exact_points: matchScoreExactPoints,
          match_outcome_points: matchOutcomePoints,
          match_winner_points: matchOutcomePoints,
          match_score_bonus_points: matchScoreBonusPoints,
        },
        last_calculated_at: new Date().toISOString(),
      }
    })

    const { error: upsertScoresError } = await adminClient.from('user_scores').upsert(scoreRows, {
      onConflict: 'user_id',
    })

    if (upsertScoresError) {
      return errorResponse(
        'Unable to upsert user_scores. Expected columns: user_id, group_exact_points, group_qualified_points, best_third_points, round_of_32_points, round_of_16_points, quarter_finals_points, semi_finals_points, final_points, champion_bonus_points, match_score_bonus_points, total_points, completion_percentage, breakdown, last_calculated_at.',
        500,
        upsertScoresError.message
      )
    }

    return jsonResponse({
      message: 'Scores calculated successfully.',
      users_updated: scoreRows.length,
      match_predictions_scored: scoredMatchPredictions.length,
      match_prediction_points_updated: changedMatchPredictions.length,
      match_outcome_points_awarded: [...matchOutcomeByUser.values()].reduce((total, points) => total + points, 0),
      match_winner_points_awarded: [...matchOutcomeByUser.values()].reduce((total, points) => total + points, 0),
      champion_team_id: championTeamId,
    })
  } catch (error) {
    return errorResponse(
      'Unexpected calculate-scores failure.',
      500,
      error instanceof Error ? error.message : String(error)
    )
  }
})
