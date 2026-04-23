import { useEffect, useState } from 'react'
import { supabase } from '../config/supabase'
import { FALLBACK_MATCHES } from '../utils/constants'

export function useKnockoutMatches() {
  const [matches, setMatches] = useState(FALLBACK_MATCHES)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    void fetchMatches()
  }, [])

  async function fetchMatches() {
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.from('knockout_matches').select('*').order('match_code')
      if (error) throw error
      setMatches(data?.length ? data : FALLBACK_MATCHES)
    } catch (error) {
      console.error('Unable to load knockout matches.', error)
      setMatches(FALLBACK_MATCHES)
      setError('No se pudieron cargar los partidos de eliminatorias.')
    } finally {
      setLoading(false)
    }
  }

  return { matches, loading, error, fetchMatches }
}
