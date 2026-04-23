import { createClient } from 'npm:@supabase/supabase-js@2'
import { errorResponse } from './http.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  throw new Error('Missing required Supabase environment variables.')
}

export const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

function getBearerToken(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return null

  const [scheme, token] = authHeader.split(' ')
  if (scheme !== 'Bearer' || !token) return null

  return token
}

export async function requireAdmin(req: Request) {
  const token = getBearerToken(req)
  if (!token) {
    return {
      ok: false as const,
      response: errorResponse('Missing Authorization bearer token.', 401),
    }
  }

  const {
    data: { user },
    error: authError,
  } = await adminClient.auth.getUser(token)

  if (authError || !user) {
    return {
      ok: false as const,
      response: errorResponse('Invalid or expired session.', 401, authError?.message),
    }
  }

  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('id, role, is_active')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return {
      ok: false as const,
      response: errorResponse('Admin profile not found.', 403, profileError?.message),
    }
  }

  if (profile.is_active === false) {
    return {
      ok: false as const,
      response: errorResponse('Your account is inactive.', 403),
    }
  }

  if (profile.role !== 'admin') {
    return {
      ok: false as const,
      response: errorResponse('Admin privileges are required.', 403),
    }
  }

  return {
    ok: true as const,
    user,
    profile,
  }
}

export async function requireAdminOrCron(req: Request) {
  const cronSecret = Deno.env.get('CRON_SECRET')
  const incomingCronSecret = req.headers.get('x-cron-secret')

  if (cronSecret && incomingCronSecret && cronSecret === incomingCronSecret) {
    return {
      ok: true as const,
      mode: 'cron' as const,
    }
  }

  const adminCheck = await requireAdmin(req)
  if (!adminCheck.ok) return adminCheck

  return {
    ...adminCheck,
    mode: 'admin' as const,
  }
}
