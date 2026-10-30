import { PrinterOutlined } from '@ant-design/icons'
import { Button, Card, Descriptions, Space } from 'antd'
import { useState } from 'react'
import { useParams } from 'react-router'
import { post } from '../../api'
import ApprovalPanel from '../../components/ApprovalPanel'
import Async from '../../components/Async'
import Prose from '../../components/Prose'
import { StatusTag } from '../../components/Tags'
import { useAction, useApi } from '../../hooks'
import type { ApprovalInfo, Result, Visit, Weekly } from '../../types'
import WeekVisits from './WeekVisits'
import WeeklyFormModal from './WeeklyFormModal'

export default function WeeklyDetail() {
  const { id } = useParams()
  const [open, setOpen] = useState(false)
  const state = useApi<{ report: Weekly; sunday: string; visits: Visit[] } & ApprovalInfo>(`/api/weekly/${id}`)
  const [run, loading] = useAction()

  const submit = async () => {
    if (await run(() => post<Result>(`/api/weekly/${id}/submit`))) state.reload()
  }

  return (
    <Async state={state}>
      {(d) => {
        const w = d.report
        return (
          <div className="stack">
            <Card title="周报内容"
              extra={
                <Space wrap className="no-print">
                  {d.mine && ['draft', 'rejected'].includes(w.status) && (
                    <>
                      <Button onClick={() => setOpen(true)}>修改</Button>
                      <Button color="primary" variant="filled" loading={loading} onClick={submit}>提交</Button>
                    </>
                  )}
                  <Button icon={<PrinterOutlined />} onClick={() => window.print()}>打印</Button>
                </Space>
              }>
              <Descriptions column={1} styles={{ label: { width: 110 } }}
                items={[
                  { label: '销售员', children: w.sales },
                  { label: '周次', children: `${w.week_start} ~ ${d.sunday}` },
                  { label: '状态', children: <StatusTag status={w.status} /> },
                  { label: '本周总结', children: <Prose text={w.summary} /> },
                  { label: '问题与支持', children: <Prose text={w.problems} /> },
                  { label: '下周计划', children: <Prose text={w.next_plan} /> },
                ]} />
            </Card>
            <Card title={`本周拜访（${d.visits.length}）`}>
              <WeekVisits visits={d.visits} link empty="本周无拜访记录" />
            </Card>
            <ApprovalPanel target="weekly" id={w.id} info={d} onDone={state.reload} />
            <WeeklyFormModal open={open} id={w.id} onClose={() => setOpen(false)} onSaved={state.reload} />
          </div>
        )
      }}
    </Async>
  )
}
