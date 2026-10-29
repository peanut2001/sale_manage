import { Button, Card, Table } from 'antd'
import { useNavigate } from 'react-router'
import Async from '../components/Async'
import { useApi } from '../hooks'
import type { Target } from '../types'
import { pagination, targetUrl } from '../utils'

interface Item {
  type: Target
  label: string
  id: number
  sales: string
  title: string
}

export default function Approvals() {
  const navigate = useNavigate()
  const state = useApi<{ items: Item[] }>('/api/approvals')
  return (
    <Async state={state}>
      {({ items }) => (
        <>
          <Card>
            <Table<Item> rowKey={(r) => r.type + r.id} dataSource={items} pagination={pagination}
              scroll={{ x: 'max-content' }} locale={{ emptyText: '没有待审批的报告' }}
              columns={[
                { title: '类型', dataIndex: 'label' },
                { title: '销售员', dataIndex: 'sales' },
                { title: '内容', dataIndex: 'title' },
                {
                  title: '', key: 'go', align: 'right',
                  render: (_, r) => <Button type="primary" size="small" onClick={() => navigate(targetUrl[r.type] + r.id)}>去审批</Button>,
                },
              ]} />
          </Card>
        </>
      )}
    </Async>
  )
}
