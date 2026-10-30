import type { Target, Visit } from '../../types'

export interface DayStat {
  date: string
  visits: number
  first: number
}

export interface PerfRow {
  label: string
  visits: number
  amount: number
}

export interface Spot {
  name: string
  lng: number
  lat: number
  count: number
}

export interface Stop {
  name: string
  lng: number
  lat: number
  start: string
  end: string
  visits: number
}

export interface Track {
  user_id: number
  name: string
  stops: Stop[]
  visits: number
  unlocated: number
}

export interface CustomerMapData {
  spots: Spot[]
  unlocated: number
  total: number
}

export interface DashboardData {
  month: string
  visits: { c: number; cc: number }
  trips: { c: number; cost: number }
  prev: { visits: { c: number; cc: number }; trips: { c: number; cost: number } }
  trend: DayStat[]
  performance: { mode: 'team' | 'months'; rows: PerfRow[] }
  customer_map: CustomerMapData
  tracks: Track[]
  recent: Visit[]
  followups: Visit[]
  rejected: { type: Target; id: number; label: string; d: string; title: string }[]
}

/** 「苏州市」→「苏州」, 用于图上的简短标签 */
export const shortCity = (name: string) => name.replace(/(特别行政区|自治州|地区|市|省)$/, '').slice(0, 4)
