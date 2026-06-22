import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios.js'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true) // true while checking session

  // On app mount: check if the HTTP-only cookie is valid by calling /me
  // This restores session across page refreshes without touching localStorage
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await api.get('/auth/me')
        setUser(data.user)
      } catch {
        // Cookie missing or expired — user is not logged in
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    checkSession()
  }, [])

  // Called after local login/register — backend already set the cookie
  const login = (userData) => {
    setUser(userData)
  }

  // Called on logout — backend clears the cookie
  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // ignore errors
    }
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