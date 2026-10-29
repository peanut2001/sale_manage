import { PrinterOutlined } from '@ant-design/icons'
import { Button, Card, Descriptions } from 'antd'
import { useNavigate, useParams } from 'react-router'
import { post } from '../../api'
import ApprovalPanel from '../../components/ApprovalPanel'
import Async from '../../components/Async'
import PageHeader from '../../components/PageHeader'
import Prose from '../../components/Prose'
import { StatusTag } from '../../components/Tags'
import { useAction, useApi } from '../../hooks'
import type { ApprovalInfo, Result, Visit, Weekly } from '../../types'
import WeekVisits from './WeekVisits'

export default function WeeklyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
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
            <PageHeader title={<>{w.sales} 周报 {w.week_start} ~ {d.sunday} <StatusTag status={w.status} /></>}
              extra={
                <>
                  {d.mine && ['draft', 'rejected'].includes(w.status) && (
                    <>
                      <Button onClick={() => navigate(`/weekly/${w.id}/edit`)}>修改</Button>
                      <Button type="primary" loading={loading} onClick={submit}>提交</Button>
                    </>
                  )}
                  <Button icon={<PrinterOutlined />} onClick={() => window.print()}>打印</Button>
                </>
              } />
            <Card>
              <Descriptions column={1} styles={{ label: { width: 110 } }}
                items={[
                  { label: '本周总结', children: <Prose text={w.summary} /> },
                  { label: '问题与支持', children: <Prose text={w.problems} /> },
                  { label: '下周计划', children: <Prose text={w.next_plan} /> },
                ]} />
            </Card>
            <Card title={`本周拜访 (${d.visits.length})`}>
              <WeekVisits visits={d.visits} link empty="本周无拜访记录" />
            </Card>
            <ApprovalPanel target="weekly" id={w.id} info={d} onDone={state.reload} />
          </div>
        )
      }}
    </Async>
  )
}
