import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../config/supabase'
import { resolveBracket } from '../utils/bracketLogic'
import { getMatchesByRound } from '../utils/bracketLogic'
import { ROUNDS } from '../utils/constants'

export function useKnockoutPredictions({
  userId,
  teams,
  groupPredictions,
  bestThirds,
  matches,
}) {
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!userId) {
      setPredictions([])
      setError('')
      setLoading(false)
      return
    }

    void fetchPredictions()
  }, [userId])

  async function fetchPredictions() {
    if (!userId) {
      setPredictions([])
      setError('')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase
        .from('knockout_predictions')
        .select('*')
        .eq('user_id', userId)
        .order('match_code')

      if (error) throw error
      setPredictions(data ?? [])
    } catch (error) {
      console.error('Unable to load knockout predictions.', error)
      setPredictions([])
      setError('No se pudieron cargar las predicciones de eliminatorias.')
    } finally {
      setLoading(false)
    }
  }

  async function saveWinner(matchCode, winnerTeamId) {
    setError('')
    const { error } = await supabase.from('knockout_predictions').upsert(
      {
        user_id: userId,
        match_code: matchCode,
        winner_team_id: winnerTeamId,
      },
      { onConflict: 'user_id,match_code' }
    )
    if (error) {
      setError('No se pudo guardar la predicción de eliminatorias.')
      throw error
    }
    await fetchPredictions()
  }

  async function resetFromMatch(matchCode) {
    const allMatches = getMatchesByRound(matches)
    const ordered = [
      ...allMatches[ROUNDS.ROUND_OF_32],
      ...allMatches[ROUNDS.ROUND_OF_16],
      ...allMatches[ROUNDS.QUARTER_FINALS],
      ...allMatches[ROUNDS.SEMI_FINALS],
      ...allMatches[ROUNDS.FINAL],
    ]
    const index = ordered.findIndex((match) => match.match_code === matchCode)
    const toDelete = ordered.slice(index).map((match) => match.match_code)
    const { error } = await supabase
      .from('knockout_predictions')
      .delete()
      .eq('user_id', userId)
      .in('match_code', toDelete)
    if (error) {
      setError('No se pudieron reiniciar las predicciones de eliminatorias.')
      throw error
    }
    await fetchPredictions()
  }

  const resolvedMatches = useMemo(
    () =>
      resolveBracket({
        matches,
        teams,
        groupPredictions,
        bestThirds,
        knockoutPredictions: predictions,
      }),
    [bestThirds, groupPredictions, matches, predictions, teams]
  )

  function isRoundComplete(round) {
    return resolvedMatches
      .filter((match) => match.round === round)
      .every((match) => Boolean(match.winnerTeamId))
  }

  function canPredictMatch(matchCode) {
    const match = resolvedMatches.find((item) => item.match_code === matchCode)
    return Boolean(match?.canPredict)
  }

  return {
    predictions,
    matches: resolvedMatches,
    loading,
    error,
    fetchPredictions,
    saveWinner,
    resetFromMatch,
    isRoundComplete,
    canPredictMatch,
  }
}
