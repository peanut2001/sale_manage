import { App, Button, DatePicker, Form, Input } from 'antd'
import dayjs from 'dayjs'
import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { ApiError, post, put } from '../../api'
import Async from '../../components/Async'
import FormModal, { ModalActions } from '../../components/FormModal'
import { useApi } from '../../hooks'
import type { Result, Visit, Weekly } from '../../types'
import WeekVisits from './WeekVisits'

interface FormData {
  report: Weekly | null
  monday: string
  sunday: string
  visits: Visit[]
}

interface Props {
  open: boolean
  id?: number // 修改时传入
  onClose: () => void
  onSaved: (id: number) => void
}

export default function WeeklyFormModal({ open, ...rest }: Props) {
  return (
    <FormModal open={open} title={rest.id ? '修改周报' : '填写周报'} width={900} onClose={rest.onClose}>
      <WeeklyFormLoader {...rest} />
    </FormModal>
  )
}

function WeeklyFormLoader({ id, onClose, onSaved }: Omit<Props, 'open'>) {
  const [week, setWeek] = useState('')
  const state = useApi<FormData>(`/api/weekly/form?id=${id ?? ''}&week=${week}`)
  const d = state.data
  // 新建时可切换周次; 修改时周次固定
  const picker = !id && d && (
    <DatePicker picker="week" allowClear={false} value={dayjs(d.monday)}
      onChange={(v) => v && setWeek(v.format('YYYY-MM-DD'))} />
  )
  return (
    <Async state={state} onBack={onClose}>
      {(data) => <WeeklyFormBody key={data.monday} data={data} picker={picker} onClose={onClose} onSaved={onSaved} />}
    </Async>
  )
}

function WeeklyFormBody({ data, picker, onClose, onSaved }: Omit<Props, 'open' | 'id'> & { data: FormData; picker: ReactNode }) {
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
      onSaved(res.id!)
      onClose()
    } catch (e) {
      // 该周已有周报: 直接打开已有的那份
      if (e instanceof ApiError && e.status === 409) {
        message.warning(e.message)
        onClose()
        navigate(`/weekly/${e.data.dup_id}`)
      } else if (!(e instanceof ApiError && e.status === 401)) {
        message.error((e as Error).message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="form-card">
      <div className="modal-week-bar">
        <strong>周次：{data.monday} ~ {data.sunday}</strong>
        {picker}
      </div>
      <div className="modal-section">
        <div className="hint">本周拜访记录（{data.visits.length}）由系统自动带出，供填写参考</div>
        <WeekVisits visits={data.visits} empty="本周暂无拜访记录" />
      </div>
      <Form form={form} layout="vertical" initialValues={w ?? {}}>
        <Form.Item label="本周工作总结" name="summary"
          rules={[{ required: true, message: '请填写本周工作总结' }, { min: 10, message: '本周工作总结至少 10 个字' }]}>
          <Input.TextArea autoSize={{ minRows: 5 }} placeholder="主要工作、重点客户进展、订单/回款情况" />
        </Form.Item>
        <Form.Item label="问题与需要的支持" name="problems">
          <Input.TextArea autoSize={{ minRows: 2 }} placeholder="遇到的困难、需要公司/主管协调的事项" />
        </Form.Item>
        <Form.Item label="下周工作计划" name="next_plan">
          <Input.TextArea autoSize={{ minRows: 2 }} placeholder="计划拜访客户、目标" />
        </Form.Item>
        <ModalActions>
          <Button onClick={onClose}>取消</Button>
          <Button loading={loading} onClick={() => save('save')}>保存草稿</Button>
          <Button type="primary" loading={loading} onClick={() => save('submit')}>提交</Button>
        </ModalActions>
      </Form>
    </div>
  )
}
