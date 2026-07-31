import { useEffect, useState } from 'react'
import { ROLES } from '../constants/auth.js'
import {
  clearStoredSession,
  fetchCurrentUser,
  getSession,
  loginUser,
  logoutUser,
} from '../services/auth.js'
import { AuthContext } from './auth-context.js'

const getHomeRouteForRole = (role) => {
  if (role === ROLES.SUPER_ADMIN) {
    return '/admin/dashboard'
  }

  if (role === ROLES.DOCTOR) {
    return '/doctor/dashboard'
  }

  if (role === ROLES.RECEPTIONIST) {
    return '/receptionist/dashboard'
  }

  return '/unauthorized'
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getSession())
  const [isBootstrapping, setIsBootstrapping] = useState(true)

  useEffect(() => {
    const restoreSession = async () => {
      const existingSession = getSession()

      if (!existingSession) {
        setSession(null)
        setIsBootstrapping(false)
        return
      }

      try {
        const currentUser = await fetchCurrentUser()

        if (!currentUser) {
          clearStoredSession()
          setSession(null)
        } else {
          setSession({
            accessToken: existingSession.accessToken,
            user: currentUser,
          })
        }
      } catch {
        clearStoredSession()
        setSession(null)
      } finally {
        setIsBootstrapping(false)
      }
    }

    restoreSession()
  }, [])

  const signIn = async (credentials) => {
    const nextSession = await loginUser(credentials)
    setSession(nextSession)
    return nextSession
  }

  const signOut = async () => {
    await logoutUser()
    setSession(null)
  }

  const value = {
    session,
    user: session?.user ?? null,
    isAuthenticated: Boolean(session?.accessToken && session?.user),
    isBootstrapping,
    signIn,
    signOut,
    getHomeRouteForRole,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
