import { useContext, useState } from 'react'
import { PredictionsContext } from '../contexts/PredictionsContext'
import { supabase } from '../config/supabase'

export function useAppConfig() {
  const { config, loading, error, refreshConfig } = useContext(PredictionsContext)
  const [saving, setSaving] = useState(false)

  async function updateConfig(patch) {
    setSaving(true)
    const { error } = await supabase.from('app_config').upsert({ id: config.id ?? 1, ...config, ...patch })
    setSaving(false)
    if (error) throw error
    await refreshConfig()
  }

  return { config, loading, error, saving, updateConfig, refreshConfig }
}
