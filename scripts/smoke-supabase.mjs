import { createClient } from '@supabase/supabase-js'

const DEFAULT_SUPABASE_URL = 'https://pvczmhgwcgfzkvniedfs.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2Y3ptaGd3Y2dmemt2bmllZGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMTQ2OTIsImV4cCI6MjA5MTc5MDY5Mn0.exM3zjrGv_-xWTEsqJy2Yhv7FgRunr6KMYB2q7ckRWw'

const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? DEFAULT_SUPABASE_URL
const supabaseAnonKey =
  process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? DEFAULT_SUPABASE_ANON_KEY

const client = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

const tableChecks = [
  { table: 'teams', select: '*' },
  { table: 'app_config', select: '*' },
  { table: 'knockout_matches', select: '*' },
  { table: 'user_scores', select: '*' },
]

const edgeFunctions = ['create-user', 'reset-user-password', 'calculate-scores', 'sync-results']

let failures = 0
let warnings = 0

function printResult(label, status, detail) {
  const prefix = status === 'ok' ? 'OK' : status === 'warn' ? 'WARN' : 'FAIL'
  console.log(`${prefix} ${label}${detail ? ` - ${detail}` : ''}`)

  if (status === 'fail') failures += 1
  if (status === 'warn') warnings += 1
}

function summarizeBody(text) {
  if (!text) return ''

  try {
    const parsed = JSON.parse(text)
    return JSON.stringify(parsed)
  } catch {
    return text.replace(/\s+/g, ' ').trim()
  }
}

async function checkTables() {
  console.log('\nREST tables')

  for (const check of tableChecks) {
    const { data, error, status } = await client.from(check.table).select(check.select).limit(1)

    if (error) {
      printResult(`[REST] ${check.table}`, 'fail', `status=${status} ${error.message}`)
      continue
    }

    const rows = Array.isArray(data) ? data.length : data ? 1 : 0
    printResult(`[REST] ${check.table}`, 'ok', `status=${status} rows=${rows}`)
  }
}

async function postFunction(functionName, headers = {}) {
  const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      apikey: supabaseAnonKey,
      authorization: `Bearer ${supabaseAnonKey}`,
      'content-type': 'application/json',
      ...headers,
    },
    body: '{}',
  })

  return {
    status: response.status,
    body: summarizeBody(await response.text()),
  }
}

async function checkFunctionDeployment() {
  console.log('\nEdge Functions deployment')

  for (const functionName of edgeFunctions) {
    try {
      const response = await postFunction(functionName)

      if (response.status === 404) {
        printResult(`[FN] ${functionName}`, 'fail', '404 function not found/deployed')
        continue
      }

      if (response.status >= 500) {
        printResult(`[FN] ${functionName}`, 'fail', `status=${response.status} ${response.body}`)
        continue
      }

      if (response.status >= 200 && response.status < 300) {
        printResult(`[FN] ${functionName}`, 'warn', `status=${response.status} accepted anon request`)
        continue
      }

      printResult(`[FN] ${functionName}`, 'ok', `status=${response.status} ${response.body}`)
    } catch (error) {
      printResult(`[FN] ${functionName}`, 'fail', error instanceof Error ? error.message : String(error))
    }
  }
}

async function getAdminAccessToken() {
  if (process.env.SUPABASE_ACCESS_TOKEN) return process.env.SUPABASE_ACCESS_TOKEN

  const email = process.env.API_ADMIN_EMAIL
  const password = process.env.API_ADMIN_PASSWORD

  if (!email || !password) return null

  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error || !data.session?.access_token) {
    printResult('[AUTH] admin login', 'fail', error?.message ?? 'No access token returned')
    return null
  }

  printResult('[AUTH] admin login', 'ok', data.user.email ?? data.user.id)
  return data.session.access_token
}

async function checkAdminValidationPath(adminToken) {
  if (!adminToken) return

  console.log('\nAdmin validation path')

  for (const functionName of ['create-user', 'reset-user-password']) {
    const response = await postFunction(functionName, {
      authorization: `Bearer ${adminToken}`,
    })

    if (response.status === 400) {
      printResult(`[FN admin] ${functionName}`, 'ok', `validation reached: ${response.body}`)
      continue
    }

    if (response.status === 404) {
      printResult(`[FN admin] ${functionName}`, 'fail', '404 function not found/deployed')
      continue
    }

    printResult(`[FN admin] ${functionName}`, 'fail', `status=${response.status} ${response.body}`)
  }
}

async function checkMutatingFunctions(adminToken) {
  if (process.env.RUN_MUTATING_API_TESTS !== '1') return

  console.log('\nMutating functions')

  for (const functionName of ['calculate-scores', 'sync-results']) {
    const headers = process.env.CRON_SECRET
      ? { 'x-cron-secret': process.env.CRON_SECRET, authorization: `Bearer ${supabaseAnonKey}` }
      : { authorization: `Bearer ${adminToken ?? supabaseAnonKey}` }

    const response = await postFunction(functionName, headers)

    if (response.status >= 200 && response.status < 300) {
      printResult(`[FN mutating] ${functionName}`, 'ok', response.body)
      continue
    }

    printResult(`[FN mutating] ${functionName}`, 'fail', `status=${response.status} ${response.body}`)
  }
}

await checkTables()
await checkFunctionDeployment()

const adminToken = await getAdminAccessToken()
await checkAdminValidationPath(adminToken)
await checkMutatingFunctions(adminToken)

console.log(`\nSummary: ${failures} failure(s), ${warnings} warning(s)`)
process.exitCode = failures > 0 ? 1 : 0
