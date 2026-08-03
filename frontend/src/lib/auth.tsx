'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { WorkspaceAdminInfo } from '@/types'
import * as api from '@/lib/api'

interface AuthState {
  workspace: WorkspaceAdminInfo | null
  token: string | null
  loading: boolean
  error: string | null
}

interface AuthContextType extends AuthState {
  login: (slug: string, password: string) => Promise<void>
  signup: (data: {
    slug: string
    name: string
    profile: string
    password: string
    sector?: string
    business_description?: string
    contact_phone?: string
    contact_email?: string
  }) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    workspace: null,
    token: null,
    loading: true,
    error: null,
  })

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Rehydrate on mount
  useEffect(() => {
    const token = localStorage.getItem('sevak_token')
    const stored = localStorage.getItem('sevak_workspace')

    if (token && stored) {
      try {
        const workspace = JSON.parse(stored) as WorkspaceAdminInfo
        // Validate session is still alive
        api.getMe()
          .then(me => {
            setState({ workspace: me, token, loading: false, error: null })
          })
          .catch(() => {
            localStorage.removeItem('sevak_token')
            localStorage.removeItem('sevak_workspace')
            setState({ workspace: null, token: null, loading: false, error: null })
          })
      } catch {
        localStorage.removeItem('sevak_token')
        localStorage.removeItem('sevak_workspace')
        setState({ workspace: null, token: null, loading: false, error: null })
      }
    } else {
      setState(prev => ({ ...prev, loading: false }))
    }
  }, [])

  const login = useCallback(async (slug: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const res = await api.login(slug, password)
      localStorage.setItem('sevak_token', res.token)
      localStorage.setItem('sevak_workspace', JSON.stringify(res.workspace))
      setState({ workspace: res.workspace, token: res.token, loading: false, error: null })
    } catch (err: any) {
      localStorage.removeItem('sevak_token')
      localStorage.removeItem('sevak_workspace')
      setState({ workspace: null, token: null, loading: false, error: err.message || 'Login failed' })
      throw err
    }
  }, [])

  const signup = useCallback(async (data: {
    slug: string
    name: string
    profile: string
    password: string
    sector?: string
    business_description?: string
    contact_phone?: string
    contact_email?: string
  }) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const res = await api.signup(data)
      localStorage.setItem('sevak_token', res.token)
      localStorage.setItem('sevak_workspace', JSON.stringify(res.workspace))
      setState({ workspace: res.workspace, token: res.token, loading: false, error: null })
    } catch (err: any) {
      setState(prev => ({ ...prev, loading: false, error: err.message || 'Signup failed' }))
      throw err
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.logout()
    } catch { /* ignore */ }
    localStorage.removeItem('sevak_token')
    localStorage.removeItem('sevak_workspace')
    setState({ workspace: null, token: null, loading: false, error: null })
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
