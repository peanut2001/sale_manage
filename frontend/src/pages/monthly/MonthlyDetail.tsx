import { PrinterOutlined } from '@ant-design/icons'
import { App, Button, Card, Col, Empty, Input, Row, Table } from 'antd'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { post } from '../../api'
import ApprovalPanel from '../../components/ApprovalPanel'
import Async from '../../components/Async'
import Bars from '../../components/Bars'
import Kpi from '../../components/Kpi'
import PageHeader from '../../components/PageHeader'
import Prose from '../../components/Prose'
import { StatusTag } from '../../components/Tags'
import { useAction, useApi } from '../../hooks'
import type { ApprovalInfo, MonthlyReport, MonthlyStats, Result } from '../../types'
import { money } from '../../utils'

type Data = { report: MonthlyReport; stats: MonthlyStats } & ApprovalInfo

export default function MonthlyDetail() {
  const { id } = useParams()
  const state = useApi<Data>(`/api/monthly/${id}`)
  return (
    <Async state={state}>{(d) => <MonthlyBody key={d.report.generated_at + d.report.status} data={d} reload={state.reload} />}</Async>
  )
}

function MonthlyBody({ data: d, reload }: { data: Data; reload: () => void }) {
  const { modal } = App.useApp()
  const [run, loading] = useAction()
  const m = d.report
  const s = d.stats
  const [summary, setSummary] = useState(m.self_summary)
  const editable = d.mine && ['generated', 'rejected'].includes(m.status)

  const act = async (action: 'save' | 'refresh' | 'submit') => {
    if (await run(() => post<Result>(`/api/monthly/${m.id}`, { action, self_summary: summary }))) reload()
  }

  return (
    <div className="stack">
      <PageHeader title={<>{m.sales} · {m.month} 月度出差报告 <StatusTag status={m.status} /></>}
        sub={`生成时间 ${m.generated_at}${m.region ? ` · ${m.region}` : ''}`}
        extra={<Button icon={<PrinterOutlined />} onClick={() => window.print()}>打印 / 导出 PDF</Button>} />

      <div className="kpis">
        <Kpi label="拜访次数" value={s.visit_count} sub={`上月 ${s.prev_visits}`} />
        <Kpi label="覆盖客户 / 新客户" value={`${s.customer_count} / ${s.new_customers.length}`} />
        <Kpi label="出差次数 / 天数" value={`${s.trip_count} / ${s.trip_days}`} />
        <Kpi label="差旅费用 (元)" value={money(s.cost_total)} sub={`上月 ${money(s.prev_cost)}`} />
        <Kpi label="单次拜访成本 (元)" value={money(s.cost_per_visit)} />
        <Kpi label="周报提交" value={`${s.weekly_done} / ${s.weeks}`} />
      </div>

      <Card title="系统分析">
        <ul className="analysis">{m.analysis.split('\n').map((line) => <li key={line}>{line}</li>)}</ul>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title="拜访类型分布" className="full-height"><Bars rows={s.by_type} total={s.visit_count} /></Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="客户等级分布" className="full-height">
            <Bars rows={Object.entries(s.by_level).map(([k, n]) => [`${k} 类`, n])} total={s.visit_count} />
            {s.by_stage.length > 0 && (
              <>
                <h4 className="sub-title">商机阶段</h4>
                <Bars rows={s.by_stage} total={s.visit_count} />
                <div className="bar-row"><span>预计商机金额</span><span /><b className="nowrap">{s.pipeline} 万元</b></div>
              </>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="拜访最多的客户" className="full-height">
            {s.top_customers.length ? s.top_customers.map(([c, n]) => (
              <div className="kv-row" key={c}><span>{c}</span><b>{n} 次</b></div>
            )) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无" />}
          </Card>
        </Col>
      </Row>

      <Card title="出差行程">
        <Table rowKey="id" dataSource={s.trips} pagination={false} size="small" scroll={{ x: 'max-content' }}
          locale={{ emptyText: '本月无出差' }}
          columns={[
            { title: '日期', key: 'date', render: (_, t) => <Link to={`/trips/${t.id}`}>{t.start} ~ {t.end}</Link> },
            { title: '地点', dataIndex: 'destination' },
            { title: '本月天数', dataIndex: 'days', align: 'right' },
            { title: '费用 (元)', dataIndex: 'cost', align: 'right', render: money },
            { title: '状态', dataIndex: 'status', render: (v) => <StatusTag status={v} /> },
          ]} />
        {s.trips.length > 0 && (
          <p className="hint" style={{ margin: '12px 0 0' }}>
            交通 {money(s.cost.transport)} · 住宿 {money(s.cost.hotel)} · 餐补 {money(s.cost.meal)} · 其他 {money(s.cost.other)}
          </p>
        )}
      </Card>

      {(s.a_missed.length > 0 || s.stale.length > 0) && (
        <Card title="需关注客户">
          {s.a_missed.length > 0 && <p><strong>本月未拜访的 A 类客户: </strong>{s.a_missed.join('、')}</p>}
          {s.stale.length > 0 && (
            <p><strong>超过 60 天未拜访: </strong>
              {s.stale.map((c) => `${c.name} (${c.level}类, ${c.last || '从未拜访'})`).join('、')}</p>
          )}
        </Card>
      )}

      <Card title="拜访明细">
        <Table dataSource={s.visits.map((v, key) => ({ ...v, key }))} pagination={false} size="small" scroll={{ x: 'max-content' }}
          locale={{ emptyText: '无' }}
          columns={[
            { title: '日期', dataIndex: 'date', width: 110 },
            { title: '客户', dataIndex: 'customer' },
            { title: '类型', dataIndex: 'type' },
            { title: '洽谈人员', dataIndex: 'contact' },
            { title: '洽谈内容', dataIndex: 'content', width: 320, render: (v) => <Prose text={v} /> },
            { title: '成果', dataIndex: 'result', width: 240, render: (v) => <Prose text={v} empty="" /> },
          ]} />
      </Card>

      <Card title="销售员补充说明">
        {editable ? (
          <div className="approve-form">
            <Input.TextArea autoSize={{ minRows: 4 }} value={summary} onChange={(e) => setSummary(e.target.value)}
              placeholder="对本月工作的总结、未达成原因说明、下月计划" />
            <div className="form-actions no-print">
              <Button loading={loading} onClick={() => act('save')}>保存</Button>
              <Button loading={loading} onClick={() => act('refresh')}>刷新统计数据</Button>
              <Button type="primary" loading={loading}
                onClick={() => modal.confirm({ title: '提交审批', content: '提交后不能修改, 确定提交审批?', onOk: () => act('submit') })}>
                提交审批
              </Button>
            </div>
          </div>
        ) : (
          <Prose text={m.self_summary} empty="(未填写)" />
        )}
      </Card>
      <ApprovalPanel target="monthly" id={m.id} info={d} onDone={reload} />
    </div>
  )
}
