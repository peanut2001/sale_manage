import type { ReactNode } from 'react'

export default function PageHeader({ title, extra, sub }: { title: ReactNode; extra?: ReactNode; sub?: ReactNode }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {sub && <div className="page-sub">{sub}</div>}
      </div>
      {extra && <div className="page-actions no-print">{extra}</div>}
    </div>
  )
}
