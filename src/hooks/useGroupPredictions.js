import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../config/supabase'
import { validateGroupTable } from '../utils/helpers'

export function useGroupPredictions(userId) {
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
        .from('group_predictions')
        .select('*')
        .eq('user_id', userId)
        .order('group_letter')
        .order('predicted_position')

      if (error) throw error
      setPredictions(data ?? [])
    } catch (error) {
      console.error('Unable to load group predictions.', error)
      setPredictions([])
      setError('No se pudieron cargar las predicciones de grupos.')
    } finally {
      setLoading(false)
    }
  }

  async function saveGroupPredictions(groupLetter, rows) {
    setSaving(true)
    setError('')
    const payload = rows.map((row, index) => ({
      user_id: userId,
      team_id: row.team_id,
      group_letter: groupLetter,
      predicted_position: index + 1,
      predicted_points: Number(row.predicted_points ?? row.points ?? 0),
    }))
    const { error } = await supabase.from('group_predictions').upsert(payload, {
      onConflict: 'user_id,team_id',
    })
    setSaving(false)
    if (error) {
      setError('No se pudieron guardar las predicciones de grupos.')
      throw error
    }
    await fetchPredictions()
  }

  function getGroupPredictions(groupLetter) {
    return predictions.filter((row) => row.group_letter === groupLetter)
  }

  function isGroupComplete(groupLetter) {
    const rows = getGroupPredictions(groupLetter)
    return rows.length === 4 && validateGroupTable(rows).valid
  }

  const completedGroupsCount = useMemo(
    () =>
      [...new Set(predictions.map((row) => row.group_letter))].filter((letter) =>
        isGroupComplete(letter)
      ).length,
    [predictions]
  )

  return {
    predictions,
    loading,
    saving,
    error,
    fetchPredictions,
    saveGroupPredictions,
    getGroupPredictions,
    isGroupComplete,
    getCompletedGroupsCount: () => completedGroupsCount,
  }
}
