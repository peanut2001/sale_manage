import { PlusOutlined } from '@ant-design/icons'
import { Alert, Button, Card, DatePicker, Form, Input, Select, Table } from 'antd'
import { Link, useNavigate } from 'react-router'
import FilterCard, { FCol } from '../../components/FilterCard'
import PageHeader from '../../components/PageHeader'
import { LevelTag } from '../../components/Tags'
import { useApi, useFilters, useOptions } from '../../hooks'
import { useAuth, useMe } from '../../session'
import type { Visit } from '../../types'
import { pagination, strOptions, toOptions } from '../../utils'

export default function VisitList() {
  const { session } = useAuth()
  const { isManager } = useMe()
  const navigate = useNavigate()
  const opts = useOptions()
  const filters = useFilters({ dates: ['start', 'end'] })
  const state = useApi<{ rows: Visit[] }>(`/api/visits?${filters.query}`)

  return (
    <>
      <PageHeader title="客户拜访记录"
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/visits/new')}>填写拜访记录</Button>} />
      <FilterCard filters={filters}>
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
        <FCol><Form.Item label="类型" name="visit_type">
          <Select allowClear placeholder="全部" options={strOptions(session.visit_types)} />
        </Form.Item></FCol>
        <FCol><Form.Item label="关键字" name="kw"><Input allowClear placeholder="内容/人员/客户" /></Form.Item></FCol>
      </FilterCard>
      {state.error && <Alert type="error" showIcon title={state.error.message} className="mb16" />}
      <Card>
        <Table<Visit> rowKey="id" loading={state.loading} dataSource={state.data?.rows} pagination={pagination}
          scroll={{ x: 'max-content' }} locale={{ emptyText: '没有符合条件的记录' }}
          columns={[
            { title: '日期', dataIndex: 'visit_date', width: 110 },
            {
              title: '客户', dataIndex: 'customer',
              render: (v, r) => <><LevelTag level={r.level} /><Link to={`/visits/${r.id}`}>{v}</Link></>,
            },
            { title: '销售员', dataIndex: 'sales' },
            { title: '类型', dataIndex: 'visit_type' },
            { title: '洽谈人员', dataIndex: 'contact_name', render: (v, r) => <>{v} <span className="hint">{r.contact_title}</span></> },
            { title: '洽谈内容', dataIndex: 'content', ellipsis: true, width: 320, responsive: ['md'] },
            {
              title: '出差', dataIndex: 'trip_dest', responsive: ['md'],
              render: (v, r) => r.trip_id && <Link to={`/trips/${r.trip_id}`}>{v}</Link>,
            },
          ]} />
      </Card>
    </>
  )
}
