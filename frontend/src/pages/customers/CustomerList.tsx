import { PlusOutlined, UploadOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Form, Input, Select, Space, Table, Tooltip, Upload } from 'antd'
import { useState } from 'react'
import { Link } from 'react-router'
import { post } from '../../api'
import FilterCard, { FCol } from '../../components/FilterCard'
import { LevelTag, StatusTag } from '../../components/Tags'
import { refreshOptions, useAction, useApi, useFilters, useOptions } from '../../hooks'
import { useAuth, useMe } from '../../session'
import type { Customer, Result } from '../../types'
import { pagination, toOptions } from '../../utils'
import CustomerFormModal from './CustomerFormModal'

export default function CustomerList() {
  const { session } = useAuth()
  const { isManager } = useMe()
  const [open, setOpen] = useState(false)
  const opts = useOptions()
  const filters = useFilters()
  const state = useApi<{ rows: Customer[] }>(`/api/customers?${filters.query}`)
  const [run, loading] = useAction()

  const review = async (id: number, ok: boolean) => {
    if (await run(() => post<Result>(`/api/customers/${id}/approve`, { ok }))) {
      state.reload()
      void refreshOptions()
    }
  }
  const importFile = async (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    if (await run(() => post<Result>('/api/customers/import', fd))) {
      state.reload()
      void refreshOptions()
    }
  }

  return (
    <>
      <FilterCard filters={filters} total={state.data?.rows.length}
        toolbar={
          <>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
              {isManager ? '新增客户' : '申请新增客户'}
            </Button>
            {isManager && (
              <Tooltip title="Excel（.xlsx）第一行为表头，列顺序：客户名称 / 等级（A/B/C）/ 行业 / 地区 / 地址 / 负责销售（姓名或用户名）">
                <Upload accept=".xlsx" showUploadList={false} beforeUpload={(f) => (void importFile(f), false)}>
                  <Button icon={<UploadOutlined />} loading={loading}>导入 Excel</Button>
                </Upload>
              </Tooltip>
            )}
          </>
        }>
        <FCol><Form.Item label="关键字" name="kw"><Input allowClear placeholder="名称/地区/行业" /></Form.Item></FCol>
        <FCol><Form.Item label="等级" name="level">
          <Select allowClear placeholder="全部" options={['A', 'B', 'C'].map((l) => ({ value: l, label: l }))} />
        </Form.Item></FCol>
        <FCol><Form.Item label="状态" name="status">
          <Select allowClear placeholder="全部"
            options={['active', 'pending', 'disabled'].map((k) => ({ value: k, label: session.status[k][0] }))} />
        </Form.Item></FCol>
        <FCol><Form.Item label="负责销售" name="owner_id">
          <Select allowClear placeholder="全部" showSearch={{ optionFilterProp: 'label' }} options={toOptions(opts.owners)} />
        </Form.Item></FCol>
      </FilterCard>

      {state.error && <Alert type="error" showIcon title={state.error.message} className="mb16" />}
      <Card>
        <Table<Customer> rowKey="id" loading={state.loading} dataSource={state.data?.rows} pagination={pagination} locale={{ emptyText: '暂无客户' }}
          columns={[
            { title: '等级', dataIndex: 'level', width: 64, render: (l) => <LevelTag level={l} /> },
            { title: '客户名称', dataIndex: 'name', render: (v, c) => <Link to={`/customers/${c.id}`}>{v}</Link> },
            { title: '行业', dataIndex: 'industry' },
            { title: '地区', dataIndex: 'region' },
            { title: '负责销售', dataIndex: 'owner_name', render: (v) => v || '-' },
            { title: '拜访次数', dataIndex: 'nvisits', align: 'right' },
            { title: '最近拜访', dataIndex: 'last_visit', render: (v) => v || '-' },
            {
              title: '状态', dataIndex: 'status',
              render: (s, c) => (
                <Space size={6} wrap>
                  <StatusTag status={s} />
                  {s === 'pending' && isManager && (
                    <>
                      <Button size="small" type="primary" onClick={() => review(c.id, true)}>通过</Button>
                      <Button size="small" danger onClick={() => review(c.id, false)}>驳回</Button>
                    </>
                  )}
                </Space>
              ),
            },
          ]} />
      </Card>
      <CustomerFormModal open={open} onClose={() => setOpen(false)} onSaved={state.reload} />
    </>
  )
}
