import {
  AuditOutlined, CarOutlined, ContactsOutlined, InfoCircleOutlined, SolutionOutlined, WalletOutlined,
} from '@ant-design/icons'
import { Alert, Card, Col, Row, Select, Skeleton, Table, Tag, Tooltip } from 'antd'
import { lazy, Suspense, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import Async from '../components/Async'
import Clip from '../components/Clip'
import { useApi } from '../hooks'
import { useAuth, useMe } from '../session'
import type { Visit } from '../types'
import { money, targetUrl } from '../utils'
import StatTile from './dashboard/StatTile'
import type { DashboardData, Track } from './dashboard/types'

// 图表依赖 ECharts, 单独加载: 指标卡和表格先出来, 图表随后补上
const VisitTrend = lazy(() => import('./dashboard/VisitTrend'))
const Performance = lazy(() => import('./dashboard/Performance'))
const CustomerMap = lazy(() => import('./dashboard/CustomerMap'))
const TrackMap = lazy(() => import('./dashboard/TrackMap'))

const chartFallback = (h: number) => <Skeleton.Node active style={{ width: '100%', height: h }} />

function Lazy({ h, children }: { h: number; children: ReactNode }) {
  return <Suspense fallback={chartFallback(h)}>{children}</Suspense>
}

export default function Dashboard() {
  const state = useApi<DashboardData>('/api/dashboard')
  return <Async state={state}>{(d) => <DashboardBody d={d} />}</Async>
}

function DashboardBody({ d }: { d: DashboardData }) {
  const { session } = useAuth()
  const { isManager } = useMe()
  const [trackUid, setTrackUid] = useState<number>()
  const track: Track | undefined = d.tracks.find((t) => t.user_id === trackUid) ?? d.tracks[0]
  const trendTotal = d.trend.reduce((s, x) => s + x.visits, 0)

  return (
    <>
      {d.rejected.map((r) => (
        <Alert key={`${r.type}${r.id}`} type="warning" showIcon className="mb16"
          title={<>你的{r.label}（{r.d} {r.title}）已被退回，<Link to={targetUrl[r.type] + r.id}>查看审批意见并修改</Link></>} />
      ))}

      <div className="stat-grid">
        <StatTile label="本月拜访次数" icon={<SolutionOutlined />} value={d.visits.c}
          cur={d.visits.c} prev={d.prev.visits.c} spark={d.trend.slice(-14).map((x) => x.visits)} />
        <StatTile label="覆盖客户数" icon={<ContactsOutlined />} value={d.visits.cc}
          cur={d.visits.cc} prev={d.prev.visits.cc} />
        <StatTile label="本月出差次数" icon={<CarOutlined />} value={d.trips.c}
          cur={d.trips.c} prev={d.prev.trips.c} />
        <StatTile label="本月差旅费用（元）" icon={<WalletOutlined />} value={money(d.trips.cost)}
          cur={d.trips.cost} prev={d.prev.trips.cost} upIsGood={null} />
        {isManager && (
          <StatTile label="待我审批" icon={<AuditOutlined />} value={session.pending_count}
            foot={session.pending_count > 0 ? <Link to="/approvals">去审批 →</Link> : <span className="delta flat">暂无待审批</span>} />
        )}
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={15}>
          <Card title="拜访趋势" extra={<span className="hint">近 30 天 · 共 {trendTotal} 次</span>} className="full-height">
            <Lazy h={280}><VisitTrend data={d.trend} /></Lazy>
          </Card>
        </Col>
        <Col xs={24} xl={9}>
          <Card className="full-height"
            title={<>{d.performance.mode === 'team' ? '本月业绩排行' : '近 6 个月业绩'}
              <Tooltip title="系统未记录成交金额，业绩按拜访次数和拜访时登记的「预计商机金额」统计">
                <InfoCircleOutlined className="title-tip" />
              </Tooltip></>}>
            <Lazy h={220}><Performance mode={d.performance.mode} rows={d.performance.rows} /></Lazy>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="客户分布" extra={<span className="hint">按客户「地区」定位到城市</span>} className="full-height">
            <Lazy h={320}><CustomerMap data={d.customer_map} /></Lazy>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="外勤轨迹" className="full-height"
            extra={d.tracks.length > 1 && (
              <Select size="small" value={track?.user_id} onChange={setTrackUid} style={{ minWidth: 140 }}
                options={d.tracks.map((t) => ({ value: t.user_id, label: `${t.name}（${t.visits} 次）` }))} />
            )}>
            <Lazy h={320}><TrackMap track={track} /></Lazy>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="近期拜访" extra={<Link to="/visits">全部</Link>} className="full-height">
            <Table<Visit> rowKey="id" size="small" pagination={false} dataSource={d.recent}
              locale={{ emptyText: '暂无拜访记录' }}
              columns={[
                { title: '日期', dataIndex: 'visit_date', width: 110 },
                { title: '客户', dataIndex: 'customer', render: (v, r) => <Link to={`/visits/${r.id}`}>{v}</Link> },
                ...(isManager ? [{ title: '销售员', dataIndex: 'sales' }] : []),
                { title: '类型', dataIndex: 'visit_type' },
              ]} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="近 7 天待跟进" className="full-height">
            <Table<Visit> rowKey="id" size="small" pagination={false} dataSource={d.followups}
              locale={{ emptyText: '暂无待跟进事项' }}
              columns={[
                {
                  title: '跟进日期', dataIndex: 'next_date', width: 150,
                  render: (v: string) => <>{v} {v < session.today && <Tag color="red" variant="filled">逾期</Tag>}</>,
                },
                { title: '客户', dataIndex: 'customer', render: (v, r) => <Link to={`/customers/${r.customer_id}`}>{v}</Link> },
                ...(isManager ? [{ title: '销售员', dataIndex: 'sales' }] : []),
                { title: '下一步', dataIndex: 'next_step', render: (v) => <Clip text={v} width={240} /> },
              ]} />
          </Card>
        </Col>
      </Row>
    </>
  )
}
