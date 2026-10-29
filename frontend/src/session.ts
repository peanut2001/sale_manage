import { createContext, useContext } from 'react'
import type { Role, Session } from './types'

export interface AuthValue {
  session: Session
  refresh: () => Promise<void>
}

export const AuthContext = createContext<AuthValue | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth 必须在 AuthProvider 内使用')
  return ctx
}

/** 当前登录用户 (仅在 RequireAuth 保护的页面中使用) */
export function useMe() {
  const { session } = useAuth()
  const me = session.user!
  const isManager: boolean = me.role === 'manager' || me.role === 'admin'
  return { me, isManager, roleName: session.roles[me.role] }
}

export const hasRole = (role: Role, roles?: Role[]) => !roles || roles.includes(role)
