import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios.js'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false) // don't block render on startup

  // On app mount: check for OAuth token in URL, then verify session in background
  useEffect(() => {
    const checkSession = async () => {
      // Read token from URL after OAuth redirect (e.g. /?token=xxx)
      const params = new URLSearchParams(window.location.search)
      const oauthToken = params.get('token')
      if (oauthToken) {
        localStorage.setItem('token', oauthToken)
        // Clean the token from URL without triggering a reload
        window.history.replaceState({}, '', window.location.pathname)
      }

      try {
        const { data } = await api.get('/auth/me')
        setUser(data.user)
      } catch {
        // Token missing or expired — user is not logged in
        setUser(null)
      }
    }
    checkSession()
  }, [])

  // Called after local login/register — stores token in localStorage for Bearer auth
  const login = (userData, token) => {
    if (token) localStorage.setItem('token', token)
    setUser(userData)
  }

  // Called on logout — clears token from localStorage
  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // ignore errors
    }
    localStorage.removeItem('token')
    setUser(null)
  }

  // Called after completeProfile or updateProfile succeeds
  const updateUser = (updatedUser) => {
    setUser(updatedUser)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)