import { adminClient } from '../_shared/admin.ts'
import { corsHeaders, errorResponse, jsonResponse } from '../_shared/http.ts'

type RequestUserPayload = {
  email?: string
  password?: string
  username?: string
  display_name?: string
  displayName?: string
}

function normalizeUsername(value = '') {
  return value.trim().toLowerCase()
}

async function findExistingProfile(email: string, username: string, displayName: string) {
  const checks = [
    ['email', email],
    ['username', username],
    ['display_name', displayName],
  ]

  for (const [column, value] of checks) {
    const { data, error } = await adminClient
      .from('profiles')
      .select('id')
      .eq(column, value)
      .maybeSingle()

    if (error) {
      return { error }
    }

    if (data) {
      return { data }
    }
  }

  return { data: null, error: null }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed.', 405)
  }

  let payload: RequestUserPayload

  try {
    payload = await req.json()
  } catch {
    return errorResponse('Invalid JSON body.', 400)
  }

  const email = payload.email?.trim().toLowerCase()
  const password = payload.password?.trim()
  const username = normalizeUsername(payload.username)
  const displayName = payload.display_name?.trim() || payload.displayName?.trim()

  if (!email || !password || !username || !displayName) {
    return errorResponse('email, password, username and display_name are required.', 400)
  }

  if (!email.includes('@')) {
    return errorResponse('A valid email is required.', 400)
  }

  if (password.length < 6) {
    return errorResponse('Password must be at least 6 characters.', 400)
  }

  if (!/^[a-z0-9._-]{3,30}$/i.test(username)) {
    return errorResponse(
      'Username must be 3-30 characters and only use letters, numbers, dot, underscore or hyphen.',
      400
    )
  }

  const { data: existingProfile, error: existingProfileError } = await findExistingProfile(email, username, displayName)

  if (existingProfileError) {
    return errorResponse('Unable to validate existing profiles.', 500, existingProfileError.message)
  }

  if (existingProfile) {
    return errorResponse('Email, username or display name already exists.', 409)
  }

  const { data: createdUserData, error: createUserError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      username,
      display_name: displayName,
      access_status: 'pending_admin_approval',
    },
  })

  if (createUserError || !createdUserData.user) {
    const alreadyExists = /already|registered|exists/i.test(createUserError?.message ?? '')
    return errorResponse(
      alreadyExists ? 'Email already exists.' : 'Unable to create auth user.',
      alreadyExists ? 409 : 500,
      createUserError?.message
    )
  }

  const authUser = createdUserData.user

  const { error: profileInsertError } = await adminClient.from('profiles').insert({
    id: authUser.id,
    email,
    username,
    display_name: displayName,
    role: 'user',
    is_active: false,
  })

  if (profileInsertError) {
    await adminClient.auth.admin.deleteUser(authUser.id)
    return errorResponse('Auth user created, but profile insert failed.', 500, profileInsertError.message)
  }

  return jsonResponse(
    {
      message: 'Access request created. An admin must approve this account before login.',
      user: {
        id: authUser.id,
        email: authUser.email,
        username,
        display_name: displayName,
        role: 'user',
        is_active: false,
      },
    },
    201
  )
})
