import { useEffect, useState } from 'react'
import { supabase } from '../config/supabase'
import { FALLBACK_MATCHES } from '../utils/constants'

const fallbackMatchByCode = new Map(FALLBACK_MATCHES.map((match) => [match.match_code, match]))

function normalizeMatch(match) {
  const fallbackMatch = fallbackMatchByCode.get(match.match_code)

  return {
    ...match,
    display_name: match.display_name || fallbackMatch?.display_name || match.match_code,
  }
}

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
      setMatches(data?.length ? data.map(normalizeMatch) : FALLBACK_MATCHES)
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
