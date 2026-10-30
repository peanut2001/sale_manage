// ECharts 按需引入: 只打包首页用到的图表和组件
import { BarChart, LineChart, LinesChart, ScatterChart } from 'echarts/charts'
import { GeoComponent, GridComponent, TooltipComponent } from 'echarts/components'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([LineChart, BarChart, ScatterChart, LinesChart, GridComponent, TooltipComponent,
  GeoComponent, CanvasRenderer])

export default echarts

/** 图表配色 (品牌蓝已用数据可视化校验脚本验证: 白底对比度 >= 3:1) */
export const C = {
  primary: '#2f6bff',
  wash: 'rgba(47, 107, 255, 0.10)', // 面积填充: 主色 10% 透明度
  grid: '#eef1f6', // 网格线: 实线细线, 不抢数据
  axis: '#d9dee8',
  muted: '#8a8f99', // 坐标轴文字
  text: '#1f2937',
  secondary: '#4b5563',
  land: '#f3f6fb', // 地图底色
  border: '#d5dbe6',
}

/** 写进提示框 HTML 的文字 (人名、客户名等用户填写的内容) 必须转义 */
export const esc = (s: string | number) =>
  String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!)

/** 统一的提示框样式: 数值在前加粗, 名称在后 */
export const tooltipBase = {
  backgroundColor: '#ffffff',
  borderColor: '#e5e9f0',
  borderWidth: 1,
  padding: [8, 12],
  textStyle: { color: C.text, fontSize: 12 },
  extraCssText: 'box-shadow: 0 6px 20px rgba(31, 64, 128, 0.12); border-radius: 8px;',
}

let chinaReady: Promise<void> | null = null

/** 首次用到地图时再加载中国省界数据 (DataV.GeoAtlas, 已简化) */
export function loadChinaMap() {
  chinaReady ??= import('../assets/china.json').then((m) => {
    echarts.registerMap('china', m.default as Parameters<typeof echarts.registerMap>[1])
  })
  return chinaReady
}

/** 让地图视野框住所有点位 (点都在华东时不必显示整个中国) */
export function fitView(points: { lng: number; lat: number }[]) {
  if (!points.length) return {} // 没有点位时显示全国
  const lngs = points.map((p) => p.lng)
  const lats = points.map((p) => p.lat)
  const [x0, x1, y0, y1] = [Math.min(...lngs), Math.max(...lngs), Math.min(...lats), Math.max(...lats)]
  // 底图 (含南海诸岛) 约 62° x 50°; 按点位范围放大并留边距, 最多放大到约 6° 见方 (一两个省)
  const zoom = Math.max(1, Math.min(10, 62 / Math.max((x1 - x0) * 1.6, 4.5), 50 / Math.max((y1 - y0) * 1.6, 3.5)))
  return { center: [(x0 + x1) / 2, (y0 + y1) / 2] as [number, number], zoom }
}
