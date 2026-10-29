import { PlusOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Form, Select, Table } from 'antd'
import dayjs from 'dayjs'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import Clip from '../../components/Clip'
import FilterCard, { FCol } from '../../components/FilterCard'
import { StatusTag } from '../../components/Tags'
import { useApi, useFilters, useOptions } from '../../hooks'
import { useAuth, useMe } from '../../session'
import type { Weekly } from '../../types'
import { pagination, toOptions, weekEnd } from '../../utils'
import WeeklyFormModal from './WeeklyFormModal'

export default function WeeklyList() {
  const { session } = useAuth()
  const { me, isManager } = useMe()
  const navigate = useNavigate()
  const opts = useOptions()
  const filters = useFilters()
  const [open, setOpen] = useState(false)
  const state = useApi<{ rows: Weekly[] }>(`/api/weekly?${filters.query}`)
  // 本周已写过周报时, 按钮直接打开那一份
  const monday = dayjs(session.today).startOf('week').format('YYYY-MM-DD')
  const mine = state.data?.rows.find((w) => w.user_id === me.id && w.week_start === monday)
  const toolbar = mine ? (
    <Button type="primary" onClick={() => navigate(`/weekly/${mine.id}`)}>
      本周周报 · {session.status[mine.status]?.[0]}
    </Button>
  ) : (
    <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>写本周周报</Button>
  )

  return (
    <>
      {/* 销售员只能看自己的周报, 不需要筛选 */}
      <FilterCard filters={isManager ? filters : undefined} total={state.data?.rows.length} toolbar={toolbar}>
        <FCol><Form.Item label="销售员" name="user_id">
          <Select allowClear placeholder="全部" options={toOptions(opts.users)} />
        </Form.Item></FCol>
      </FilterCard>
      {state.error && <Alert type="error" showIcon title={state.error.message} className="mb16" />}
      <Card>
        <Table<Weekly> rowKey="id" loading={state.loading} dataSource={state.data?.rows} pagination={pagination} locale={{ emptyText: '暂无周报' }}
          columns={[
            {
              title: '周次', dataIndex: 'week_start', width: 190,
              render: (v: string, w) => <Link to={`/weekly/${w.id}`}>{v} ~ {weekEnd(v).slice(5)}</Link>,
            },
            { title: '销售员', dataIndex: 'sales' },
            { title: '本周总结', dataIndex: 'summary', render: (v) => <Clip text={v} width={420} /> },
            { title: '状态', dataIndex: 'status', render: (s) => <StatusTag status={s} /> },
            { title: '更新时间', dataIndex: 'updated_at', responsive: ['md'], render: (v) => <span className="hint">{v}</span> },
          ]} />
      </Card>
      <WeeklyFormModal open={open} onClose={() => setOpen(false)} onSaved={state.reload} />
    </>
  )
}
