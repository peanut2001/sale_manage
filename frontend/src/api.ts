export class ApiError extends Error {
  status: number
  data: Record<string, unknown>

  constructor(message: string, status: number, data: Record<string, unknown>) {
    super(message)
    this.status = status
    this.data = data
  }
}

let csrf = ''
let onAuthLost: () => void = () => {}

export function setCsrf(token: string) {
  csrf = token
}

/** 会话失效 (401) 或需要先改密码时的回调, 由 AuthProvider 注册 */
export function setAuthLostHandler(fn: () => void) {
  onAuthLost = fn
}

type Body = Record<string, unknown> | FormData

export async function api<T>(url: string, method = 'GET', body?: Body): Promise<T> {
  const headers: Record<string, string> = {}
  if (method !== 'GET') headers['X-CSRF-Token'] = csrf
  if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json'
  let res: Response
  try {
    res = await fetch(url, {
      method,
      headers,
      credentials: 'same-origin',
      body: body instanceof FormData ? body : body && JSON.stringify(body),
    })
  } catch {
    throw new ApiError('网络连接失败，请检查网络后重试', 0, {})
  }
  const data = res.headers.get('Content-Type')?.includes('json') ? await res.json() : {}
  if (!res.ok) {
    if (res.status === 401 || data.code === 'must_change_pw') onAuthLost()
    throw new ApiError(data.error || `请求失败（${res.status}）`, res.status, data)
  }
  return data as T
}

export const post = <T>(url: string, body: Body = {}) => api<T>(url, 'POST', body)
export const put = <T>(url: string, body: Body = {}) => api<T>(url, 'PUT', body)
export const del = <T>(url: string) => api<T>(url, 'DELETE')

/** 把筛选条件转成查询字符串, 去掉空值 */
export function qs(params: Record<string, string | number | null | undefined>) {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== '' && v !== null && v !== undefined) sp.set(k, String(v))
  }
  const s = sp.toString()
  return s ? `?${s}` : ''
}
