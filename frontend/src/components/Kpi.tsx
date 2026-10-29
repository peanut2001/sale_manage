import type { ReactNode } from 'react'

export default function Kpi({ label, value, sub, icon }: { label: string; value: ReactNode; sub?: ReactNode; icon?: ReactNode }) {
  return (
    <div className={icon ? 'kpi with-icon' : 'kpi'}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
      {icon && <span className="kpi-icon">{icon}</span>}
    </div>
  )
}
