import { Button, Card, Empty, Input, Space, Tag, Timeline } from 'antd'
import { useState } from 'react'
import { post } from '../api'
import { useAction } from '../hooks'
import { useAuth } from '../session'
import type { Approval, ApprovalInfo, Result, Target } from '../types'

const DECISION: Record<Approval['decision'], [string, string]> = {
  approved: ['通过', 'green'],
  rejected: ['退回', 'red'],
  comment: ['批注', 'blue'],
}

export default function ApprovalPanel({ target, id, info, onDone }: {
  target: Target
  id: number
  info: ApprovalInfo
  onDone: () => void
}) {
  const { refresh } = useAuth()
  const [comment, setComment] = useState('')
  const [decision, setDecision] = useState<Approval['decision']>()
  const [run, loading] = useAction()

  const submit = async (d: Approval['decision']) => {
    setDecision(d)
    if (await run(() => post<Result>(`/api/approve/${target}/${id}`, { decision: d, comment }))) {
      setComment('')
      onDone()
      void refresh()
    }
  }

  return (
    <Card title="审批意见" className="approval-panel">
      {info.approvals.length ? (
        <Timeline
          items={info.approvals.map((a) => ({
            color: DECISION[a.decision][1],
            content: (
              <>
                <Space size={8} wrap>
                  <strong>{a.approver}</strong>
                  <Tag variant="filled" color={DECISION[a.decision][1]}>{DECISION[a.decision][0]}</Tag>
                  <span className="hint">{a.created_at}</span>
                </Space>
                {a.comment && <div className="prose approval-comment">{a.comment}</div>}
              </>
            ),
          }))}
        />
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无审批意见" />
      )}
      {info.can_comment && (
        <div className="approve-form no-print">
          <Input.TextArea rows={3} value={comment} onChange={(e) => setComment(e.target.value)}
            placeholder="填写审批意见或工作指导 (退回时必填)" />
          <Space wrap>
            {info.can_approve && (
              <>
                <Button type="primary" loading={loading && decision === 'approved'}
                  onClick={() => submit('approved')}>审批通过</Button>
                <Button danger loading={loading && decision === 'rejected'}
                  onClick={() => submit('rejected')}>退回修改</Button>
              </>
            )}
            <Button loading={loading && decision === 'comment'} onClick={() => submit('comment')}>仅添加批注</Button>
          </Space>
        </div>
      )}
    </Card>
  )
}
