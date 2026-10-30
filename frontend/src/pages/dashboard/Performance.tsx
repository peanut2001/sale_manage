import { useMemo } from 'react'
import { C, esc, tooltipBase } from '../../charts/echarts'
import EChart from '../../components/EChart'
import ChartBox from './ChartBox'
import type { PerfRow } from './types'

/**
 * 业绩: 「拜访次数」和「预计商机金额」量纲不同, 不画在一张双轴图上,
 * 分成左右两张小图 (同一顺序), 各自一个系列。
 * team: 本月销售员排行 (横向条形); months: 近 6 个月 (柱形)
 */
export default function Performance({ mode, rows }: { mode: 'team' | 'months'; rows: PerfRow[] }) {
  const empty = rows.every((r) => r.visits === 0)
  const labels = rows.map((r) => (mode === 'months' ? `${Number(r.label.slice(5))}月` : r.label))
  const height = mode === 'team' ? Math.max(200, rows.length * 34 + 30) : 220
  const visits = rows.reduce((s, r) => s + r.visits, 0)
  const amount = Math.round(rows.reduce((s, r) => s + r.amount, 0) * 100) / 100
  return (
    <>
      <ChartBox empty={empty && (mode === 'team' ? '本月暂无拜访记录' : '近 6 个月暂无拜访记录')}>
        <div className="perf-panels">
          <Panel title="拜访次数" unit="次" mode={mode} labels={labels} values={rows.map((r) => r.visits)} height={height} />
          <Panel title="预计商机金额（万元）" unit="万元" mode={mode} labels={labels}
            values={rows.map((r) => Math.round(r.amount * 100) / 100)} height={height} hideCategory={mode === 'team'} />
        </div>
      </ChartBox>
      <div className="chart-foot">
        {mode === 'team' ? `本月 ${rows.length} 人` : '近 6 个月'}合计：拜访 <b>{visits}</b> 次 · 预计商机 <b>{amount}</b> 万元
      </div>
    </>
  )
}

function Panel({ title, unit, mode, labels, values, height, hideCategory }: {
  title: string
  unit: string
  mode: 'team' | 'months'
  labels: string[]
  values: number[]
  height: number
  hideCategory?: boolean
}) {
  const option = useMemo(() => {
    const horizontal = mode === 'team'
    const category = {
      type: 'category',
      data: labels,
      inverse: horizontal, // 排行第一在最上
      axisLine: { lineStyle: { color: C.axis } },
      axisTick: { show: false },
      axisLabel: { color: C.secondary, show: !hideCategory, width: 56, overflow: 'truncate' },
    }
    const value = { type: 'value', show: false, max: (v: { max: number }) => Math.max(v.max * 1.25, 1) }
    return {
      grid: { left: 0, right: horizontal ? 8 : 0, top: horizontal ? 0 : 18, bottom: 0, containLabel: true },
      tooltip: {
        ...tooltipBase,
        trigger: 'item',
        formatter: (p: { name: string; value: number }) =>
          `<b style="font-size:15px">${p.value}</b> ${unit}<div style="color:${C.secondary}">${esc(p.name)} · ${esc(title)}</div>`,
      },
      xAxis: horizontal ? value : category,
      yAxis: horizontal ? category : value,
      series: [{
        type: 'bar',
        data: values,
        barMaxWidth: 18,
        itemStyle: { color: C.primary, borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0] },
        emphasis: { itemStyle: { color: '#5a8bff' } },
        label: { show: true, position: horizontal ? 'right' : 'top', color: C.secondary, fontSize: 11,
          formatter: (p: { value: number }) => (p.value ? String(p.value) : '') },
      }],
    }
  }, [labels, values, mode, title, unit, hideCategory])
  return (
    <div className="perf-panel">
      <div className="perf-title">{title}</div>
      <EChart option={option} height={height} />
    </div>
  )
}
