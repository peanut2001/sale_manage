import { Card, Table } from 'antd'
import Async from '../components/Async'
import PageHeader from '../components/PageHeader'
import { useApi } from '../hooks'
import type { LogRow } from '../types'
import { pagination } from '../utils'

export default function Logs() {
  const state = useApi<{ rows: LogRow[] }>('/api/logs')
  return (
    <>
      <PageHeader title="操作日志" sub="最近 300 条" />
      <Async state={state}>
        {({ rows }) => (
          <Card>
            <Table<LogRow> rowKey="id" dataSource={rows} pagination={pagination} scroll={{ x: 'max-content' }}
              columns={[
                { title: '时间', dataIndex: 'created_at', width: 170 },
                { title: '用户', dataIndex: 'name', render: (v) => v || '-' },
                { title: '操作', dataIndex: 'action' },
                { title: '详情', dataIndex: 'detail' },
                { title: 'IP', dataIndex: 'ip' },
              ]} />
          </Card>
        )}
      </Async>
    </>
  )
}
