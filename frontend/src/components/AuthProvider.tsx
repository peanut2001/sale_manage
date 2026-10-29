import { Button, Result, Spin } from 'antd'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, setAuthLostHandler, setCsrf } from '../api'
import { clearOptions } from '../hooks'
import { AuthContext } from '../session'
import type { Session } from '../types'

const POLL_MS = 60_000 // 定时刷新登录状态和待审批数
let lastJson = '' // 上次的会话内容, 用于判断是否变化

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(
    () =>
      api<Session>('/api/session').then(
        (s) => {
          setCsrf(s.csrf)
          // 内容没变就不更新, 避免整个页面重新渲染
          const json = JSON.stringify(s)
          if (json !== lastJson) {
            const prevUser = lastJson && (JSON.parse(lastJson) as Session).user?.id
            if (prevUser !== s.user?.id) clearOptions()
            lastJson = json
            setSession(s)
          }
          setError('')
        },
        (e: Error) => setError(e.message),
      ),
    [],
  )

  useEffect(() => {
    setAuthLostHandler(() => void load())
    load().catch(() => {})
    const timer = setInterval(() => void load(), POLL_MS)
    const onVisible = () => document.visibilityState === 'visible' && void load()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
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
