import { useEffect, useState } from 'react'
import { supabase } from '../config/supabase'

export function useBestThirds(userId) {
  const [bestThirds, setBestThirds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!userId) {
      setBestThirds([])
      setError('')
      setLoading(false)
      return
    }

    void fetchBestThirds()
  }, [userId])

  async function fetchBestThirds() {
    if (!userId) {
      setBestThirds([])
      setError('')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase
        .from('best_thirds_predictions')
        .select('*')
        .eq('user_id', userId)

      if (error) throw error
      setBestThirds(data ?? [])
    } catch (error) {
      console.error('Unable to load best thirds predictions.', error)
      setBestThirds([])
      setError('No se pudieron cargar los mejores terceros.')
    } finally {
      setLoading(false)
    }
  }

  async function saveBestThirds(groupLetters) {
    setError('')
    await supabase.from('best_thirds_predictions').delete().eq('user_id', userId)
    const payload = groupLetters.map((groupLetter) => ({
      user_id: userId,
      group_letter: groupLetter,
      qualifies: true,
    }))
    if (payload.length) {
      const { error } = await supabase.from('best_thirds_predictions').insert(payload)
      if (error) {
        setError('No se pudieron guardar los mejores terceros.')
        throw error
      }
    }
    await fetchBestThirds()
  }

  return { bestThirds, loading, error, fetchBestThirds, saveBestThirds }
}
