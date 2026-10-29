import { DownloadOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Col, DatePicker, Form, Input, Row, Select, Table, Tooltip } from 'antd'
import dayjs from 'dayjs'
import { Link } from 'react-router'
import { qs } from '../api'
import Bars from '../components/Bars'
import FilterCard, { FCol } from '../components/FilterCard'
import { LevelTag } from '../components/Tags'
import { useApi, useFilters, useOptions } from '../hooks'
import { useAuth, useMe } from '../session'
import type { Level, Visit } from '../types'
import { money, pagination, strOptions, toOptions } from '../utils'

interface SalesRow {
  id: number
  name: string
  n: number
  nc: number
  ndays: number
  nfirst: number
  amount: number
  trip_n: number
  trip_days: number
  trip_cost: number
}
interface CustomerRow {
  id: number
  name: string
  level: Level
  n: number
  last: string
  sales: string
  contacts: string
}
interface StatsData {
  filters: Record<string, string>
  by_sales: SalesRow[]
  by_customer: CustomerRow[]
  by_type: { visit_type: string; n: number }[]
  detail: Visit[]
}

export default function Stats() {
  const { session } = useAuth()
  const { isManager } = useMe()
  const opts = useOptions()
  const filters = useFilters({ dates: ['start', 'end'] })
  const state = useApi<StatsData>(`/api/stats?${filters.query}`)
  const d = state.data
  const today = dayjs(session.today)
  const total = d?.by_type.reduce((s, r) => s + r.n, 0) ?? 0

  return (
    <>
      <FilterCard filters={filters} initial={{ start: today.startOf('month'), end: today, ...filters.initial }}
        toolbar={d && (
          <Tooltip title="按当前筛选条件导出明细和汇总">
            <Button type="primary" icon={<DownloadOutlined />} href={`/api/stats/export${qs(d.filters)}`}>导出 Excel</Button>
          </Tooltip>
        )}>
        <FCol><Form.Item label="开始日期" name="start"><DatePicker /></Form.Item></FCol>
        <FCol><Form.Item label="结束日期" name="end"><DatePicker /></Form.Item></FCol>
        {isManager && (
          <FCol><Form.Item label="销售员" name="user_id">
            <Select allowClear placeholder="全部" options={toOptions(opts.users)} />
          </Form.Item></FCol>
        )}
        <FCol><Form.Item label="客户" name="customer_id">
          <Select allowClear placeholder="全部" showSearch={{ optionFilterProp: 'label' }} options={toOptions(opts.customers)} />
        </Form.Item></FCol>
        <FCol><Form.Item label="拜访类型" name="visit_type">
          <Select allowClear placeholder="全部" options={strOptions(session.visit_types)} />
        </Form.Item></FCol>
        <FCol><Form.Item label="关键字" name="kw"><Input allowClear /></Form.Item></FCol>
      </FilterCard>
      {state.error && <Alert type="error" showIcon title={state.error.message} className="mb16" />}

      <div className="stack">
        <Card title="按销售员">
          <Table<SalesRow> rowKey="id" loading={state.loading} dataSource={d?.by_sales} pagination={false}
            scroll={{ x: 'max-content' }} locale={{ emptyText: '所选范围内无数据' }}
            columns={[
              { title: '销售员', dataIndex: 'name' },
              { title: '拜访次数', dataIndex: 'n', align: 'right' },
              { title: '客户数', dataIndex: 'nc', align: 'right' },
              { title: '拜访天数', dataIndex: 'ndays', align: 'right' },
              { title: '首次拜访', dataIndex: 'nfirst', align: 'right' },
              { title: '出差次数', dataIndex: 'trip_n', align: 'right' },
              { title: '出差天数', dataIndex: 'trip_days', align: 'right' },
              { title: '差旅费（元）', dataIndex: 'trip_cost', align: 'right', render: money },
              { title: '商机（万元）', dataIndex: 'amount', align: 'right' },
            ]} />
        </Card>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={10}>
            <Card title="按拜访类型" className="full-height" loading={!d}>
              <Bars rows={(d?.by_type ?? []).map((r) => [r.visit_type, r.n])} total={total} />
            </Card>
          </Col>
          <Col xs={24} lg={14}>
            <Card title="按客户（前 100）" className="full-height">
              <Table<CustomerRow> rowKey="id" loading={state.loading} dataSource={d?.by_customer} pagination={false}
                size="small" scroll={{ x: 'max-content', y: 360 }} locale={{ emptyText: '无' }}
                columns={[
                  { title: '客户', dataIndex: 'name', render: (v, r) => <><LevelTag level={r.level} /><Link to={`/customers/${r.id}`}>{v}</Link></> },
                  { title: '次数', dataIndex: 'n', align: 'right', width: 60 },
                  { title: '最近', dataIndex: 'last', width: 110 },
                  { title: '拜访销售', dataIndex: 'sales' },
                  { title: '洽谈人员', dataIndex: 'contacts' },
                ]} />
            </Card>
          </Col>
        </Row>

        <Card title="拜访明细" extra={<span className="hint">最近 200 条，完整数据请导出 Excel</span>}>
          <Table<Visit> rowKey="id" loading={state.loading} dataSource={d?.detail} pagination={pagination}
            scroll={{ x: 'max-content' }} locale={{ emptyText: '无' }}
            columns={[
              { title: '日期', dataIndex: 'visit_date', width: 110 },
              { title: '时间', key: 'time', render: (_, v) => <span className="hint">{v.start_time}{v.end_time && `-${v.end_time}`}</span> },
              { title: '销售员', dataIndex: 'sales' },
              { title: '客户', dataIndex: 'customer', render: (c, v) => <Link to={`/visits/${v.id}`}>{c}</Link> },
              { title: '类型', dataIndex: 'visit_type' },
              {
                title: '洽谈人员', dataIndex: 'contact_name',
                render: (n, v) => <>{n} {v.contact_title}{v.attendees && <div className="hint">{v.attendees}</div>}</>,
              },
              { title: '洽谈内容', dataIndex: 'content', ellipsis: true, width: 260 },
              { title: '成果', dataIndex: 'result', ellipsis: true, width: 200 },
            ]} />
        </Card>
      </div>
    </>
  )
}
