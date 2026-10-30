import { useEffect, useState } from 'react'
import { C, fitView, loadChinaMap } from '../../charts/echarts'

/** 地图底图 (省界), 客户分布和外勤轨迹共用; 视野自动框住点位 */
export function geoBase(points: { lng: number; lat: number }[]) {
  return {
    map: 'china',
    roam: false,
    silent: true,
    ...fitView(points),
    itemStyle: { areaColor: C.land, borderColor: C.border, borderWidth: 0.8 },
    label: { show: false },
  }
}

/** 等省界数据加载完成 */
export function useChinaMap() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let alive = true
    loadChinaMap().then(() => alive && setReady(true), () => {})
    return () => {
      alive = false
    }
  }, [])
  return ready
}
