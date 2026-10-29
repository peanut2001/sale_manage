import { SearchOutlined } from '@ant-design/icons'
import { Button, Card, Col, Form, Row, type ColProps } from 'antd'
import type { ReactNode } from 'react'
import type { useFilters } from '../hooks'

/** 列表页筛选栏: 查询条件写入地址栏 */
export default function FilterCard({ filters, initial, children }: {
  filters: ReturnType<typeof useFilters>
  initial?: Record<string, unknown>
  children: ReactNode
}) {
  return (
    <Card className="filter-card mb16" size="small">
      <Form key={filters.query} layout="vertical" initialValues={initial ?? filters.initial} onFinish={filters.apply}>
        <Row gutter={16} align="bottom">
          {children}
          <Col>
            <Form.Item>
              <div className="form-actions">
                <Button type="primary" ghost htmlType="submit" icon={<SearchOutlined />}>查询</Button>
                <Button onClick={() => filters.apply({})}>重置</Button>
              </div>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Card>
  )
}

export function FCol(props: ColProps) {
  return <Col xs={12} md={8} xl={4} {...props} />
}
