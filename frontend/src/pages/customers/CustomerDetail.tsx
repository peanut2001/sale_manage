import { Button, Card, Col, Descriptions, Row, Table } from 'antd'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import Async from '../../components/Async'
import Prose from '../../components/Prose'
import { LevelTag, StatusTag } from '../../components/Tags'
import { useApi } from '../../hooks'
import { useMe } from '../../session'
import type { Contact, Customer, Visit } from '../../types'
import CustomerFormModal from './CustomerFormModal'

export default function CustomerDetail() {
  const { id } = useParams()
  const { isManager } = useMe()
  const [open, setOpen] = useState(false)
  const state = useApi<{ customer: Customer; visits: Visit[]; contacts: Contact[] }>(`/api/customers/${id}`)

  return (
    <Async state={state}>
      {({ customer: c, visits, contacts }) => (
        <div className="stack">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="客户信息" className="full-height" extra={isManager && <Button onClick={() => setOpen(true)}>修改</Button>}>
                <Descriptions column={1} styles={{ label: { width: 90 } }}
                  items={[
                    { label: '客户名称', children: <><LevelTag level={c.level} /><strong>{c.name}</strong></> },
                    { label: '状态', children: <StatusTag status={c.status} /> },
                    { label: '行业', children: c.industry || '-' },
                    { label: '地区', children: c.region || '-' },
                    { label: '地址', children: c.address || '-' },
                    { label: '负责销售', children: c.owner_name || '-' },
                    { label: '备注', children: <Prose text={c.remark} /> },
                  ]} />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title={`联系人（${contacts.length}）`} className="full-height">
                <Table<Contact> rowKey="name" dataSource={contacts} pagination={false} size="small" showHeader={false}
                  locale={{ emptyText: '拜访时填写的洽谈人会自动沉淀到这里' }}
                  columns={[{ dataIndex: 'name' }, { dataIndex: 'title' }, { dataIndex: 'phone' }]} />
              </Card>
            </Col>
          </Row>
          <Card title={`拜访历史（${visits.length}）`}>
            <Table<Visit> rowKey="id" dataSource={visits} pagination={{ pageSize: 20, hideOnSinglePage: true }}
              scroll={{ x: 'max-content' }} locale={{ emptyText: '暂无拜访' }}
              columns={[
                { title: '日期', dataIndex: 'visit_date', width: 110, render: (v, r) => <Link to={`/visits/${r.id}`}>{v}</Link> },
                { title: '销售员', dataIndex: 'sales' },
                { title: '类型', dataIndex: 'visit_type' },
                { title: '洽谈人员', dataIndex: 'contact_name', render: (v, r) => `${v} ${r.contact_title}` },
                { title: '洽谈内容', dataIndex: 'content', width: 360, render: (v) => <Prose text={v} /> },
                { title: '下一步', dataIndex: 'next_step' },
              ]} />
          </Card>
          <CustomerFormModal open={open} customer={c} onClose={() => setOpen(false)} onSaved={state.reload} />
        </div>
      )}
    </Async>
  )
}
