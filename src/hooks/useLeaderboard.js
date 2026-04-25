import { useEffect, useState } from 'react'
import { supabase } from '../config/supabase'
import { fetchLeaderboardEntries } from '../utils/leaderboard'

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
    const { data, error: fetchError } = await fetchLeaderboardEntries(supabase)

    setError(fetchError)
    setLeaderboard(data ?? [])
    setLoading(false)
  }

  return { leaderboard, loading, error, refreshLeaderboard: fetchLeaderboard }
}
