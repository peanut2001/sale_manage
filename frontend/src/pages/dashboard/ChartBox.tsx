import type { ReactNode } from 'react'

/** 图表外框: 没有数据时在图上盖一层说明, 保留坐标轴/地图底图, 不留大片空白 */
export default function ChartBox({ empty, children }: { empty?: ReactNode; children: ReactNode }) {
  return (
    <div className="chart-box">
      {children}
      {empty && <div className="chart-empty"><span>{empty}</span></div>}
    </div>
  )
}
