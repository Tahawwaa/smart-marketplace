import { createContext, useContext } from 'react'
import type { User } from '../../types/api'
import type * as authApi from './api'

export type AuthState = {
  user: User | null
  ready: boolean
  login: (input: authApi.LoginInput) => Promise<void>
  register: (input: authApi.RegisterInput) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === null) throw new Error('useAuth باید داخل AuthProvider استفاده شود.')
  return context
}
