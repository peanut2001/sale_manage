import { AuditOutlined, CarOutlined, ContactsOutlined, PlusOutlined, SolutionOutlined, WalletOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Col, Row, Table, Tag } from 'antd'
import { Link, useNavigate } from 'react-router'
import Async from '../components/Async'
import Kpi from '../components/Kpi'
import PageHeader from '../components/PageHeader'
import { useApi } from '../hooks'
import { useAuth, useMe } from '../session'
import type { Target, Visit } from '../types'
import { money, targetUrl } from '../utils'

interface DashboardData {
  month: string
  visits: { c: number; cc: number }
  trips: { c: number; cost: number }
  recent: Visit[]
  followups: Visit[]
  this_week: string
  weekly: { id: number; status: string } | null
  rejected: { type: Target; id: number; label: string; d: string; title: string }[]
}

export default function Dashboard() {
  const { session } = useAuth()
  const { me, isManager, roleName } = useMe()
  const navigate = useNavigate()
  const state = useApi<DashboardData>('/api/dashboard')

  return (
    <Async state={state}>
      {(d) => (
        <>
          <PageHeader title={`你好, ${me.name}`} sub={`今天是 ${session.today} · ${roleName}`}
            extra={
              <>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/visits/new')}>填写拜访记录</Button>
                <Button icon={<PlusOutlined />} onClick={() => navigate('/trips/new')}>新建出差报告</Button>
                {d.weekly ? (
                  <Button onClick={() => navigate(`/weekly/${d.weekly!.id}`)}>
                    本周周报 · {session.status[d.weekly.status]?.[0]}
                  </Button>
                ) : (
                  <Button icon={<PlusOutlined />} onClick={() => navigate(`/weekly/new?week=${d.this_week}`)}>写本周周报</Button>
                )}
              </>
            }
          />

          {d.rejected.map((r) => (
            <Alert key={`${r.type}${r.id}`} type="warning" showIcon className="mb16"
              title={<>你的{r.label} ({r.d} {r.title}) 被退回, <Link to={targetUrl[r.type] + r.id}>查看审批意见并修改</Link></>} />
          ))}

          <div className="kpis">
            <Kpi label={`${d.month} 拜访次数${isManager ? ' (团队)' : ''}`} value={d.visits.c} icon={<SolutionOutlined />} />
            <Kpi label="覆盖客户数" value={d.visits.cc} icon={<ContactsOutlined />} />
            <Kpi label="本月出差次数" value={d.trips.c} icon={<CarOutlined />} />
            <Kpi label="本月差旅费用 (元)" value={money(d.trips.cost)} icon={<WalletOutlined />} />
            {isManager && (
              <Kpi label="待我审批" value={<Link to="/approvals">{session.pending_count}</Link>} icon={<AuditOutlined />} />
            )}
          </div>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="近期拜访" extra={<Link to="/visits">全部</Link>}>
                <Table<Visit> rowKey="id" size="small" pagination={false} dataSource={d.recent} scroll={{ x: 'max-content' }}
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
              <Card title="近 7 天待跟进">
                <Table<Visit> rowKey="id" size="small" pagination={false} dataSource={d.followups} scroll={{ x: 'max-content' }}
                  locale={{ emptyText: '暂无待跟进事项' }}
                  columns={[
                    {
                      title: '跟进日期', dataIndex: 'next_date', width: 150,
                      render: (v: string) => <>{v} {v < session.today && <Tag color="red" variant="filled">逾期</Tag>}</>,
                    },
                    { title: '客户', dataIndex: 'customer', render: (v, r) => <Link to={`/customers/${r.customer_id}`}>{v}</Link> },
                    ...(isManager ? [{ title: '销售员', dataIndex: 'sales' }] : []),
                    { title: '下一步', dataIndex: 'next_step', ellipsis: true },
                  ]} />
              </Card>
            </Col>
          </Row>
        </>
      )}
    </Async>
  )
}
