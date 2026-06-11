import { createContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../config/supabase'
import { DEFAULT_DEADLINE, FALLBACK_TEAMS } from '../utils/constants'

export const PredictionsContext = createContext(null)

const DEFAULT_CONFIG = {
  deadline: DEFAULT_DEADLINE,
  predictions_locked: false,
  group_stage_prize: 0,
  knockout_prize: 0,
  first_place_prize: 0,
  second_place_prize: 0,
  third_place_prize: 0,
}

function parseConfigBoolean(value) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return value.toLowerCase() === 'true'
  return Boolean(value)
}

function normalizeConfigRows(rows = []) {
  if (!rows.length) return DEFAULT_CONFIG

  const firstRow = rows[0]
  const isKeyValueConfig = rows.some((row) => row.key)

  if (!isKeyValueConfig) {
    return {
      ...DEFAULT_CONFIG,
      ...firstRow,
      storage_mode: 'columns',
    }
  }

  const rowByKey = new Map(rows.map((row) => [row.key, row]))
  const deadlineRow = rowByKey.get('predictions_deadline')
  const lockedRow = rowByKey.get('predictions_locked')

  return {
    ...DEFAULT_CONFIG,
    id: deadlineRow?.id ?? firstRow.id,
    deadline: deadlineRow?.value || DEFAULT_DEADLINE,
    predictions_locked: parseConfigBoolean(lockedRow?.value),
    group_stage_prize: Number(firstRow.group_stage_prize ?? 0),
    knockout_prize: Number(firstRow.knockout_prize ?? 0),
    first_place_prize: Number(firstRow.first_place_prize ?? 0),
    second_place_prize: Number(firstRow.second_place_prize ?? 0),
    third_place_prize: Number(firstRow.third_place_prize ?? 0),
    storage_mode: 'key_value',
  }
}

export function PredictionsProvider({ children }) {
  const [teams, setTeams] = useState(FALLBACK_TEAMS)
  const [config, setConfig] = useState(DEFAULT_CONFIG)
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
          supabase.from('app_config').select('*').order('id'),
        ])

        if (teamsError) throw teamsError
        if (configError) throw configError

        setTeams(teamsData?.length ? teamsData : FALLBACK_TEAMS)
        setConfig(normalizeConfigRows(configData))
      } catch (error) {
        console.error('Unable to bootstrap app data from Supabase.', error)
        setTeams(FALLBACK_TEAMS)
        setConfig(DEFAULT_CONFIG)
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
          .order('id')
        if (configError) throw configError
        setConfig(normalizeConfigRows(data))
        setError('')
      },
    }),
    [config, error, loading, teams]
  )

  return <PredictionsContext.Provider value={value}>{children}</PredictionsContext.Provider>
}
