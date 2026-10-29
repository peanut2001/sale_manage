import dayjs, { type Dayjs } from 'dayjs'
import type { Trip } from './types'

export const money = (v: number | null | undefined) =>
  (v || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const tripCost = (t: Pick<Trip, 'cost_transport' | 'cost_hotel' | 'cost_meal' | 'cost_other'>) =>
  t.cost_transport + t.cost_hotel + t.cost_meal + t.cost_other

export const fmtDate = (d?: Dayjs | null) => (d ? d.format('YYYY-MM-DD') : '')
export const fmtMonth = (d?: Dayjs | null) => (d ? d.format('YYYY-MM') : '')
export const toDay = (s?: string | null) => (s ? dayjs(s) : null)
export const weekEnd = (monday: string) => dayjs(monday).add(6, 'day').format('YYYY-MM-DD')

/** 表单值转成接口参数: dayjs 转为 YYYY-MM-DD, 空值转为 '' */
export function serialize(values: object) {
  return Object.fromEntries(
    Object.entries(values).map(([k, v]) => [k, dayjs.isDayjs(v) ? v.format('YYYY-MM-DD') : (v ?? '')]),
  ) as Record<string, unknown>
}

/** 接口数据转成表单初始值: 指定字段的日期字符串转为 dayjs */
export function deserialize<T extends object>(row: T, dateKeys: string[]) {
  const out = { ...row } as Record<string, unknown>
  for (const k of dateKeys) out[k] = toDay(out[k] as string)
  return out
}

export const toOptions = (items: { id: number; name: string }[]) => items.map((i) => ({ value: i.id, label: i.name }))
export const strOptions = (items: string[]) => items.map((s) => ({ value: s, label: s || '-- 无 --' }))

/** 详情页链接 */
export const targetUrl = { trip: '/trips/', weekly: '/weekly/', monthly: '/monthly/' } as const

/** 表格分页: 原页面不分页, 这里每页 20 条 */
export const pagination = { pageSize: 20, showSizeChanger: false, hideOnSinglePage: true } as const
