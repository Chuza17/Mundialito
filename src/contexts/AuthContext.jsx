import { createContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../config/supabase'

export const AuthContext = createContext(null)

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
        setAuthError('No se pudo recuperar la sesión actual.')
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

      setProfile(nextProfile)
      setAuthError(
        nextProfile
          ? ''
          : 'Se inició sesión, pero no fue posible cargar el perfil del usuario.',
      )
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
      setProfile(nextProfile)
      setAuthError(
        nextProfile
          ? ''
          : 'Se inició sesión, pero no fue posible cargar el perfil del usuario.',
      )
    } catch (error) {
      console.error('Unable to refresh auth session.', error)
      setUser(null)
      setProfile(null)
      setAuthError('No se pudo actualizar la sesión.')
    } finally {
      setLoading(false)
    }
  }

  async function login(identifier, password) {
    // Supabase signInWithPassword requires an email. If the user typed a username,
    // look up the email first from the profiles table.
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

    await refreshSession()
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
      refreshSession,
      isAdmin: profile?.role === 'admin',
    }),
    [authError, loading, profile, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
