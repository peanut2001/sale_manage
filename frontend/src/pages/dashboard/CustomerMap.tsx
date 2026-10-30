import { Spin } from 'antd'
import { useMemo } from 'react'
import { Link } from 'react-router'
import { C, esc, tooltipBase } from '../../charts/echarts'
import EChart from '../../components/EChart'
import ChartBox from './ChartBox'
import { geoBase, useChinaMap } from './geo'
import { shortCity, type CustomerMapData } from './types'

/** 客户分布: 按「地区」落到城市, 点的大小表示客户数; 城市名不直接标在图上 (华东城市密集会重叠), 在图下列出客户最多的城市 */
export default function CustomerMap({ data }: { data: CustomerMapData }) {
  const ready = useChinaMap()
  const option = useMemo(() => {
    const max = Math.max(...data.spots.map((s) => s.count), 1)
    return {
      geo: geoBase(data.spots),
      tooltip: {
        ...tooltipBase,
        trigger: 'item',
        formatter: (p: { name: string; value: number[] }) =>
          `<b style="font-size:15px">${p.value[2]}</b> 家客户<div style="color:${C.secondary}">${esc(p.name)}</div>`,
      },
      series: [{
        type: 'scatter',
        coordinateSystem: 'geo',
        data: data.spots.map((s) => ({ name: s.name, value: [s.lng, s.lat, s.count] })),
        symbolSize: (v: number[]) => 9 + Math.sqrt(v[2] / max) * 13,
        itemStyle: { color: C.primary, opacity: 0.85, borderColor: '#fff', borderWidth: 2 },
        emphasis: { scale: 1.2 },
      }],
    }
  }, [data])

  return (
    <>
      <ChartBox empty={ready && !data.spots.length && (data.total ? '客户的「地区」都还没有填写或无法识别' : '暂无客户')}>
        {ready ? <EChart option={option} height={320} /> : <div className="chart-loading"><Spin /></div>}
      </ChartBox>
      <div className="chart-foot">
        共 {data.total} 家客户，分布在 {data.spots.length} 个城市
        {data.unlocated > 0 && <>；{data.unlocated} 家「地区」未填写或无法识别，<Link to="/customers">去完善</Link></>}
        {data.spots.length > 0 && (
          <div className="chart-foot-list">
            {data.spots.slice(0, 6).map((s) => <span key={s.name}>{shortCity(s.name)} <b>{s.count}</b></span>)}
          </div>
        )}
      </div>
    </>
  )
}
