import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('gradmatch_user')
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        localStorage.removeItem('gradmatch_user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (username, password) => {
    localStorage.removeItem('gradmatch_results')
    localStorage.removeItem('gradmatch_prefill')
    const res = await fetch(`${process.env.REACT_APP_API_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    const data = await res.json()
    if (data.success) {
      localStorage.setItem('gradmatch_user', JSON.stringify(data.user || data))
      setUser(data.user || data)
      return { success: true, role: data.role }
    }
    return { success: false, error: data.error }
  }

  const register = async (username, email, password) => {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    })
    const data = await res.json()
    if (data.success) {
      localStorage.setItem('gradmatch_user', JSON.stringify(data))
      setUser(data)
      return { success: true }
    }
    return { success: false, error: data.error }
  }

  const logout = () => {
    localStorage.removeItem('gradmatch_user')
    localStorage.removeItem('gradmatch_results')
    localStorage.removeItem('gradmatch_prefill')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
