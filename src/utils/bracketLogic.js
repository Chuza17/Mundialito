import { FALLBACK_MATCHES, ROUNDS } from './constants'

export function isBestThirdSource(sourceType, sourceGroup, sourcePosition) {
  return sourceType === 'best_third' || (sourceType === 'group_position' && !sourceGroup && Number(sourcePosition) === 3)
}

export function getMatchesByRound(matches = FALLBACK_MATCHES) {
  return {
    [ROUNDS.ROUND_OF_32]: matches.filter((match) => match.round === ROUNDS.ROUND_OF_32),
    [ROUNDS.ROUND_OF_16]: matches.filter((match) => match.round === ROUNDS.ROUND_OF_16),
    [ROUNDS.QUARTER_FINALS]: matches.filter((match) => match.round === ROUNDS.QUARTER_FINALS),
    [ROUNDS.SEMI_FINALS]: matches.filter((match) => match.round === ROUNDS.SEMI_FINALS),
    [ROUNDS.FINAL]: matches.filter((match) => match.round === ROUNDS.FINAL),
  }
}

export function buildGroupLookup(groupPredictions = [], teams = []) {
  return groupPredictions.reduce((accumulator, row) => {
    const key = `${row.group_letter}:${row.predicted_position}`
    accumulator[key] = teams.find((team) => team.id === row.team_id) ?? null
    return accumulator
  }, {})
}

export function buildTeamLookup(teams = []) {
  return teams.reduce((accumulator, team) => {
    accumulator[team.id] = team
    return accumulator
  }, {})
}

export function getRankedThirds(groupPredictions = [], teams = []) {
  const thirds = groupPredictions
    .filter((row) => row.predicted_position === 3)
    .map((row) => ({
      ...row,
      team: teams.find((team) => team.id === row.team_id),
    }))
    .sort((left, right) => {
      if (right.predicted_points !== left.predicted_points) {
        return right.predicted_points - left.predicted_points
      }

      return left.group_letter.localeCompare(right.group_letter)
    })
  return thirds
}

function buildBestThirdSlots(matches = FALLBACK_MATCHES) {
  return matches.flatMap((match, order) => {
    const slots = []

    if (isBestThirdSource(match.home_source_type, match.home_source_group, match.home_source_position)) {
      slots.push({
        key: `${match.match_code}:home`,
        match_code: match.match_code,
        side: 'home',
        allowedGroups: match.home_third_options ?? [],
        order,
      })
    }

    if (isBestThirdSource(match.away_source_type, match.away_source_group, match.away_source_position)) {
      slots.push({
        key: `${match.match_code}:away`,
        match_code: match.match_code,
        side: 'away',
        allowedGroups: match.away_third_options ?? [],
        order,
      })
    }

    return slots
  })
}

export function assignBestThirdTeams(matches = FALLBACK_MATCHES, rankedThirds = []) {
  const slots = buildBestThirdSlots(matches)
  if (!slots.length || !rankedThirds.length) return {}

  const thirdByGroup = rankedThirds.reduce((accumulator, third) => {
    accumulator[third.group_letter] = third
    return accumulator
  }, {})

  const groups = rankedThirds.map((third) => third.group_letter)
  const orderedGroups = [...groups].sort((left, right) => {
    const leftEligible = slots.filter((slot) => slot.allowedGroups.includes(left)).length
    const rightEligible = slots.filter((slot) => slot.allowedGroups.includes(right)).length

    if (leftEligible !== rightEligible) {
      return leftEligible - rightEligible
    }

    return groups.indexOf(left) - groups.indexOf(right)
  })

  const assignedSlots = new Set()
  const assignment = {}

  function search(index) {
    if (index === orderedGroups.length) return true

    const groupLetter = orderedGroups[index]
    const candidateSlots = slots
      .filter((slot) => !assignedSlots.has(slot.key) && slot.allowedGroups.includes(groupLetter))
      .sort((left, right) => left.order - right.order)

    for (const slot of candidateSlots) {
      assignedSlots.add(slot.key)
      assignment[slot.key] = thirdByGroup[groupLetter]?.team ?? null

      if (search(index + 1)) {
        return true
      }

      assignedSlots.delete(slot.key)
      delete assignment[slot.key]
    }

    return false
  }

  if (!search(0)) {
    const fallbackAssignment = {}
    const usedSlots = new Set()

    for (const groupLetter of groups) {
      const fallbackSlot = slots.find(
        (slot) => !usedSlots.has(slot.key) && slot.allowedGroups.includes(groupLetter)
      )

      if (fallbackSlot) {
        usedSlots.add(fallbackSlot.key)
        fallbackAssignment[fallbackSlot.key] = thirdByGroup[groupLetter]?.team ?? null
      }
    }

    return fallbackAssignment
  }

  return assignment
}

export function getTeamForSource({
  sourceType,
  sourceGroup,
  sourcePosition,
  sourceMatch,
  thirdOptions,
  slotKey,
  groupLookup,
  bestThirdAssignment,
  knockoutPredictionMap,
  teamLookup,
}) {
  if (isBestThirdSource(sourceType, sourceGroup, sourcePosition)) {
    return bestThirdAssignment[slotKey] ?? null
  }

  if (sourceType === 'group_position') {
    return groupLookup[`${sourceGroup}:${sourcePosition}`] ?? null
  }

  if (sourceType === 'match_winner') {
    const prediction = knockoutPredictionMap[sourceMatch]
    if (!prediction) return null

    return prediction.winner_team ?? teamLookup[prediction.winner_team_id] ?? null
  }

  return null
}

export function resolveBracket({
  matches = FALLBACK_MATCHES,
  teams = [],
  groupPredictions = [],
  bestThirds = [],
  knockoutPredictions = [],
  bestThirdAssignmentOverride = null,
}) {
  const selectedThirds = new Set(
    bestThirds.filter((row) => row.qualifies).map((row) => row.group_letter)
  )
  const teamLookup = buildTeamLookup(teams)
  const groupLookup = buildGroupLookup(groupPredictions, teams)
  const rankedThirds = getRankedThirds(groupPredictions, teams).filter((row) =>
    selectedThirds.has(row.group_letter)
  )
  const bestThirdAssignment = bestThirdAssignmentOverride ?? assignBestThirdTeams(matches, rankedThirds)
  const rawKnockoutPredictionMap = knockoutPredictions.reduce((accumulator, prediction) => {
    accumulator[prediction.match_code] = {
      ...prediction,
      winner_team: prediction.winner_team ?? teamLookup[prediction.winner_team_id] ?? null,
    }
    return accumulator
  }, {})
  const validKnockoutPredictionMap = {}
  const resolvedByCode = {}
  const roundOrder = [
    ROUNDS.ROUND_OF_32,
    ROUNDS.ROUND_OF_16,
    ROUNDS.QUARTER_FINALS,
    ROUNDS.SEMI_FINALS,
    ROUNDS.FINAL,
  ]

  roundOrder.forEach((round) => {
    matches
      .filter((match) => match.round === round)
      .forEach((match) => {
        const homeTeam = getTeamForSource({
          sourceType: match.home_source_type,
          sourceGroup: match.home_source_group,
          sourcePosition: match.home_source_position,
          sourceMatch: match.home_source_match,
          thirdOptions: match.home_third_options,
          slotKey: `${match.match_code}:home`,
          groupLookup,
          bestThirdAssignment,
          knockoutPredictionMap: validKnockoutPredictionMap,
          teamLookup,
        })

        const awayTeam = getTeamForSource({
          sourceType: match.away_source_type,
          sourceGroup: match.away_source_group,
          sourcePosition: match.away_source_position,
          sourceMatch: match.away_source_match,
          thirdOptions: match.away_third_options,
          slotKey: `${match.match_code}:away`,
          groupLookup,
          bestThirdAssignment,
          knockoutPredictionMap: validKnockoutPredictionMap,
          teamLookup,
        })

        const rawPrediction = rawKnockoutPredictionMap[match.match_code]
        const winnerTeamId = rawPrediction?.winner_team_id ?? rawPrediction?.winner_team?.id ?? null
        const winnerTeam =
          winnerTeamId && String(winnerTeamId) === String(homeTeam?.id)
            ? homeTeam
            : winnerTeamId && String(winnerTeamId) === String(awayTeam?.id)
              ? awayTeam
              : null

        if (winnerTeam) {
          validKnockoutPredictionMap[match.match_code] = {
            ...rawPrediction,
            winner_team_id: winnerTeam.id,
            winner_team: winnerTeam,
          }
        }

        resolvedByCode[match.match_code] = {
          ...match,
          homeTeam,
          awayTeam,
          canPredict: Boolean(homeTeam && awayTeam),
          winnerTeamId: winnerTeam?.id ?? null,
        }
      })
  })

  return matches.map((match) => resolvedByCode[match.match_code] ?? match)
}
