import { createContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../config/supabase'

export const AuthContext = createContext(null)

async function mapAuthFunctionError(error, fallbackMessage) {
  const errorName = error?.name ?? ''
  const errorMessage = error?.message ?? ''

  if (errorName === 'FunctionsHttpError' && error?.context) {
    try {
      const status = error.context.status
      const payload = await error.context.json()
      const serverMessage = payload?.error || payload?.message

      if (status === 409) {
        return 'Ese correo, usuario o nombre ya existe. Prueba con otros datos.'
      }

      return serverMessage || fallbackMessage
    } catch {
      return fallbackMessage
    }
  }

  if (errorName === 'FunctionsFetchError' || errorMessage.includes('Failed to send a request to the Edge Function')) {
    return 'No se pudo conectar con Supabase para registrar la solicitud.'
  }

  return errorMessage || fallbackMessage
}

function validateAccessRequest(payload) {
  const email = payload.email?.trim()
  const username = payload.username?.trim()
  const displayName = payload.display_name?.trim() ?? payload.displayName?.trim()
  const password = payload.password?.trim()

  if (!email || !username || !displayName || !password) {
    throw new Error('Completa email, usuario, nombre y contrasena.')
  }

  if (!email.includes('@')) {
    throw new Error('Ingresa un correo valido.')
  }

  if (!/^[a-z0-9._-]{3,30}$/i.test(username)) {
    throw new Error('El usuario debe tener 3-30 caracteres y usar solo letras, numeros, punto, guion o guion bajo.')
  }

  if (password.length < 6) {
    throw new Error('La contrasena debe tener al menos 6 caracteres.')
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')
  const userIdRef = useRef(null)

  async function fetchProfile(userId) {
    if (!userId) {
      return null
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      return data ?? null
    } catch (error) {
      console.error('Unable to load profile for signed-in user.', error)
      return null
    }
  }

  async function clearInactiveSession(message = 'Tu cuenta esta pendiente de aprobacion del admin.') {
    await supabase.auth.signOut()
    userIdRef.current = null
    setUser(null)
    setProfile(null)
    setAuthError(message)
    setLoading(false)
  }

  useEffect(() => {
    let isActive = true

    async function initializeAuth() {
      setLoading(true)
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()
        if (error) throw error
        if (!isActive) return

        const nextUser = session?.user ?? null
        userIdRef.current = nextUser?.id ?? null
        setUser(nextUser)

        if (!nextUser) {
          setProfile(null)
          setAuthError('')
          setLoading(false)
        }
      } catch (error) {
        console.error('Unable to restore auth session.', error)
        if (!isActive) return
        userIdRef.current = null
        setUser(null)
        setProfile(null)
        setAuthError('No se pudo recuperar la sesion actual.')
        setLoading(false)
      }
    }

    void initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isActive) return

      const nextUser = session?.user ?? null
      const nextUserId = nextUser?.id ?? null
      const userChanged = userIdRef.current !== nextUserId

      userIdRef.current = nextUserId
      setUser(nextUser)

      if (!nextUserId) {
        setProfile(null)
        setAuthError('')
        setLoading(false)
        return
      }

      if (userChanged) {
        setAuthError('')
        setLoading(true)
      }
    })

    return () => {
      isActive = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    let isActive = true

    async function loadProfile() {
      if (!user?.id) {
        setProfile(null)
        setLoading(false)
        return
      }

      setLoading(true)
      const nextProfile = await fetchProfile(user.id)
      if (!isActive) return

      if (nextProfile?.is_active === false) {
        await clearInactiveSession()
        return
      }

      setProfile(nextProfile)
      setAuthError(nextProfile ? '' : 'Se inicio sesion, pero no fue posible cargar el perfil del usuario.')
      setLoading(false)
    }

    void loadProfile()

    return () => {
      isActive = false
    }
  }, [user?.id])

  async function refreshSession() {
    setLoading(true)
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()
      if (error) throw error

      const nextUser = session?.user ?? null
      userIdRef.current = nextUser?.id ?? null
      setUser(nextUser)

      if (!nextUser) {
        setProfile(null)
        setAuthError('')
        return
      }

      const nextProfile = await fetchProfile(nextUser.id)
      if (nextProfile?.is_active === false) {
        await clearInactiveSession()
        return
      }

      setProfile(nextProfile)
      setAuthError(nextProfile ? '' : 'Se inicio sesion, pero no fue posible cargar el perfil del usuario.')
    } catch (error) {
      console.error('Unable to refresh auth session.', error)
      setUser(null)
      setProfile(null)
      setAuthError('No se pudo actualizar la sesion.')
    } finally {
      setLoading(false)
    }
  }

  async function login(identifier, password) {
    let email = identifier.trim()

    if (!email.includes('@')) {
      const { data: profileRow, error: lookupError } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', email)
        .single()
      if (lookupError || !profileRow?.email) {
        throw new Error('Usuario no encontrado. Intenta con tu correo.')
      }
      email = profileRow.email
    }

    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setLoading(false)
      throw error
    }

    const signedInUser = data.user ?? data.session?.user ?? null
    const nextProfile = await fetchProfile(signedInUser?.id)

    if (nextProfile?.is_active === false) {
      await clearInactiveSession()
      throw new Error('Tu solicitud ya existe, pero aun esta pendiente de aprobacion del admin.')
    }

    if (!nextProfile) {
      await supabase.auth.signOut()
      userIdRef.current = null
      setUser(null)
      setProfile(null)
      setAuthError('Se inicio sesion, pero no fue posible cargar el perfil del usuario.')
      setLoading(false)
      throw new Error('No fue posible cargar el perfil de esta cuenta.')
    }

    userIdRef.current = signedInUser?.id ?? null
    setUser(signedInUser)
    setProfile(nextProfile)
    setAuthError('')
    setLoading(false)
    return data
  }

  async function requestAccess(payload) {
    validateAccessRequest(payload)

    const { data, error } = await supabase.functions.invoke('request-user', {
      body: {
        email: payload.email?.trim(),
        password: payload.password?.trim(),
        username: payload.username?.trim(),
        display_name: payload.display_name?.trim() ?? payload.displayName?.trim(),
      },
    })

    if (error) {
      throw new Error(await mapAuthFunctionError(error, 'No se pudo registrar la solicitud de acceso.'))
    }

    return data
  }

  async function logout() {
    if (userIdRef.current) {
      localStorage.removeItem(`hero-text-seen-${userIdRef.current}`)
    }
    await supabase.auth.signOut()
    userIdRef.current = null
    setUser(null)
    setProfile(null)
    setAuthError('')
    setLoading(false)
  }

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      authError,
      login,
      logout,
      requestAccess,
      refreshSession,
      isAdmin: profile?.role === 'admin',
      isActive: profile?.is_active !== false,
    }),
    [authError, loading, profile, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
