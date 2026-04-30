import { useContext, useState } from 'react'
import { PredictionsContext } from '../contexts/PredictionsContext'
import { supabase } from '../config/supabase'

const PRIZE_CONFIG_FIELDS = new Set([
  'group_stage_prize',
  'knockout_prize',
  'first_place_prize',
  'second_place_prize',
  'third_place_prize',
])

export function useAppConfig() {
  const { config, loading, error, refreshConfig } = useContext(PredictionsContext)
  const [saving, setSaving] = useState(false)

  async function updateConfig(patch) {
    setSaving(true)
    try {
      const patchFields = Object.keys(patch)
      const isPrizePatch = patchFields.length > 0 && patchFields.every((field) => PRIZE_CONFIG_FIELDS.has(field))
      const query = supabase.from('app_config').update(patch)
      const { error } = isPrizePatch
        ? await query.not('id', 'is', null)
        : await query.eq('id', config.id ?? 1)

      if (error) throw error
      await refreshConfig()
    } finally {
      setSaving(false)
    }
  }

  return { config, loading, error, saving, updateConfig, refreshConfig }
}
