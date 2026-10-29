import { PlusOutlined } from '@ant-design/icons'
import { Button, Card, Table, Tag } from 'antd'
import { Link, useNavigate } from 'react-router'
import Async from '../../components/Async'
import PageHeader from '../../components/PageHeader'
import { useApi } from '../../hooks'
import { useAuth } from '../../session'
import type { Account } from '../../types'
import { pagination } from '../../utils'

export default function UserList() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const state = useApi<{ rows: Account[] }>('/api/users')
  return (
    <>
      <PageHeader title="账号管理"
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/users/new')}>新增账号</Button>} />
      <Async state={state}>
        {({ rows }) => (
          <Card>
            <Table<Account> rowKey="id" dataSource={rows} pagination={pagination} scroll={{ x: 'max-content' }}
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
                { title: '', key: 'edit', align: 'right', render: (_, u) => <Link to={`/users/${u.id}/edit`}>编辑</Link> },
              ]} />
          </Card>
        )}
      </Async>
      <p className="hint" style={{ marginTop: 12 }}>员工离职请"停用"账号而非删除, 以保留其历史拜访数据; 其负责客户可在编辑账号时改派。</p>
    </>
  )
}
