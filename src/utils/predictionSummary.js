export function buildTeamMap(teams = []) {
  return new Map(teams.map((team) => [team.id, team]))
}

export function enrichGroupRows(groupPredictions = [], teamMap = new Map()) {
  return groupPredictions.map((row) => ({
    ...row,
    team: teamMap.get(row.team_id) ?? row.team ?? null,
  }))
}

export function buildQualifiedThirdRows(bestThirds = [], groupRows = []) {
  return bestThirds
    .filter((item) => item.qualifies)
    .map((item) => {
      const thirdRow = groupRows.find(
        (row) => row.group_letter === item.group_letter && Number(row.predicted_position) === 3
      )

      return {
        ...item,
        team_id: thirdRow?.team_id ?? `${item.group_letter}-third`,
        team: thirdRow?.team ?? null,
        predicted_points: Number(thirdRow?.predicted_points ?? 0),
      }
    })
}

export function getWinnerTeamFromMatch(match, teamMap = new Map()) {
  if (!match) return null

  if (match.winnerTeam && typeof match.winnerTeam === 'object') {
    return match.winnerTeam
  }

  if (match.winner_team && typeof match.winner_team === 'object') {
    return match.winner_team
  }

  if (match.winnerTeamId && typeof match.winnerTeamId === 'object') {
    return match.winnerTeamId
  }

  const winnerId =
    (typeof match.winnerTeamId === 'string' && match.winnerTeamId) ||
    (typeof match.winner_team_id === 'string' && match.winner_team_id) ||
    null

  return winnerId ? teamMap.get(winnerId) ?? null : null
}
