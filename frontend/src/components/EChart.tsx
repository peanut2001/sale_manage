import { useEffect, useRef } from 'react'
import echarts from '../charts/echarts'

type Option = Parameters<ReturnType<typeof echarts.init>['setOption']>[0]

/** ECharts 容器: 挂载时初始化, option 变化时整体更新, 跟随容器宽度自适应, 卸载时销毁 */
export default function EChart({ option, height }: { option: Option; height: number }) {
  const el = useRef<HTMLDivElement>(null)
  const chart = useRef<ReturnType<typeof echarts.init> | null>(null)

  useEffect(() => {
    const c = echarts.init(el.current!)
    chart.current = c
    const ro = new ResizeObserver(() => c.resize())
    ro.observe(el.current!)
    return () => {
      ro.disconnect()
      c.dispose()
      chart.current = null
    }
  }, [])

  useEffect(() => {
    chart.current?.setOption(option, true)
  }, [option])

  return <div ref={el} style={{ height, width: '100%' }} />
}
