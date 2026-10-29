import { PlusOutlined, PrinterOutlined } from '@ant-design/icons'
import { App, Button, Card, Descriptions, Popconfirm, Table } from 'antd'
import { Link, useNavigate, useParams } from 'react-router'
import { del, post } from '../../api'
import ApprovalPanel from '../../components/ApprovalPanel'
import Async from '../../components/Async'
import PageHeader from '../../components/PageHeader'
import Prose from '../../components/Prose'
import { LevelTag, StatusTag } from '../../components/Tags'
import { useAction, useApi } from '../../hooks'
import type { ApprovalInfo, Result, Trip, Visit } from '../../types'
import { money, tripCost } from '../../utils'

export default function TripDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { modal } = App.useApp()
  const state = useApi<{ trip: Trip; visits: Visit[] } & ApprovalInfo>(`/api/trips/${id}`)
  const [run, loading] = useAction()

  const submit = () =>
    modal.confirm({
      title: '提交审批', content: '提交后不能修改, 确定提交?',
      onOk: async () => (await run(() => post<Result>(`/api/trips/${id}/submit`))) && state.reload(),
    })
  const remove = async () => {
    if (await run(() => del<Result>(`/api/trips/${id}`))) navigate('/trips')
  }

  return (
    <Async state={state}>
      {(d) => {
        const t = d.trip
        const cost = tripCost(t)
        const editable = d.mine && ['draft', 'rejected'].includes(t.status)
        return (
          <div className="stack">
            <PageHeader title={<>出差报告 <StatusTag status={t.status} /></>}
              extra={
                <>
                  {editable && (
                    <>
                      <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate(`/visits/new?trip_id=${t.id}`)}>添加拜访记录</Button>
                      <Button onClick={() => navigate(`/trips/${t.id}/edit`)}>修改</Button>
                      <Button loading={loading} onClick={submit}>提交审批</Button>
                      <Popconfirm title="确定删除该出差报告?" description="其中的拜访记录会保留" onConfirm={remove}>
                        <Button danger>删除</Button>
                      </Popconfirm>
                    </>
                  )}
                  <Button icon={<PrinterOutlined />} onClick={() => window.print()}>打印</Button>
                </>
              } />
            <Card>
              <Descriptions column={1} styles={{ label: { width: 110 } }}
                items={[
                  { label: '销售员', children: t.sales },
                  { label: '出差时间', children: `${t.start_date} ~ ${t.end_date}` },
                  { label: '出差地点', children: `${t.destination}${t.transport ? ` · ${t.transport}` : ''}` },
                  { label: '出差目的', children: <Prose text={t.purpose} /> },
                  {
                    label: '费用',
                    children: (
                      <span>
                        交通 {money(t.cost_transport)} · 住宿 {money(t.cost_hotel)} · 餐补 {money(t.cost_meal)} · 其他 {money(t.cost_other)}
                        {' = '}<span className="money-total">{money(cost)} 元</span>
                        {d.visits.length > 0 && <span className="hint"> (单次拜访成本 {money(cost / d.visits.length)} 元)</span>}
                      </span>
                    ),
                  },
                  { label: '出差总结', children: <Prose text={t.summary} /> },
                ]} />
            </Card>
            <Card title={`拜访明细 (${d.visits.length})`}>
              <Table<Visit> rowKey="id" dataSource={d.visits} pagination={false} scroll={{ x: 'max-content' }}
                locale={{
                  emptyText: <>还没有拜访记录{editable && <>, <Link to={`/visits/new?trip_id=${t.id}`}>现在添加</Link></>}</>,
                }}
                columns={[
                  {
                    title: '日期', dataIndex: 'visit_date', width: 120,
                    render: (v, r) => <>{v}<div className="hint">{r.start_time}{r.end_time && `-${r.end_time}`}</div></>,
                  },
                  { title: '客户', dataIndex: 'customer', render: (v, r) => <><LevelTag level={r.level} /><Link to={`/visits/${r.id}`}>{v}</Link></> },
                  { title: '类型', dataIndex: 'visit_type' },
                  {
                    title: '洽谈人员', dataIndex: 'contact_name',
                    render: (v, r) => <>{v} {r.contact_title}{r.attendees && <div className="hint">{r.attendees}</div>}</>,
                  },
                  { title: '洽谈内容', dataIndex: 'content', width: 320, render: (v) => <Prose text={v} /> },
                  {
                    title: '成果/下一步', dataIndex: 'result', width: 240,
                    render: (v, r) => <><Prose text={v} empty="" />{r.next_step && <div className="hint">→ {r.next_step}</div>}</>,
                  },
                ]} />
            </Card>
            <ApprovalPanel target="trip" id={t.id} info={d} onDone={state.reload} />
          </div>
        )
      }}
    </Async>
  )
}
