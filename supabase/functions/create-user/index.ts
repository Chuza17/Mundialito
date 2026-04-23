import { adminClient, requireAdmin } from '../_shared/admin.ts'
import { corsHeaders, errorResponse, jsonResponse } from '../_shared/http.ts'

type CreateUserPayload = {
  email?: string
  password?: string
  username?: string
  display_name?: string
  displayName?: string
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

  let payload: CreateUserPayload

  try {
    payload = await req.json()
  } catch {
    return errorResponse('Invalid JSON body.', 400)
  }

  const email = payload.email?.trim().toLowerCase()
  const password = payload.password?.trim()
  const username = payload.username?.trim().toLowerCase()
  const displayName = payload.display_name?.trim() || payload.displayName?.trim()

  if (!email || !password || !username || !displayName) {
    return errorResponse('email, password, username and display_name are required.', 400)
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

  const { data: existingProfile } = await adminClient
    .from('profiles')
    .select('id')
    .or(`username.eq.${username},display_name.eq.${displayName}`)
    .limit(1)

  if (existingProfile?.length) {
    return errorResponse('Username or display name already exists.', 409)
  }

  const { data: existingEmail, error: emailLookupError } = await adminClient.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })

  if (emailLookupError) {
    return errorResponse('Unable to validate existing users.', 500, emailLookupError.message)
  }

  const emailTaken = existingEmail.users.some((user) => user.email?.toLowerCase() === email)
  if (emailTaken) {
    return errorResponse('Email already exists.', 409)
  }

  const { data: createdUserData, error: createUserError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      username,
      display_name: displayName,
    },
  })

  if (createUserError || !createdUserData.user) {
    return errorResponse('Unable to create auth user.', 500, createUserError?.message)
  }

  const authUser = createdUserData.user

  const { error: profileInsertError } = await adminClient.from('profiles').insert({
    id: authUser.id,
    email,
    username,
    display_name: displayName,
    role: 'user',
    is_active: true,
  })

  if (profileInsertError) {
    await adminClient.auth.admin.deleteUser(authUser.id)
    return errorResponse('Auth user created, but profile insert failed.', 500, profileInsertError.message)
  }

  return jsonResponse(
    {
      message: 'User created successfully.',
      user: {
        id: authUser.id,
        email: authUser.email,
        username,
        display_name: displayName,
        role: 'user',
        is_active: true,
      },
    },
    201
  )
})
