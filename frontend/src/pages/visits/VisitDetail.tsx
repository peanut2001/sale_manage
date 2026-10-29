import { Button, Card, Descriptions, Popconfirm } from 'antd'
import { Link, useNavigate, useParams } from 'react-router'
import { del } from '../../api'
import Async from '../../components/Async'
import PageHeader from '../../components/PageHeader'
import Prose from '../../components/Prose'
import { LevelTag } from '../../components/Tags'
import { useAction, useApi } from '../../hooks'
import type { Result, Visit } from '../../types'

export default function VisitDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const state = useApi<{ visit: Visit; editable: boolean }>(`/api/visits/${id}`)
  const [run, loading] = useAction()

  const remove = async () => {
    if (await run(() => del<Result>(`/api/visits/${id}`))) navigate('/visits')
  }

  return (
    <Async state={state}>
      {({ visit: v, editable }) => (
        <>
          <PageHeader title="拜访详情"
            extra={editable && (
              <>
                <Button onClick={() => navigate(`/visits/${v.id}/edit`)}>修改</Button>
                <Popconfirm title="确定删除这条拜访记录?" onConfirm={remove}>
                  <Button danger loading={loading}>删除</Button>
                </Popconfirm>
              </>
            )} />
          <Card>
            <Descriptions column={1} styles={{ label: { width: 110 } }}
              items={[
                { label: '客户', children: <><LevelTag level={v.level} /><Link to={`/customers/${v.customer_id}`}>{v.customer}</Link></> },
                { label: '销售员', children: v.sales },
                { label: '拜访时间', children: `${v.visit_date} ${v.start_time}${v.end_time ? ` - ${v.end_time}` : ''}` },
                { label: '拜访类型', children: v.visit_type },
                { label: '所属出差', children: v.trip_id ? <Link to={`/trips/${v.trip_id}`}>{v.trip_dest}</Link> : '本地拜访' },
                { label: '洽谈人', children: `${v.contact_name} ${v.contact_title} ${v.contact_phone}` },
                { label: '其他参与人', children: v.attendees || '-' },
                { label: '洽谈内容', children: <Prose text={v.content} /> },
                { label: '拜访成果', children: <Prose text={v.result} /> },
                { label: '商机阶段', children: `${v.stage || '-'}${v.amount ? ` · 预计 ${v.amount} 万元` : ''}` },
                { label: '下一步', children: `${v.next_step || '-'}${v.next_date ? ` (${v.next_date})` : ''}` },
                { label: '录入时间', children: <span className="hint">{v.created_at}</span> },
              ]} />
          </Card>
        </>
      )}
    </Async>
  )
}
