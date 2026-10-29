import { App } from 'antd'
import dayjs from 'dayjs'
import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { api, ApiError } from './api'
import type { Options, Result } from './types'

export interface ApiState<T> {
  data?: T
  loading: boolean
  error?: ApiError
  reload: () => void
}

/** GET 数据; url 变化时自动重新请求, url 为 null 时不请求 */
export function useApi<T>(url: string | null): ApiState<T> {
  const [tick, setTick] = useState(0)
  // key 标识当前这次请求; 结果对应的 key 与之不同即为加载中 (期间保留上次数据)
  const key = url && `${tick}#${url}`
  const [state, setState] = useState<{ key?: string; data?: T; error?: ApiError }>({})
  useEffect(() => {
    if (!key) return
    let alive = true
    api<T>(key.slice(key.indexOf('#') + 1)).then(
      (data) => alive && setState({ key, data }),
      (error: ApiError) => alive && setState({ key, error }),
    )
    return () => {
      alive = false
    }
  }, [key])
  const reload = useCallback(() => setTick((t) => t + 1), [])
  const done = state.key === key
  return { data: state.data, error: done ? state.error : undefined, loading: !!key && !done, reload }
}

/**
 * 列表页筛选条件保存在地址栏 (刷新/返回不丢失)。
 * dates / months 中的字段在表单里是 dayjs, *_id 字段是数字。
 */
export function useFilters(opts: { dates?: string[]; months?: string[] } = {}) {
  const [sp, setSp] = useSearchParams()
  const params = Object.fromEntries(sp) as Record<string, string>
  const isDate = (k: string) => opts.dates?.includes(k) || opts.months?.includes(k)
  const initial: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(params)) {
    initial[k] = isDate(k) ? dayjs(v) : k.endsWith('_id') ? Number(v) : v
  }
  const apply = (values: Record<string, unknown>) => {
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(values)) {
      if (v === undefined || v === null || v === '') continue
      out[k] = dayjs.isDayjs(v) ? v.format(opts.months?.includes(k) ? 'YYYY-MM' : 'YYYY-MM-DD') : String(v)
    }
    setSp(out)
  }
  return { params, initial, apply, query: sp.toString() }
}

// 下拉选项 (销售员/客户/负责人) 全局缓存: 切换页面不再重复请求和重复渲染
const EMPTY_OPTIONS: Options = { users: [], customers: [], owners: [] }
const OPTIONS_TTL = 60_000
let optionsCache: { data: Options; at: number } | null = null
const optionsListeners = new Set<(o: Options) => void>()

/** 重新获取下拉选项 (新增/审核客户、修改账号后调用) */
export function refreshOptions() {
  return api<Options>('/api/options').then((data) => {
    optionsCache = { data, at: Date.now() }
    optionsListeners.forEach((fn) => fn(data))
  }, () => {})
}

/** 切换登录用户时清空 (不同角色可见的销售员不同) */
export function clearOptions() {
  optionsCache = null
}

export function useOptions() {
  const [data, setData] = useState(optionsCache?.data ?? EMPTY_OPTIONS)
  useEffect(() => {
    optionsListeners.add(setData)
    if (!optionsCache || Date.now() - optionsCache.at > OPTIONS_TTL) void refreshOptions()
    return () => {
      optionsListeners.delete(setData)
    }
  }, [])
  return data
}

/** 执行写操作: 成功提示后台返回的 message, 失败提示错误; 返回结果或 undefined */
export function useAction() {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const run = useCallback(
    async <T extends Result>(fn: () => Promise<T>): Promise<T | undefined> => {
      setLoading(true)
      try {
        const res = await fn()
        if (res.message) message.success(res.message)
        return res
      } catch (e) {
        if (!(e instanceof ApiError && e.status === 401)) message.error((e as Error).message)
        return undefined
      } finally {
        setLoading(false)
      }
    },
    [message],
  )
  return [run, loading] as const
}
