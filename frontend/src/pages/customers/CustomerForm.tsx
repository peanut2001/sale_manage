import { Button, Card, Col, Form, Input, Result, Row, Select } from 'antd'
import { useNavigate, useParams } from 'react-router'
import { post, put } from '../../api'
import Async from '../../components/Async'
import PageHeader from '../../components/PageHeader'
import { useAction, useApi, useOptions } from '../../hooks'
import { useAuth, useMe } from '../../session'
import type { Customer, Result as ApiResult } from '../../types'
import { serialize, toOptions } from '../../utils'

const LEVELS = [
  { value: 'A', label: 'A 重点客户' },
  { value: 'B', label: 'B 普通客户' },
  { value: 'C', label: 'C 潜在客户' },
]

export default function CustomerForm() {
  const { id } = useParams()
  const { isManager } = useMe()
  const state = useApi<{ customer: Customer }>(id && isManager ? `/api/customers/${id}` : null)
  const title = id ? '修改客户' : isManager ? '新增客户' : '申请新增客户'
  if (id && !isManager) return <Result status="403" title="没有权限访问该页面" />
  return (
    <>
      <PageHeader title={title} />
      {id ? <Async state={state}>{(d) => <CustomerFormBody customer={d.customer} />}</Async> : <CustomerFormBody />}
    </>
  )
}

function CustomerFormBody({ customer }: { customer?: Customer }) {
  const { session } = useAuth()
  const { isManager } = useMe()
  const navigate = useNavigate()
  const opts = useOptions()
  const [run, loading] = useAction()

  const submit = async (values: object) => {
    const body = serialize(values)
    const res = await run(() => (customer ? put<ApiResult>(`/api/customers/${customer.id}`, body) : post<ApiResult>('/api/customers', body)))
    if (res) navigate(`/customers/${res.id}`)
  }

  return (
    <Card className="form-card">
      <Form layout="vertical" onFinish={submit}
        initialValues={customer ? { ...customer, owner_id: customer.owner_id ?? undefined } : { level: 'B', status: 'active' }}>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item label="客户名称" name="name" rules={[{ required: true, whitespace: true, message: '请填写客户名称' }]}>
              <Input placeholder="请填写营业执照上的全称" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}><Form.Item label="客户等级" name="level"><Select options={LEVELS} /></Form.Item></Col>
          <Col xs={24} md={12}><Form.Item label="行业" name="industry"><Input /></Form.Item></Col>
          <Col xs={24} md={12}><Form.Item label="地区" name="region"><Input placeholder="省/市" /></Form.Item></Col>
          <Col span={24}><Form.Item label="地址" name="address"><Input /></Form.Item></Col>
          {isManager && (
            <>
              <Col xs={24} md={12}>
                <Form.Item label="负责销售" name="owner_id">
                  <Select allowClear placeholder="-- 未分配 --" showSearch={{ optionFilterProp: 'label' }} options={toOptions(opts.owners)} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="状态" name="status">
                  <Select options={['active', 'pending', 'disabled'].map((k) => ({ value: k, label: session.status[k][0] }))} />
                </Form.Item>
              </Col>
            </>
          )}
          <Col span={24}><Form.Item label="备注" name="remark"><Input.TextArea autoSize={{ minRows: 2 }} /></Form.Item></Col>
        </Row>
        {!isManager && <p className="hint">销售员新增的客户需经主管审核, 通过后才会出现在拜访记录的客户名单中。</p>}
        <div className="form-actions">
          <Button type="primary" htmlType="submit" loading={loading}>保存</Button>
          <Button onClick={() => navigate(-1)}>取消</Button>
        </div>
      </Form>
    </Card>
  )
}
