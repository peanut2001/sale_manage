import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons'
import type { ReactNode } from 'react'

/**
 * 指标卡: 名称 · 数值 · 较上月同期变化 (箭头 + 文字, 颜色 = 方向 × 是否向好) · 可选迷你走势
 * upIsGood 为 null 时不做好坏判断 (如差旅费用)
 */
export default function StatTile({ label, value, icon, cur, prev, upIsGood = true, spark, foot }: {
  label: string
  value: ReactNode
  icon: ReactNode
  cur?: number
  prev?: number
  upIsGood?: boolean | null
  spark?: number[]
  foot?: ReactNode
}) {
  return (
    <div className="stat-tile">
      <div className="stat-head">
        <span className="stat-icon">{icon}</span>
        <span className="stat-label">{label}</span>
      </div>
      <div className="stat-body">
        <div className="stat-value">{value}</div>
        {spark && <Sparkline data={spark} label={`${label}近 ${spark.length} 天走势`} />}
      </div>
      <div className="stat-foot">{foot ?? (cur !== undefined && prev !== undefined && <Delta cur={cur} prev={prev} upIsGood={upIsGood} />)}</div>
    </div>
  )
}

function Delta({ cur, prev, upIsGood }: { cur: number; prev: number; upIsGood: boolean | null }) {
  if (prev === 0) {
    return <span className="delta flat">{cur === 0 ? '与上月同期持平' : '上月同期为 0'}</span>
  }
  const pct = Math.round(((cur - prev) / prev) * 100)
  if (pct === 0) return <span className="delta flat">与上月同期持平</span>
  const up = pct > 0
  const tone = upIsGood === null ? 'flat' : up === upIsGood ? 'good' : 'bad'
  return (
    <span className={`delta ${tone}`}>
      {up ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(pct)}%
      <span className="delta-ref">较上月同期</span>
    </span>
  )
}

/** 迷你走势: 灰色折线, 最后一天用主色点标出 */
function Sparkline({ data, label }: { data: number[]; label: string }) {
  const w = 96
  const h = 32
  const max = Math.max(...data, 1)
  const pts = data.map((v, i) => [(i / Math.max(data.length - 1, 1)) * (w - 6) + 3, h - 4 - (v / max) * (h - 8)])
  const [lx, ly] = pts[pts.length - 1]
  return (
    <svg className="sparkline" width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label}>
      <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke="#c3c9d4" strokeWidth="1.5"
        strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lx} cy={ly} r="3.5" fill="#2f6bff" stroke="#fff" strokeWidth="2" />
    </svg>
  )
}
