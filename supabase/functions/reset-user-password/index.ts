import { adminClient, requireAdmin } from '../_shared/admin.ts'
import { corsHeaders, errorResponse, jsonResponse } from '../_shared/http.ts'

type ResetPasswordPayload = {
  userId?: string
  password?: string
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed.', 405)
  }

  const adminCheck = await requireAdmin(req)
  if (!adminCheck.ok) return adminCheck.response

  let payload: ResetPasswordPayload

  try {
    payload = await req.json()
  } catch {
    return errorResponse('Invalid JSON body.', 400)
  }

  const userId = payload.userId?.trim()
  const password = payload.password?.trim()

  if (!userId || !password) {
    return errorResponse('userId and password are required.', 400)
  }

  if (password.length < 6) {
    return errorResponse('Password must be at least 6 characters.', 400)
  }

  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('id, username, display_name, role, is_active')
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    return errorResponse('Target profile not found.', 404, profileError?.message)
  }

  const { error: resetError } = await adminClient.auth.admin.updateUserById(userId, {
    password,
  })

  if (resetError) {
    return errorResponse('Unable to reset password.', 500, resetError.message)
  }

  return jsonResponse({
    message: 'Password reset successfully.',
    user: {
      id: profile.id,
      username: profile.username,
      display_name: profile.display_name,
    },
  })
})
