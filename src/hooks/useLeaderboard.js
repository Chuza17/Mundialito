import { useEffect, useState } from 'react'
import { supabase } from '../config/supabase'

export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchLeaderboard()

    const channel = supabase
      .channel('leaderboard-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_scores' },
        () => fetchLeaderboard()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => fetchLeaderboard()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchLeaderboard() {
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('user_scores')
      .select(`
        user_id,
        total_points,
        completion_percentage,
        last_calculated_at,
        match_score_bonus_points,
        breakdown,
        profiles(display_name, username)
      `)
      .order('total_points', { ascending: false })

    if (fetchError) {
      setError(fetchError)
      setLeaderboard([])
      setLoading(false)
      return
    }

    setLeaderboard(data ?? [])
    setLoading(false)
  }

  return { leaderboard, loading, error, refreshLeaderboard: fetchLeaderboard }
}
