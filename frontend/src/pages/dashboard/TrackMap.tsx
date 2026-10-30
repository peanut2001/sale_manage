import { Spin } from 'antd'
import { useMemo } from 'react'
import { C, esc, tooltipBase } from '../../charts/echarts'
import EChart from '../../components/EChart'
import ChartBox from './ChartBox'
import { geoBase, useChinaMap } from './geo'
import { shortCity, type Track } from './types'

const range = (s: { start: string; end: string }) => (s.start === s.end ? s.start.slice(5) : `${s.start.slice(5)} ~ ${s.end.slice(5)}`)

/**
 * 外勤轨迹: 近 30 天按拜访先后连接去过的城市 (精度到城市, 来自客户「地区」)。
 * 只画静态箭头, 不做持续动画 (避免一直占用 CPU)。
 */
export default function TrackMap({ track: t }: { track?: Track }) {
  const ready = useChinaMap()
  const stops = useMemo(() => t?.stops ?? [], [t])
  const cities = new Set(stops.map((s) => s.name)).size

  const option = useMemo(() => ({
    geo: geoBase(stops),
    tooltip: {
      ...tooltipBase,
      trigger: 'item',
      formatter: (p: { seriesType: string; dataIndex: number }) => {
        if (p.seriesType !== 'scatter') return ''
        const s = stops[p.dataIndex]
        return `<b style="font-size:15px">${s.visits}</b> 次拜访<div style="color:${C.secondary}">第 ${p.dataIndex + 1} 站 · ${esc(s.name)}</div>`
          + `<div style="color:${C.muted}">${esc(range(s))}</div>`
      },
    },
    series: [
      {
        type: 'lines',
        coordinateSystem: 'geo',
        data: stops.slice(1).map((s, i) => ({ coords: [[stops[i].lng, stops[i].lat], [s.lng, s.lat]] })),
        symbol: ['none', 'arrow'],
        symbolSize: 8,
        silent: true,
        lineStyle: { color: C.primary, width: 2, opacity: 0.75, curveness: 0.2 },
      },
      {
        type: 'scatter',
        coordinateSystem: 'geo',
        // 点内显示站序 (城市名列在图下, 避免密集时文字重叠)
        data: stops.map((s, i) => ({ name: s.name, value: [s.lng, s.lat], z: i })),
        symbolSize: 18,
        itemStyle: { color: C.primary, borderColor: '#fff', borderWidth: 2 },
        emphasis: { scale: 1.15 },
        label: { show: true, position: 'inside', color: '#fff', fontSize: 10, fontWeight: 600,
          formatter: (p: { dataIndex: number }) => String(p.dataIndex + 1) },
      },
    ],
  }), [stops])

  return (
    <>
      <ChartBox empty={ready && !stops.length && '近 30 天暂无可定位的外勤记录'}>
        {ready ? <EChart option={option} height={320} /> : <div className="chart-loading"><Spin /></div>}
      </ChartBox>
      <div className="chart-foot">
        {t ? <>{t.name}：近 30 天拜访 {t.visits} 次，途经 {cities} 个城市</> : '近 30 天无拜访'}
        {t && t.unlocated > 0 && <>；{t.unlocated} 次拜访的客户「地区」无法识别</>}
        {stops.length > 0 && (
          <div className="route">
            {stops.length > 8 && <span className="route-arrow">… →</span>}
            {stops.map((s, i) => ({ s, i })).slice(-8).map(({ s, i }) => (
              <span key={i}>
                {i > Math.max(0, stops.length - 8) && <span className="route-arrow">→ </span>}
                <span className="route-no">{i + 1}</span>{shortCity(s.name)} <span className="hint">{range(s)}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
