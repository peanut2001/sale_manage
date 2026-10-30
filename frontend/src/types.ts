export type Role = 'sales' | 'manager' | 'admin'
export type Level = 'A' | 'B' | 'C'
export type Target = 'trip' | 'weekly' | 'monthly'

export interface User {
  id: number
  username: string
  name: string
  role: Role
  must_change_pw: number
  avatar: string | null // 头像版本号 (更新时间), 未上传为 null
}

export interface Session {
  csrf: string
  user: User | null
  pending_count: number
  roles: Record<Role, string>
  status: Record<string, [string, string]>
  visit_types: string[]
  stages: string[]
  today: string
}

export interface Result {
  ok: true
  message: string
  id?: number
}

export interface Option {
  id: number
  name: string
}

export interface CustomerOption extends Option {
  level: Level
  region: string
}

export interface Options {
  users: Option[]
  customers: CustomerOption[]
  owners: Option[]
}

export interface Visit {
  id: number
  user_id: number
  trip_id: number | null
  customer_id: number
  visit_date: string
  start_time: string
  end_time: string
  visit_type: string
  contact_name: string
  contact_title: string
  contact_phone: string
  attendees: string
  content: string
  result: string
  stage: string
  amount: number
  next_step: string
  next_date: string
  created_at: string
  customer: string
  level: Level
  sales: string
  trip_dest: string | null
}

export interface Contact {
  name: string
  title: string
  phone: string
}

export interface Trip {
  id: number
  user_id: number
  start_date: string
  end_date: string
  destination: string
  purpose: string
  transport: string
  cost_transport: number
  cost_hotel: number
  cost_meal: number
  cost_other: number
  summary: string
  status: string
  created_at: string
  updated_at: string
  sales?: string
  nvisits?: number
  days?: number
}

export interface Weekly {
  id: number
  user_id: number
  week_start: string
  summary: string
  problems: string
  next_plan: string
  status: string
  created_at: string
  updated_at: string
  sales?: string
}

export interface MonthlyBrief {
  id: number
  sales: string
  status: string
  visit_count: number
  customer_count: number
  new_customers: number
  trip_days: number
  cost_total: number
  cost_per_visit: number
  owned_a: number
  a_covered: number
}

export interface MonthlyReport {
  id: number
  user_id: number
  month: string
  analysis: string
  self_summary: string
  status: string
  generated_at: string
  sales: string
  region: string
}

export interface MonthlyStats {
  month: string
  visit_count: number
  customer_count: number
  new_customers: string[]
  contact_count: number
  trip_count: number
  trip_days: number
  trips: { id: number; start: string; end: string; destination: string; days: number; cost: number; status: string }[]
  cost: { transport: number; hotel: number; meal: number; other: number }
  cost_total: number
  cost_per_visit: number
  trip_visit_count: number
  by_type: [string, number][]
  by_level: Record<Level, number>
  by_stage: [string, number][]
  top_customers: [string, number][]
  pipeline: number
  owned_a: number
  a_missed: string[]
  stale: { name: string; level: Level; last: string | null }[]
  prev_visits: number
  prev_cost: number
  weeks: number
  weekly_done: number
  visits: { date: string; customer: string; type: string; contact: string; content: string; result: string }[]
}

export interface Approval {
  id: number
  decision: 'approved' | 'rejected' | 'comment'
  comment: string
  created_at: string
  approver: string
}

export interface ApprovalInfo {
  approvals: Approval[]
  can_approve: boolean
  can_comment: boolean
  mine: boolean
}

export interface Customer {
  id: number
  name: string
  level: Level
  industry: string
  region: string
  address: string
  owner_id: number | null
  status: string
  remark: string
  created_at: string
  owner_name: string | null
  nvisits?: number
  last_visit?: string | null
}

export interface Account {
  id: number
  username: string
  name: string
  role: Role
  manager_id: number | null
  region: string
  phone: string
  active: number
  must_change_pw: number
  created_at: string
  manager_name?: string | null
}

export interface LogRow {
  id: number
  created_at: string
  name: string | null
  action: string
  detail: string
  ip: string
}
