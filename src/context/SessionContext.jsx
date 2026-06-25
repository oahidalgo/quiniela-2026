import { createContext, useContext, useState, useEffect } from 'react'

const SessionContext = createContext(null)

const SESSION_KEY = 'q2026_token'
const USER_KEY = 'q2026_user'

export function SessionProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(SESSION_KEY))
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)) } catch { return null }
  })

  function login(userData, sessionToken) {
    setToken(sessionToken)
    setUser(userData)
    localStorage.setItem(SESSION_KEY, sessionToken)
    localStorage.setItem(USER_KEY, JSON.stringify(userData))
  }

  function logout() {
    setToken(null)
    setUser(null)
    localStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(USER_KEY)
  }

  const isAdmin = user?.is_admin === true
  const isLoggedIn = !!token

  return (
    <SessionContext.Provider value={{ token, user, isAdmin, isLoggedIn, login, logout }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  return useContext(SessionContext)
}
