import { Button, Result, Spin } from 'antd'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, setAuthLostHandler, setCsrf } from '../api'
import { AuthContext } from '../session'
import type { Session } from '../types'

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(
    () =>
      api<Session>('/api/session').then(
        (s) => {
          setCsrf(s.csrf)
          setSession(s)
          setError('')
        },
        (e: Error) => setError(e.message),
      ),
    [],
  )

  useEffect(() => {
    setAuthLostHandler(() => void load())
    load().catch(() => {})
  }, [load])

  const value = useMemo(() => (session ? { session, refresh: load } : null), [session, load])

  if (!value) {
    return error ? (
      <Result status="warning" title="无法连接服务器" subTitle={error}
        extra={<Button type="primary" onClick={() => void load()}>重试</Button>} />
    ) : (
      <Spin size="large" fullscreen />
    )
  }
  return <AuthContext value={value}>{children}</AuthContext>
}
