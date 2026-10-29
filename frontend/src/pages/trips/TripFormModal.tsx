import { App, AutoComplete, Button, Col, DatePicker, Form, Input, InputNumber, Row } from 'antd'
import { post, put } from '../../api'
import FormModal, { ModalActions } from '../../components/FormModal'
import { useAction } from '../../hooks'
import type { Result, Trip } from '../../types'
import { deserialize, money, serialize } from '../../utils'

const COSTS = [
  ['cost_transport', '交通费'],
  ['cost_hotel', '住宿费'],
  ['cost_meal', '餐费/补贴'],
  ['cost_other', '其他'],
] as const

interface Props {
  open: boolean
  trip?: Trip // 修改时传入
  onClose: () => void
  onSaved: (id: number) => void
}

export default function TripFormModal({ open, trip, onClose, onSaved }: Props) {
  return (
    <FormModal open={open} title={trip ? '修改出差报告' : '新建出差报告'} width={800} onClose={onClose}>
      <TripFormBody trip={trip} onClose={onClose} onSaved={onSaved} />
    </FormModal>
  )
}

function TripFormBody({ trip, onClose, onSaved }: Omit<Props, 'open'>) {
  const { modal } = App.useApp()
  const [form] = Form.useForm()
  const [run, loading] = useAction()
  const costs = Form.useWatch((v) => COSTS.reduce((s, [k]) => s + (Number(v[k]) || 0), 0), form) ?? 0

  const initial = trip
    ? Object.fromEntries(Object.entries(deserialize(trip, ['start_date', 'end_date'])).map(([k, v]) => [k, k.startsWith('cost_') ? v || undefined : v]))
    : {}

  const save = async (action: 'save' | 'submit') => {
    const values = await form.validateFields()
    const body = { ...serialize(values), action }
    const res = await run(() => (trip ? put<Result>(`/api/trips/${trip.id}`, body) : post<Result>('/api/trips', body)))
    if (res) {
      onSaved(res.id!)
      onClose()
    }
  }

  const submit = () => {
    form.validateFields().then(
      () => {
        modal.confirm({ title: '提交审批', content: '提交后不能修改，确定提交审批？', onOk: () => save('submit') })
      },
      () => {},
    )
  }

  return (
    <Form form={form} layout="vertical" initialValues={initial} className="form-card">
      <Row gutter={16}>
        <Col xs={12} md={6}>
          <Form.Item label="出发日期" name="start_date" rules={[{ required: true, message: '请填写出发日期' }]}><DatePicker /></Form.Item>
        </Col>
        <Col xs={12} md={6}>
          <Form.Item label="返回日期" name="end_date" dependencies={['start_date']}
            rules={[
              { required: true, message: '请填写返回日期' },
              ({ getFieldValue }) => ({
                validator: (_, v) => !v || !getFieldValue('start_date') || !v.isBefore(getFieldValue('start_date'), 'day')
                  ? Promise.resolve() : Promise.reject(new Error('结束日期不能早于开始日期')),
              }),
            ]}>
            <DatePicker />
          </Form.Item>
        </Col>
        <Col xs={24} md={6}>
          <Form.Item label="出差地点" name="destination" rules={[{ required: true, whitespace: true, message: '请填写出差地点' }]}>
            <Input placeholder="如：苏州、无锡" />
          </Form.Item>
        </Col>
        <Col xs={24} md={6}>
          <Form.Item label="交通方式" name="transport">
            <AutoComplete placeholder="高铁/飞机/自驾" options={['高铁', '飞机', '自驾', '大巴'].map((value) => ({ value }))} />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item label="出差目的" name="purpose"><Input.TextArea autoSize={{ minRows: 2 }} /></Form.Item>
        </Col>
      </Row>

      <h3 className="form-section">费用（元）<span className="hint">合计 {money(costs)}</span></h3>
      <Row gutter={16}>
        {COSTS.map(([name, label]) => (
          <Col xs={12} md={6} key={name}>
            <Form.Item label={label} name={name}><InputNumber min={0} step={0.01} /></Form.Item>
          </Col>
        ))}
        <Col span={24}>
          <Form.Item label="出差总结" name="summary">
            <Input.TextArea autoSize={{ minRows: 3 }} placeholder="本次出差整体收获、问题与后续安排（拜访明细请在保存后添加拜访记录）" />
          </Form.Item>
        </Col>
      </Row>
      <p className="hint">建议流程：先保存草稿 → 在出差期间逐条添加拜访记录 → 回来后填写总结并提交审批。</p>
      <ModalActions>
        <Button onClick={onClose}>取消</Button>
        <Button loading={loading} onClick={() => save('save')}>保存草稿</Button>
        <Button type="primary" loading={loading} onClick={submit}>提交审批</Button>
      </ModalActions>
    </Form>
  )
}
