import { ReloadOutlined } from '@ant-design/icons'
import { Alert, Button, Card, DatePicker, Table, Tooltip } from 'antd'
import dayjs from 'dayjs'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { post } from '../../api'
import FilterCard from '../../components/FilterCard'
import { StatusTag } from '../../components/Tags'
import { useAction, useApi } from '../../hooks'
import { useAuth, useMe } from '../../session'
import type { MonthlyBrief, Result } from '../../types'
import { money } from '../../utils'

interface MonthlyData {
  month: string
  current: string
  rows: MonthlyBrief[]
  history: { id: number; month: string; status: string }[]
}

export default function MonthlyList() {
  const { session } = useAuth()
  const { isManager } = useMe()
  const navigate = useNavigate()
  const [sp, setSp] = useSearchParams()
  const state = useApi<MonthlyData>(`/api/monthly?month=${sp.get('month') ?? ''}`)
  const [run, loading] = useAction()
  const d = state.data
  const rows = d?.rows ?? []

  const generate = async () => {
    if (d && (await run(() => post<Result>('/api/monthly/generate', { month: d.month })))) state.reload()
  }

  return (
    <>
      {state.error && <Alert type="error" showIcon title={state.error.message} className="mb16" />}
      <FilterCard total={d && rows.length} unit="份"
        toolbar={d && (
          <>
            <DatePicker picker="month" allowClear={false} value={dayjs(d.month)}
              disabledDate={(m) => m.format('YYYY-MM') > d.current}
              onChange={(m) => m && setSp({ month: m.format('YYYY-MM') })} />
            <Tooltip title="月中可生成当月预览；已提交或已审批的报告不会被覆盖">
              <Button type="primary" icon={<ReloadOutlined />} loading={loading} onClick={generate}>
                {isManager ? '为团队' : ''}生成 / 刷新报告
              </Button>
            </Tooltip>
          </>
        )} />
      <Card className="mb16">
        <Table<MonthlyBrief> rowKey="id" loading={state.loading} dataSource={rows} pagination={false}
          scroll={{ x: 'max-content' }} locale={{ emptyText: '该月报告尚未生成' }}
          columns={[
            { title: '销售员', dataIndex: 'sales', render: (v, r) => <Link to={`/monthly/${r.id}`}>{v}</Link> },
            { title: '拜访', dataIndex: 'visit_count', align: 'right' },
            { title: '客户', dataIndex: 'customer_count', align: 'right' },
            { title: '新客户', dataIndex: 'new_customers', align: 'right' },
            { title: '出差天数', dataIndex: 'trip_days', align: 'right' },
            { title: '差旅费（元）', dataIndex: 'cost_total', align: 'right', render: money },
            { title: '单次拜访成本', dataIndex: 'cost_per_visit', align: 'right', render: money },
            { title: 'A 类覆盖', key: 'a', align: 'right', render: (_, r) => (r.owned_a ? `${r.a_covered}/${r.owned_a}` : '-') },
            { title: '状态', dataIndex: 'status', render: (s) => <StatusTag status={s} /> },
          ]}
          summary={(data) => data.length > 1 && (
            <Table.Summary.Row className="summary-row">
              <Table.Summary.Cell index={0}>合计</Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="right">{data.reduce((s, r) => s + r.visit_count, 0)}</Table.Summary.Cell>
              <Table.Summary.Cell index={2} />
              <Table.Summary.Cell index={3} align="right">{data.reduce((s, r) => s + r.new_customers, 0)}</Table.Summary.Cell>
              <Table.Summary.Cell index={4} align="right">{data.reduce((s, r) => s + r.trip_days, 0)}</Table.Summary.Cell>
              <Table.Summary.Cell index={5} align="right">{money(data.reduce((s, r) => s + r.cost_total, 0))}</Table.Summary.Cell>
              <Table.Summary.Cell index={6} colSpan={3} />
            </Table.Summary.Row>
          )} />
      </Card>
      {d && d.history.length > 0 && (
        <Card title="我的历史月报">
          <div className="form-actions">
            {d.history.map((h) => (
              <Button key={h.id} size="small" onClick={() => navigate(`/monthly/${h.id}`)}>
                {h.month} · {session.status[h.status]?.[0]}
              </Button>
            ))}
          </div>
        </Card>
      )}
    </>
  )
}
