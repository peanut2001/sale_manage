import { useMemo } from 'react'
import { C, esc, tooltipBase } from '../../charts/echarts'
import EChart from '../../components/EChart'
import ChartBox from './ChartBox'
import type { DayStat } from './types'

/** 近 30 天每日拜访: 单系列折线 + 浅色面积, 悬停十字线显示当天数值 */
export default function VisitTrend({ data }: { data: DayStat[] }) {
  const empty = data.every((d) => d.visits === 0)
  const option = useMemo(() => ({
    grid: { left: 4, right: 16, top: 16, bottom: 4, containLabel: true },
    tooltip: {
      ...tooltipBase,
      trigger: 'axis',
      axisPointer: { type: 'line', lineStyle: { color: C.axis } },
      formatter: (ps: { dataIndex: number }[]) => {
        const d = data[ps[0].dataIndex]
        return `<div style="color:${C.muted}">${esc(d.date)}</div>`
          + `<div><b style="font-size:15px">${d.visits}</b> 次拜访</div>`
          + (d.first ? `<div style="color:${C.secondary}">其中首次拜访 ${d.first} 次</div>` : '')
      },
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.map((d) => d.date.slice(5)),
      axisLine: { lineStyle: { color: C.axis } },
      axisTick: { show: false },
      axisLabel: { color: C.muted, interval: 4, margin: 12 },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      max: empty ? 5 : undefined,
      splitLine: { lineStyle: { color: C.grid } },
      axisLabel: { color: C.muted },
    },
    series: [{
      type: 'line',
      data: data.map((d) => d.visits),
      symbol: 'circle',
      symbolSize: 8,
      showSymbol: false,
      lineStyle: { width: 2, color: C.primary, cap: 'round', join: 'round' },
      itemStyle: { color: C.primary, borderColor: '#fff', borderWidth: 2 },
      areaStyle: { color: C.wash },
    }],
  }), [data, empty])

  return (
    <ChartBox empty={empty && '近 30 天暂无拜访记录'}>
      <EChart option={option} height={280} />
    </ChartBox>
  )
}
