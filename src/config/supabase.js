import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ?? 'https://pvczmhgwcgfzkvniedfs.supabase.co'

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2Y3ptaGd3Y2dmemt2bmllZGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMTQ2OTIsImV4cCI6MjA5MTc5MDY5Mn0.exM3zjrGv_-xWTEsqJy2Yhv7FgRunr6KMYB2q7ckRWw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

export const supabaseProjectId = 'pvczmhgwcgfzkvniedfs'
