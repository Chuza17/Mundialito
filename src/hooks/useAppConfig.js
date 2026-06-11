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
      if (config.storage_mode === 'key_value') {
        const updates = []
        const prizePatch = Object.fromEntries(
          Object.entries(patch).filter(([field]) => PRIZE_CONFIG_FIELDS.has(field))
        )

        if (Object.keys(prizePatch).length) {
          updates.push(supabase.from('app_config').update(prizePatch).not('id', 'is', null))
        }

        if (Object.hasOwn(patch, 'deadline')) {
          updates.push(
            supabase
              .from('app_config')
              .update({ value: patch.deadline })
              .eq('key', 'predictions_deadline')
          )
        }

        if (Object.hasOwn(patch, 'predictions_locked')) {
          updates.push(
            supabase
              .from('app_config')
              .update({ value: Boolean(patch.predictions_locked) })
              .eq('key', 'predictions_locked')
          )
        }

        const results = await Promise.all(updates)
        const failedUpdate = results.find((result) => result.error)
        if (failedUpdate?.error) throw failedUpdate.error
      } else {
        const { error } = await supabase
          .from('app_config')
          .update(patch)
          .eq('id', config.id ?? 1)
        if (error) throw error
      }

      await refreshConfig()
    } finally {
      setSaving(false)
    }
  }

  return { config, loading, error, saving, updateConfig, refreshConfig }
}
