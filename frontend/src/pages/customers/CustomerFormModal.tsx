import { Button, Col, Form, Input, Row, Select } from 'antd'
import { post, put } from '../../api'
import FormModal, { ModalActions } from '../../components/FormModal'
import { refreshOptions, useAction, useOptions } from '../../hooks'
import { useAuth, useMe } from '../../session'
import type { Customer, Result } from '../../types'
import { serialize, toOptions } from '../../utils'

const LEVELS = [
  { value: 'A', label: 'A 重点客户' },
  { value: 'B', label: 'B 普通客户' },
  { value: 'C', label: 'C 潜在客户' },
]

interface Props {
  open: boolean
  customer?: Customer
  onClose: () => void
  onSaved: (id: number) => void
}

export default function CustomerFormModal({ open, customer, onClose, onSaved }: Props) {
  const { isManager } = useMe()
  const title = customer ? '修改客户' : isManager ? '新增客户' : '申请新增客户'
  return (
    <FormModal open={open} title={title} width={680} onClose={onClose}>
      <CustomerFormBody customer={customer} onClose={onClose} onSaved={onSaved} />
    </FormModal>
  )
}

function CustomerFormBody({ customer, onClose, onSaved }: Omit<Props, 'open'>) {
  const { session } = useAuth()
  const { isManager } = useMe()
  const opts = useOptions()
  const [run, loading] = useAction()

  const submit = async (values: object) => {
    const body = serialize(values)
    const res = await run(() => (customer ? put<Result>(`/api/customers/${customer.id}`, body) : post<Result>('/api/customers', body)))
    if (res) {
      void refreshOptions()
      onSaved(res.id!)
      onClose()
    }
  }

  return (
    <Form layout="vertical" onFinish={submit} className="form-card"
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
      {!isManager && <p className="hint">销售员新增的客户需经主管审核，通过后才会出现在拜访记录的客户名单中。</p>}
      <ModalActions>
        <Button onClick={onClose}>取消</Button>
        <Button type="primary" htmlType="submit" loading={loading}>保存</Button>
      </ModalActions>
    </Form>
  )
}
