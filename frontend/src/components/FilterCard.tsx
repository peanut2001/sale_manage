import { SearchOutlined } from '@ant-design/icons'
import { Button, Card, Col, Form, Row, Space, type ColProps } from 'antd'
import type { ReactNode } from 'react'
import type { useFilters } from '../hooks'

/**
 * 列表页顶部卡片: 第一行是工具栏 (左侧操作按钮, 右侧条数), 下面是筛选条件 (写入地址栏)。
 * 不传 filters 时只显示工具栏。
 */
export default function FilterCard({ filters, initial, toolbar, total, unit = '条', children }: {
  filters?: ReturnType<typeof useFilters>
  initial?: Record<string, unknown>
  toolbar?: ReactNode
  total?: number
  unit?: string
  children?: ReactNode
}) {
  return (
    <Card className="filter-card mb16" size="small">
      {(toolbar || total !== undefined) && (
        <div className="filter-toolbar">
          <Space wrap>{toolbar}</Space>
          {total !== undefined && <span className="list-total">共 {total} {unit}</span>}
        </div>
      )}
      {filters && (
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
      )}
    </Card>
  )
}

export function FCol(props: ColProps) {
  return <Col xs={12} md={8} xl={4} {...props} />
}
