import { Empty, Progress } from 'antd'

/** 横向占比条: [名称, 数量][] */
export default function Bars({ rows, total }: { rows: [string, number][]; total: number }) {
  if (!rows.length) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无" />
  return (
    <>
      {rows.map(([label, n]) => (
        <div className="bar-row" key={label}>
          <span>{label}</span>
          <Progress percent={total ? Math.round((n / total) * 100) : 0} showInfo={false} />
          <b>{n}</b>
        </div>
      ))}
    </>
  )
}
