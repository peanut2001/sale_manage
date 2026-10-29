import { App, Button, Card, DatePicker, Form, Input } from 'antd'
import dayjs from 'dayjs'
import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { ApiError, post, put } from '../../api'
import Async from '../../components/Async'
import PageHeader from '../../components/PageHeader'
import { useApi } from '../../hooks'
import type { Result, Visit, Weekly } from '../../types'
import WeekVisits from './WeekVisits'

interface FormData {
  report: Weekly | null
  monday: string
  sunday: string
  visits: Visit[]
}

export default function WeeklyForm() {
  const { id } = useParams()
  const [sp, setSp] = useSearchParams()
  const state = useApi<FormData>(`/api/weekly/form?id=${id ?? ''}&week=${sp.get('week') ?? ''}`)
  const d = state.data

  return (
    <>
      <PageHeader title={d ? `${id ? '修改' : '填写'}周报: ${d.monday} ~ ${d.sunday}` : '周报'}
        extra={!id && d && (
          <DatePicker picker="week" allowClear={false} value={dayjs(d.monday)}
            onChange={(v) => v && setSp({ week: v.format('YYYY-MM-DD') }, { replace: true })} />
        )} />
      <Async state={state}>{(data) => <WeeklyFormBody key={data.monday} data={data} />}</Async>
    </>
  )
}

function WeeklyFormBody({ data }: { data: FormData }) {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const w = data.report

  const save = async (action: 'save' | 'submit') => {
    const values = await form.validateFields()
    const body = { ...values, week: data.monday, action }
    setLoading(true)
    try {
      const res = await (w ? put<Result>(`/api/weekly/${w.id}`, body) : post<Result>('/api/weekly', body))
      message.success(res.message)
      navigate(`/weekly/${res.id}`)
    } catch (e) {
      // 该周已有周报: 直接打开已有的那份
      if (e instanceof ApiError && e.status === 409) {
        message.warning(e.message)
        navigate(`/weekly/${e.data.dup_id}`)
      } else if (!(e instanceof ApiError && e.status === 401)) {
        message.error((e as Error).message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="stack">
      <Card title={<>本周拜访记录 ({data.visits.length}) <span className="hint">系统自动带出, 供填写参考</span></>}>
        <WeekVisits visits={data.visits} empty="本周暂无拜访记录" />
      </Card>
      <Card className="form-card">
        <Form form={form} layout="vertical" initialValues={w ?? {}}>
          <Form.Item label="本周工作总结" name="summary"
            rules={[{ required: true, message: '请填写本周工作总结' }, { min: 10, message: '本周工作总结至少 10 个字' }]}>
            <Input.TextArea autoSize={{ minRows: 6 }} placeholder="主要工作、重点客户进展、订单/回款情况" />
          </Form.Item>
          <Form.Item label="问题与需要的支持" name="problems">
            <Input.TextArea autoSize={{ minRows: 3 }} placeholder="遇到的困难、需要公司/主管协调的事项" />
          </Form.Item>
          <Form.Item label="下周工作计划" name="next_plan">
            <Input.TextArea autoSize={{ minRows: 3 }} placeholder="计划拜访客户、目标" />
          </Form.Item>
          <div className="form-actions">
            <Button loading={loading} onClick={() => save('save')}>保存草稿</Button>
            <Button type="primary" loading={loading} onClick={() => save('submit')}>提交</Button>
          </div>
        </Form>
      </Card>
    </div>
  )
}
