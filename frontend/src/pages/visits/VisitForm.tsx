import { AutoComplete, Button, Card, Col, DatePicker, Form, Input, InputNumber, Row, Select } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { api, post, put } from '../../api'
import Async from '../../components/Async'
import PageHeader from '../../components/PageHeader'
import { useAction, useApi } from '../../hooks'
import { useAuth } from '../../session'
import type { Contact, CustomerOption, Result, Trip, Visit } from '../../types'
import { deserialize, serialize, strOptions } from '../../utils'

interface FormData {
  visit: Visit | null
  customers: CustomerOption[]
  trips: Trip[]
}

export default function VisitForm() {
  const { id } = useParams()
  const presetTrip = Number(useSearchParams()[0].get('trip_id')) || undefined
  const state = useApi<FormData>(`/api/visits/form?id=${id ?? ''}`)
  return (
    <>
      <PageHeader title={id ? '修改客户拜访记录' : '填写客户拜访记录'} />
      <Async state={state}>{(d) => <VisitFormBody data={d} presetTrip={presetTrip} />}</Async>
    </>
  )
}

function VisitFormBody({ data, presetTrip }: { data: FormData; presetTrip?: number }) {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [run, loading] = useAction()
  const [loaded, setLoaded] = useState<{ cid?: number; list: Contact[] }>({ list: [] })
  const again = useRef(false)
  const v = data.visit
  const customerId: number | undefined = Form.useWatch('customer_id', form)
  const contacts = loaded.cid === customerId ? loaded.list : []

  const defaults = {
    visit_date: dayjs(session.today),
    visit_type: '回访',
    stage: '',
    trip_id: data.trips.some((t) => t.id === presetTrip) ? presetTrip : undefined,
  }
  const initial = v ? { ...deserialize(v, ['visit_date', 'next_date']), amount: v.amount || undefined } : defaults

  // 选定客户后加载其历史联系人, 供洽谈人自动补全
  useEffect(() => {
    if (!customerId) return
    let alive = true
    api<Contact[]>(`/api/contacts?customer_id=${customerId}`).then((list) => alive && setLoaded({ cid: customerId, list }), () => {})
    return () => {
      alive = false
    }
  }, [customerId])

  const pickContact = (name: string) => {
    const c = contacts.find((x) => x.name === name)
    if (!c) return
    if (!form.getFieldValue('contact_title')) form.setFieldValue('contact_title', c.title)
    if (!form.getFieldValue('contact_phone')) form.setFieldValue('contact_phone', c.phone)
  }

  const submit = async (values: object) => {
    const body = serialize(values)
    const res = await run(() => (v ? put<Result>(`/api/visits/${v.id}`, body) : post<Result>('/api/visits', body)))
    if (!res) return
    if (again.current) {
      form.resetFields()
      form.setFieldsValue({ trip_id: body.trip_id || undefined })
      window.scrollTo({ top: 0 })
    } else {
      navigate(`/visits/${res.id}`)
    }
  }

  return (
    <Card className="form-card">
      <Form form={form} layout="vertical" initialValues={initial} onFinish={submit}>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item label="客户" name="customer_id" rules={[{ required: true, message: '请从客户名单中选择客户' }]}
              extra={<>名单中没有? <Link to="/customers/new" target="_blank">申请新增客户</Link> (主管审核后可选)</>}>
              <Select placeholder="输入关键字筛选客户名单…" showSearch={{ optionFilterProp: 'label' }}
                options={data.customers.map((c) => ({ value: c.id, label: `[${c.level}] ${c.name}${c.region ? ` · ${c.region}` : ''}` }))} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item label="拜访日期" name="visit_date" rules={[{ required: true, message: '请填写拜访日期' }]}>
              <DatePicker disabledDate={(d) => d.isAfter(session.today, 'day')} />
            </Form.Item>
          </Col>
          <Col xs={12} md={8}><Form.Item label="开始时间" name="start_time"><Input type="time" /></Form.Item></Col>
          <Col xs={12} md={8}><Form.Item label="结束时间" name="end_time"><Input type="time" /></Form.Item></Col>
          <Col xs={24} md={8}>
            <Form.Item label="拜访类型" name="visit_type"><Select options={strOptions(session.visit_types)} /></Form.Item>
          </Col>
          <Col xs={24} md={16}>
            <Form.Item label="所属出差行程" name="trip_id">
              <Select allowClear placeholder="非出差 (本地拜访)"
                options={data.trips.map((t) => ({ value: t.id, label: `${t.start_date} ~ ${t.end_date} ${t.destination}` }))} />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item label="洽谈人" name="contact_name" rules={[{ required: true, whitespace: true, message: '请填写洽谈人员' }]}>
              <AutoComplete options={contacts.map((c) => ({ value: c.name }))} onSelect={pickContact}
                onBlur={() => pickContact(form.getFieldValue('contact_name'))}
                showSearch={{ filterOption: (input, o) => String(o?.value ?? '').includes(input) }} />
            </Form.Item>
          </Col>
          <Col xs={12} md={8}><Form.Item label="职务" name="contact_title"><Input /></Form.Item></Col>
          <Col xs={12} md={8}><Form.Item label="联系电话" name="contact_phone"><Input /></Form.Item></Col>
          <Col span={24}>
            <Form.Item label="其他参与人员" name="attendees"><Input placeholder="客户方/我方其他人员, 用逗号分隔" /></Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item label="洽谈内容" name="content"
              rules={[{ required: true, message: '请填写洽谈内容' }, { min: 10, message: '洽谈内容至少 10 个字' }]}>
              <Input.TextArea autoSize={{ minRows: 4 }} placeholder="客户需求、沟通要点、客户反馈、竞品情况等" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="拜访成果" name="result">
              <Input.TextArea autoSize={{ minRows: 2 }} placeholder="达成的共识、获取的信息、送样/报价等" />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}><Form.Item label="商机阶段" name="stage"><Select options={strOptions(session.stages)} /></Form.Item></Col>
          <Col xs={12} md={6}><Form.Item label="预计商机金额 (万元)" name="amount"><InputNumber min={0} step={0.01} /></Form.Item></Col>
          <Col xs={24} md={6}><Form.Item label="下一步计划" name="next_step"><Input /></Form.Item></Col>
          <Col xs={24} md={6}><Form.Item label="下次跟进日期" name="next_date"><DatePicker /></Form.Item></Col>
        </Row>
        <div className="form-actions">
          <Button type="primary" htmlType="submit" loading={loading} onClick={() => (again.current = false)}>保存</Button>
          {!v && (
            <Button htmlType="submit" loading={loading} onClick={() => (again.current = true)}>保存并继续填写下一条</Button>
          )}
          <Button onClick={() => navigate(-1)}>取消</Button>
        </div>
      </Form>
    </Card>
  )
}
