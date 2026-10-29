import { PlusOutlined } from '@ant-design/icons'
import { Alert, Button, Card, DatePicker, Form, Select, Table } from 'antd'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import FilterCard, { FCol } from '../../components/FilterCard'
import TripFormModal from './TripFormModal'
import { StatusTag } from '../../components/Tags'
import { useApi, useFilters, useOptions } from '../../hooks'
import { useAuth, useMe } from '../../session'
import type { Trip } from '../../types'
import { money, pagination, toOptions, tripCost } from '../../utils'

export default function TripList() {
  const { session } = useAuth()
  const { isManager } = useMe()
  const navigate = useNavigate()
  const opts = useOptions()
  const filters = useFilters({ months: ['month'] })
  const [open, setOpen] = useState(false)
  const state = useApi<{ rows: Trip[] }>(`/api/trips?${filters.query}`)

  return (
    <>
      <FilterCard filters={filters} total={state.data?.rows.length}
        toolbar={<Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>新建出差报告</Button>}>
        <FCol><Form.Item label="月份" name="month"><DatePicker picker="month" /></Form.Item></FCol>
        {isManager && (
          <FCol><Form.Item label="销售员" name="user_id">
            <Select allowClear placeholder="全部" options={toOptions(opts.users)} />
          </Form.Item></FCol>
        )}
        <FCol><Form.Item label="状态" name="status">
          <Select allowClear placeholder="全部"
            options={['draft', 'submitted', 'approved', 'rejected'].map((k) => ({ value: k, label: session.status[k][0] }))} />
        </Form.Item></FCol>
      </FilterCard>
      {state.error && <Alert type="error" showIcon title={state.error.message} className="mb16" />}
      <Card>
        <Table<Trip> rowKey="id" loading={state.loading} dataSource={state.data?.rows} pagination={pagination}
          scroll={{ x: 'max-content' }} locale={{ emptyText: '暂无出差报告' }}
          columns={[
            { title: '出差日期', key: 'date', render: (_, t) => <Link to={`/trips/${t.id}`}>{t.start_date} ~ {t.end_date}</Link> },
            { title: '目的地', dataIndex: 'destination' },
            { title: '销售员', dataIndex: 'sales' },
            { title: '天数', dataIndex: 'days', align: 'right' },
            { title: '拜访', dataIndex: 'nvisits', align: 'right' },
            { title: '费用（元）', key: 'cost', align: 'right', render: (_, t) => money(tripCost(t)) },
            { title: '状态', dataIndex: 'status', render: (s) => <StatusTag status={s} /> },
          ]} />
      </Card>
      {/* 新建后进入详情页, 继续添加拜访记录 */}
      <TripFormModal open={open} onClose={() => setOpen(false)} onSaved={(id) => navigate(`/trips/${id}`)} />
    </>
  )
}
