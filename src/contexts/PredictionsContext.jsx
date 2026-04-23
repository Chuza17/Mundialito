import { createContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../config/supabase'
import { DEFAULT_DEADLINE, FALLBACK_TEAMS } from '../utils/constants'

export const PredictionsContext = createContext(null)

export function PredictionsProvider({ children }) {
  const [teams, setTeams] = useState(FALLBACK_TEAMS)
  const [config, setConfig] = useState({
    deadline: DEFAULT_DEADLINE,
    predictions_locked: false,
    group_stage_prize: 0,
    knockout_prize: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function bootstrap() {
      setLoading(true)
      setError('')
      try {
        const [
          { data: teamsData, error: teamsError },
          { data: configData, error: configError },
        ] = await Promise.all([
          supabase.from('teams').select('*').order('group_letter').order('name'),
          supabase.from('app_config').select('*').limit(1).maybeSingle(),
        ])

        if (teamsError) throw teamsError
        if (configError) throw configError

        setTeams(teamsData?.length ? teamsData : FALLBACK_TEAMS)
        if (configData) {
          setConfig({
            deadline: DEFAULT_DEADLINE,
            predictions_locked: false,
            group_stage_prize: 0,
            knockout_prize: 0,
            ...configData,
          })
        }
      } catch (error) {
        console.error('Unable to bootstrap app data from Supabase.', error)
        setTeams(FALLBACK_TEAMS)
        setConfig({
          deadline: DEFAULT_DEADLINE,
          predictions_locked: false,
          group_stage_prize: 0,
          knockout_prize: 0,
        })
        setError('No se pudieron cargar algunos datos base desde Supabase.')
      } finally {
        setLoading(false)
      }
    }

    void bootstrap()
  }, [])

  const value = useMemo(
    () => ({
      teams,
      config,
      loading,
      error,
      refreshTeams: async () => {
        const { data, error: teamsError } = await supabase
          .from('teams')
          .select('*')
          .order('group_letter')
          .order('name')
        if (teamsError) throw teamsError
        if (data?.length) setTeams(data)
        setError('')
      },
      refreshConfig: async () => {
        const { data, error: configError } = await supabase
          .from('app_config')
          .select('*')
          .limit(1)
          .maybeSingle()
        if (configError) throw configError
        if (data) {
          setConfig({
            deadline: DEFAULT_DEADLINE,
            predictions_locked: false,
            group_stage_prize: 0,
            knockout_prize: 0,
            ...data,
          })
        }
        setError('')
      },
    }),
    [config, error, loading, teams]
  )

  return <PredictionsContext.Provider value={value}>{children}</PredictionsContext.Provider>
}
