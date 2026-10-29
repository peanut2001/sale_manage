import {
  AuditOutlined, BarChartOutlined, CalendarOutlined, CarOutlined, ContactsOutlined, FileTextOutlined,
  HistoryOutlined, HomeOutlined, LockOutlined, LogoutOutlined, MenuOutlined, SolutionOutlined, TeamOutlined,
} from '@ant-design/icons'
import { Avatar, Badge, Button, Drawer, Dropdown, Grid, Layout, Menu, Result, Skeleton, Tag } from 'antd'
import { Suspense, useEffect, useState, type ReactNode } from 'react'
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router'
import { post } from '../api'
import { hasRole, useAuth } from '../session'
import type { Role } from '../types'
import Logo from './Logo'

const NAV: { key: string; icon: ReactNode; label: string; roles?: Role[] }[] = [
  { key: '/', icon: <HomeOutlined />, label: '首页' },
  { key: '/visits', icon: <SolutionOutlined />, label: '拜访记录' },
  { key: '/trips', icon: <CarOutlined />, label: '出差报告' },
  { key: '/weekly', icon: <FileTextOutlined />, label: '周报' },
  { key: '/monthly', icon: <CalendarOutlined />, label: '月度报告' },
  { key: '/customers', icon: <ContactsOutlined />, label: '客户名单' },
  { key: '/stats', icon: <BarChartOutlined />, label: '统计分析' },
  { key: '/approvals', icon: <AuditOutlined />, label: '待审批', roles: ['manager', 'admin'] },
  { key: '/users', icon: <TeamOutlined />, label: '账号管理', roles: ['admin'] },
  { key: '/logs', icon: <HistoryOutlined />, label: '操作日志', roles: ['admin'] },
]

export default function AppLayout() {
  const { session, refresh } = useAuth()
  const loc = useLocation()
  const navigate = useNavigate()
  const mobile = Grid.useBreakpoint().lg === false
  const [drawer, setDrawer] = useState(false)

  // 切换页面时刷新登录状态和待审批数
  useEffect(() => {
    void refresh()
  }, [loc.pathname, refresh])

  const user = session.user
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />
  if (user.must_change_pw && loc.pathname !== '/password') return <Navigate to="/password" replace />

  // 首次登录或密码被重置: 改密码前其他页面不可用, 菜单置灰
  const locked = !!user.must_change_pw
  const selected = '/' + loc.pathname.split('/')[1]
  const menu = (
    <Menu mode="inline" selectedKeys={[selected]} className="app-menu" onClick={() => setDrawer(false)}
      items={NAV.filter((n) => hasRole(user.role, n.roles)).map((n) => ({
        key: n.key,
        icon: n.icon,
        disabled: locked,
        label: locked ? n.label : (
          <Link to={n.key}>
            {n.label}
            {n.key === '/approvals' && session.pending_count > 0 && (
              <Badge count={session.pending_count} size="small" className="menu-badge" />
            )}
          </Link>
        ),
      }))}
    />
  )
  const brand = (
    <Link to="/" className="app-brand">
      <Logo size={30} />
      <span>销售拜访管理系统</span>
    </Link>
  )

  const logout = async () => {
    await post('/api/logout').catch(() => undefined)
    await refresh()
    navigate('/login')
  }

  return (
    <Layout className="app-layout">
      {mobile ? (
        <Drawer open={drawer} onClose={() => setDrawer(false)} placement="left" size={240}
          closable={false} styles={{ body: { padding: 0 } }}>
          {brand}
          {menu}
        </Drawer>
      ) : (
        <Layout.Sider width={224} className="app-sider no-print">
          {brand}
          {menu}
        </Layout.Sider>
      )}
      <Layout>
        <Layout.Header className="app-header no-print">
          {mobile && <Button type="text" icon={<MenuOutlined />} onClick={() => setDrawer(true)} aria-label="菜单" />}
          {mobile && <span className="app-brand-mini"><Logo size={24} />销售拜访管理</span>}
          <div className="header-right">
            <Dropdown trigger={['click']} menu={{
              items: [
                { key: 'pw', icon: <LockOutlined />, label: '修改密码', onClick: () => navigate('/password') },
                { type: 'divider' },
                { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true, onClick: logout },
              ],
            }}>
              <button type="button" className="user-chip">
                <Avatar size={32} className="user-avatar">{user.name.slice(0, 1)}</Avatar>
                <span className="user-name">{user.name}</span>
                {!mobile && <Tag variant="filled" color="blue">{session.roles[user.role]}</Tag>}
              </button>
            </Dropdown>
          </div>
        </Layout.Header>
        <Layout.Content className="app-content">
          <Suspense fallback={<Skeleton active className="page-skeleton" />}>
            <Outlet />
          </Suspense>
        </Layout.Content>
      </Layout>
    </Layout>
  )
}

/** 角色不符时显示 403 */
export function RoleRoute({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { session } = useAuth()
  if (!session.user || !roles.includes(session.user.role)) {
    return <Result status="403" title="没有权限访问该页面" extra={<Link to="/">返回首页</Link>} />
  }
  return <>{children}</>
}
