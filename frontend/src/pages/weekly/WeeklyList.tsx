import { PlusOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Form, Select, Table } from 'antd'
import { Link, useNavigate } from 'react-router'
import FilterCard, { FCol } from '../../components/FilterCard'
import PageHeader from '../../components/PageHeader'
import { StatusTag } from '../../components/Tags'
import { useApi, useFilters, useOptions } from '../../hooks'
import { useMe } from '../../session'
import type { Weekly } from '../../types'
import { pagination, toOptions, weekEnd } from '../../utils'

export default function WeeklyList() {
  const { isManager } = useMe()
  const navigate = useNavigate()
  const opts = useOptions()
  const filters = useFilters()
  const state = useApi<{ rows: Weekly[] }>(`/api/weekly?${filters.query}`)

  return (
    <>
      <PageHeader title="销售周报"
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/weekly/new')}>写本周周报</Button>} />
      {isManager && (
        <FilterCard filters={filters}>
          <FCol><Form.Item label="销售员" name="user_id">
            <Select allowClear placeholder="全部" options={toOptions(opts.users)} />
          </Form.Item></FCol>
        </FilterCard>
      )}
      {state.error && <Alert type="error" showIcon title={state.error.message} className="mb16" />}
      <Card>
        <Table<Weekly> rowKey="id" loading={state.loading} dataSource={state.data?.rows} pagination={pagination}
          scroll={{ x: 'max-content' }} locale={{ emptyText: '暂无周报' }}
          columns={[
            {
              title: '周次', dataIndex: 'week_start', width: 190,
              render: (v: string, w) => <Link to={`/weekly/${w.id}`}>{v} ~ {weekEnd(v).slice(5)}</Link>,
            },
            { title: '销售员', dataIndex: 'sales' },
            { title: '本周总结', dataIndex: 'summary', ellipsis: true, width: 420 },
            { title: '状态', dataIndex: 'status', render: (s) => <StatusTag status={s} /> },
            { title: '更新时间', dataIndex: 'updated_at', responsive: ['md'], render: (v) => <span className="hint">{v}</span> },
          ]} />
      </Card>
    </>
  )
}
