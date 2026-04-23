import { adminClient, requireAdminOrCron } from '../_shared/admin.ts'
import { corsHeaders, errorResponse, jsonResponse } from '../_shared/http.ts'
import { ROUND_POINTS, computeCompletionPercentage } from '../_shared/worldcup.ts'

function groupBy<T>(items: T[], keyGetter: (item: T) => string) {
  return items.reduce<Record<string, T[]>>((accumulator, item) => {
    const key = keyGetter(item)
    accumulator[key] = [...(accumulator[key] ?? []), item]
    return accumulator
  }, {})
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
      { data: matchScoreBonuses, error: matchScoreBonusesError },
    ] = await Promise.all([
      adminClient.from('profiles').select('id, username, display_name, role, is_active').eq('role', 'user').eq('is_active', true),
      adminClient.from('real_results_groups').select('*'),
      adminClient.from('real_results_knockout').select('*'),
      adminClient.from('group_predictions').select('*'),
      adminClient.from('best_thirds_predictions').select('*'),
      adminClient.from('knockout_predictions').select('*'),
      adminClient.from('knockout_matches').select('match_code, round'),
      adminClient.from('user_match_score_bonus').select('user_id, match_score_bonus_points'),
    ])

    if (profilesError || !profiles) return errorResponse('Unable to load profiles.', 500, profilesError?.message)
    if (realGroupsError || !realGroupRows) return errorResponse('Unable to load real_results_groups.', 500, realGroupsError?.message)
    if (realKnockoutError || !realKnockoutRows) return errorResponse('Unable to load real_results_knockout.', 500, realKnockoutError?.message)
    if (groupPredictionsError || !groupPredictions) return errorResponse('Unable to load group_predictions.', 500, groupPredictionsError?.message)
    if (bestThirdPredictionsError || !bestThirdPredictions) return errorResponse('Unable to load best_thirds_predictions.', 500, bestThirdPredictionsError?.message)
    if (knockoutPredictionsError || !knockoutPredictions) return errorResponse('Unable to load knockout_predictions.', 500, knockoutPredictionsError?.message)
    if (knockoutMatchesError || !knockoutMatches) return errorResponse('Unable to load knockout_matches.', 500, knockoutMatchesError?.message)
    if (matchScoreBonusesError || !matchScoreBonuses) return errorResponse('Unable to load user_match_score_bonus.', 500, matchScoreBonusesError?.message)

    const realGroupByTeamId = new Map(realGroupRows.map((row: any) => [row.team_id, row]))
    const realQualifiedThirdGroups = new Set(
      realGroupRows
        .filter((row: any) => row.final_position === 3 && row.qualified_best_third)
        .map((row: any) => row.group_letter)
    )

    const roundByMatchCode = new Map(knockoutMatches.map((row: any) => [row.match_code, row.round]))
    const realWinnerByMatchCode = new Map(
      realKnockoutRows
        .filter((row: any) => row.winner_team_id)
        .map((row: any) => [row.match_code, row.winner_team_id])
    )

    const championTeamId =
      realWinnerByMatchCode.get('FIN_01') ??
      realKnockoutRows.find((row: any) => row.round === 'final' && row.winner_team_id)?.winner_team_id ??
      null

    const groupPredictionsByUser = groupBy(groupPredictions, (row: any) => row.user_id)
    const bestThirdPredictionsByUser = groupBy(bestThirdPredictions, (row: any) => row.user_id)
    const knockoutPredictionsByUser = groupBy(knockoutPredictions, (row: any) => row.user_id)
    const matchScoreBonusByUser = new Map(
      matchScoreBonuses.map((row: any) => [row.user_id, Number(row.match_score_bonus_points ?? 0)])
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

      for (const prediction of userGroupPredictions) {
        const realRow = realGroupByTeamId.get(prediction.team_id)
        if (!realRow) continue

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

      for (const groupLetter of predictedQualifiedThirdGroups) {
        if (realQualifiedThirdGroups.has(groupLetter)) {
          bestThirdPoints += 2
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
