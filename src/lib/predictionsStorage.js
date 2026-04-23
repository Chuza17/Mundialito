const STORAGE_KEY = 'el-mundialito-predictions-v3'

export function loadPredictions() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

export function savePredictions(predictions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(predictions))
}

// Temporary local adapter. The next step is replacing these functions
// with Supabase reads/writes once auth and tables are ready.
