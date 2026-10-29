import { PlusOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Table, Tag } from 'antd'
import { useState } from 'react'
import FilterCard from '../../components/FilterCard'
import { useApi } from '../../hooks'
import { useAuth } from '../../session'
import type { Account } from '../../types'
import { pagination } from '../../utils'
import UserFormModal from './UserFormModal'

export default function UserList() {
  const { session } = useAuth()
  const state = useApi<{ rows: Account[] }>('/api/users')
  // null: 弹窗关闭; {}: 新增; { id }: 编辑
  const [edit, setEdit] = useState<{ id?: number } | null>(null)
  return (
    <>
      <FilterCard total={state.data?.rows.length}
        toolbar={
          <>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setEdit({})}>新增账号</Button>
            <span className="hint">员工离职请「停用」账号而非删除，以保留其历史拜访数据；其负责客户可在编辑账号时改派。</span>
          </>
        } />
      {state.error && <Alert type="error" showIcon title={state.error.message} className="mb16" />}
      <Card>
        <Table<Account> rowKey="id" loading={state.loading} dataSource={state.data?.rows} pagination={pagination}
          scroll={{ x: 'max-content' }}
          columns={[
            { title: '用户名', dataIndex: 'username' },
            { title: '姓名', dataIndex: 'name' },
            { title: '角色', dataIndex: 'role', render: (r: Account['role']) => session.roles[r] },
            { title: '所属主管', dataIndex: 'manager_name', render: (v) => v || '-' },
            { title: '区域', dataIndex: 'region' },
            { title: '电话', dataIndex: 'phone' },
            {
              title: '状态', dataIndex: 'active',
              render: (a) => (a ? <Tag variant="filled" color="green">启用</Tag> : <Tag variant="filled">停用</Tag>),
            },
            {
              title: '', key: 'edit', align: 'right',
              render: (_, u) => <Button type="link" size="small" onClick={() => setEdit({ id: u.id })}>编辑</Button>,
            },
          ]} />
      </Card>
      <UserFormModal open={edit !== null} id={edit?.id} onClose={() => setEdit(null)} onSaved={state.reload} />
    </>
  )
}
