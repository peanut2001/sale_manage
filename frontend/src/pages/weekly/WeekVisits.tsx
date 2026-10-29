import { Table } from 'antd'
import { Link } from 'react-router'
import Prose from '../../components/Prose'
import { LevelTag } from '../../components/Tags'
import type { Visit } from '../../types'

/** 周报中的本周拜访列表; link 为 true 时客户可点击进入拜访详情 */
export default function WeekVisits({ visits, link = false, empty }: { visits: Visit[]; link?: boolean; empty: string }) {
  return (
    <Table<Visit> rowKey="id" dataSource={visits} pagination={false} size="small" scroll={{ x: 'max-content' }}
      locale={{ emptyText: empty }}
      columns={[
        { title: '日期', dataIndex: 'visit_date', width: 110 },
        {
          title: '客户', dataIndex: 'customer',
          render: (v, r) => <><LevelTag level={r.level} />{link ? <Link to={`/visits/${r.id}`}>{v}</Link> : v}</>,
        },
        { title: '类型', dataIndex: 'visit_type' },
        { title: '洽谈人', dataIndex: 'contact_name', render: (v, r) => `${v} ${link ? r.contact_title : ''}` },
        link
          ? { title: '内容', dataIndex: 'content', width: 360, render: (v) => <Prose text={v} /> }
          : { title: '内容', dataIndex: 'content', ellipsis: true, width: 360 },
      ]} />
  )
}
