import { FALLBACK_MATCHES, FALLBACK_TEAMS, GROUPS, ROUNDS } from '../../utils/constants'
import { getMatchesByRound, resolveBracket } from '../../utils/bracketLogic'
import type { BracketMatch } from './bracketTypes'

const mockPoints = [9, 7, 5, 1]

export const mockGroupPredictions = GROUPS.flatMap((groupLetter) => {
  const teams = FALLBACK_TEAMS.filter((team) => team.group_letter === groupLetter).slice(0, 4)

  return teams.map((team, index) => ({
    team_id: team.id,
    group_letter: groupLetter,
    predicted_position: index + 1,
    predicted_points: mockPoints[index] ?? 0,
  }))
})

export const mockBestThirds = GROUPS.slice(0, 8).map((group_letter) => ({
  group_letter,
  qualifies: true,
}))

export const mockBracketMatches = resolveBracket({
  matches: FALLBACK_MATCHES,
  teams: FALLBACK_TEAMS,
  groupPredictions: mockGroupPredictions,
  bestThirds: mockBestThirds,
  knockoutPredictions: [],
}) as BracketMatch[]

const grouped = getMatchesByRound(mockBracketMatches)

export const knockoutMockData = {
  roundOf32: grouped[ROUNDS.ROUND_OF_32],
  roundOf16: grouped[ROUNDS.ROUND_OF_16],
  quarterFinals: grouped[ROUNDS.QUARTER_FINALS],
  semiFinals: grouped[ROUNDS.SEMI_FINALS],
  final: grouped[ROUNDS.FINAL],
}
