import { useEffect, useState } from 'react'
import { supabase } from '../config/supabase'

function validateCreateUserPayload(payload) {
  const email = payload.email?.trim()
  const username = payload.username?.trim()
  const displayName = payload.display_name?.trim() ?? payload.displayName?.trim()
  const password = payload.password?.trim()

  if (!email || !username || !displayName || !password) {
    throw new Error('Completa email, usuario, nombre a mostrar y contrasena temporal antes de crear la cuenta.')
  }

  if (!email.includes('@')) {
    throw new Error('Ingresa un correo valido para crear la cuenta.')
  }

  if (password.length < 6) {
    throw new Error('La contrasena temporal debe tener al menos 6 caracteres.')
  }
}

async function mapFunctionError(error, fallbackMessage) {
  const errorName = error?.name ?? ''
  const errorMessage = error?.message ?? ''

  if (errorName === 'FunctionsHttpError' && error?.context) {
    try {
      const status = error.context.status
      const payload = await error.context.json()
      const serverMessage = payload?.error || payload?.message

      if (status === 401 || status === 403) {
        return 'Tu sesion de administrador expiro o no tiene permisos suficientes. Cierra sesion y vuelve a entrar como admin.'
      }

      return serverMessage || fallbackMessage
    } catch {
      return fallbackMessage
    }
  }

  if (errorName === 'FunctionsFetchError' || errorMessage.includes('Failed to send a request to the Edge Function')) {
    return 'No se pudo conectar con la Edge Function de Supabase. Normalmente esto pasa cuando la funcion no esta desplegada, el proyecto no responde o la red bloqueo la solicitud.'
  }

  if (errorName === 'FunctionsRelayError') {
    return 'Supabase recibio la solicitud, pero no pudo enrutarla hacia la Edge Function. Revisa el despliegue de create-user.'
  }

  return errorMessage || fallbackMessage
}

export function useAdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchUsers().catch(() => undefined)
  }, [])

  async function fetchUsers() {
    setLoading(true)
    setError('')
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('display_name')
      if (error) throw error
      setUsers(data ?? [])
    } catch (error) {
      console.error('Unable to load admin users.', error)
      setUsers([])
      setError('No se pudieron cargar los usuarios desde Supabase.')
      throw error
    } finally {
      setLoading(false)
    }
  }

  async function createUser(payload) {
    setError('')
    validateCreateUserPayload(payload)

    const { data, error } = await supabase.functions.invoke('create-user', {
      body: {
        email: payload.email?.trim(),
        password: payload.password?.trim(),
        username: payload.username?.trim(),
        display_name: payload.display_name?.trim() ?? payload.displayName?.trim(),
      },
    })

    if (error) {
      throw new Error(await mapFunctionError(error, 'No se pudo crear el usuario en Supabase.'))
    }

    await fetchUsers()
    return data
  }

  async function deleteUser(profileId) {
    setError('')
    const { error } = await supabase.from('profiles').update({ is_active: false }).eq('id', profileId)
    if (error) throw error
    await fetchUsers()
  }

  async function resetPassword(payload) {
    setError('')
    const { data, error } = await supabase.functions.invoke('reset-user-password', {
      body: {
        userId: payload.userId,
        password: payload.password,
      },
    })
    if (error) {
      throw new Error(await mapFunctionError(error, 'No se pudo resetear la contrasena del usuario.'))
    }
    return data
  }

  return { users, loading, error, fetchUsers, createUser, deleteUser, resetPassword }
}
