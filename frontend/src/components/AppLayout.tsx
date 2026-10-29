import {
  AuditOutlined, BarChartOutlined, CalendarOutlined, CarOutlined, ContactsOutlined, FileTextOutlined,
  HistoryOutlined, HomeOutlined, LockOutlined, LogoutOutlined, MenuFoldOutlined, MenuOutlined, MenuUnfoldOutlined,
  SolutionOutlined, TeamOutlined,
} from '@ant-design/icons'
import { Avatar, Badge, Button, Drawer, Dropdown, Grid, Layout, Menu, Result, Skeleton, Tag, Tooltip } from 'antd'
import { Suspense, useEffect, useState, type ReactNode } from 'react'
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router'
import { post } from '../api'
import { prefetchPages } from '../routes'
import { hasRole, useAuth } from '../session'
import type { Role } from '../types'
import Logo from './Logo'

const COLLAPSED_KEY = 'sider-collapsed'

// tip: 侧边栏悬浮提示 (页面不再显示标题)
const NAV: { key: string; icon: ReactNode; label: string; tip: string; roles?: Role[] }[] = [
  { key: '/', icon: <HomeOutlined />, label: '首页', tip: '首页：本月概况、近期拜访和待跟进事项' },
  { key: '/visits', icon: <SolutionOutlined />, label: '拜访记录', tip: '客户拜访记录：填写和查询每次拜访' },
  { key: '/trips', icon: <CarOutlined />, label: '出差报告', tip: '出差报告：行程、费用和出差期间的拜访' },
  { key: '/weekly', icon: <FileTextOutlined />, label: '周报', tip: '销售周报：每周工作总结与下周计划' },
  { key: '/monthly', icon: <CalendarOutlined />, label: '月度报告', tip: '月度出差报告：每月结束后自动生成上月统计与分析' },
  { key: '/customers', icon: <ContactsOutlined />, label: '客户名单', tip: '客户名单：客户资料、联系人和拜访历史' },
  { key: '/stats', icon: <BarChartOutlined />, label: '统计分析', tip: '统计分析：按销售员、客户、类型汇总，可导出 Excel' },
  { key: '/approvals', icon: <AuditOutlined />, label: '待审批', tip: '待我审批：出差报告、周报和月度报告', roles: ['manager', 'admin'] },
  { key: '/users', icon: <TeamOutlined />, label: '账号管理', tip: '账号管理：开户、角色和离职交接', roles: ['admin'] },
  { key: '/logs', icon: <HistoryOutlined />, label: '操作日志', tip: '操作日志：最近 300 条操作记录', roles: ['admin'] },
]

export default function AppLayout() {
  const { session, refresh } = useAuth()
  const loc = useLocation()
  const navigate = useNavigate()
  const mobile = Grid.useBreakpoint().lg === false
  const [drawer, setDrawer] = useState(false)
  // 桌面端侧边栏收起后只显示图标; 记住用户的选择
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSED_KEY) === '1')
  const toggleSider = (c: boolean) => {
    setCollapsed(c)
    localStorage.setItem(COLLAPSED_KEY, c ? '1' : '0')
  }

  // 进入系统后空闲时预加载其他页面的代码
  useEffect(() => {
    const t = window.setTimeout(prefetchPages, 1500)
    return () => window.clearTimeout(t)
  }, [])

  const user = session.user
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />
  if (user.must_change_pw && loc.pathname !== '/password') return <Navigate to="/password" replace />

  // 首次登录或密码被重置: 改密码前其他页面不可用, 菜单置灰
  const locked = !!user.must_change_pw
  const selected = '/' + loc.pathname.split('/')[1]
  const mini = !mobile && collapsed
  const menu = (
    <Menu mode="inline" selectedKeys={[selected]} className="app-menu"
      onClick={({ key }) => {
        setDrawer(false)
        if (key !== loc.pathname) navigate(key)
      }}
      items={NAV.filter((n) => hasRole(user.role, n.roles)).map((n) => {
        const tip = locked ? '请先修改密码' : n.tip
        const badge = n.key === '/approvals' && session.pending_count > 0
        const label = (
          <span className="menu-label">
            {n.label}
            {badge && <Badge count={session.pending_count} size="small" className="menu-badge" />}
          </span>
        )
        return {
          key: n.key,
          // 收起后看不到数字, 在图标上显示红点
          icon: mini && badge ? <Badge dot offset={[2, 2]}>{n.icon}</Badge> : n.icon,
          disabled: locked,
          title: tip, // 收起时由菜单自带的悬浮提示显示
          // 展开时自己加悬浮提示; 手机端菜单在抽屉里, 不需要
          label: mini || mobile ? label : <Tooltip title={tip} placement="right" mouseEnterDelay={0.3}>{label}</Tooltip>,
        }
      })}
    />
  )
  const brand = (
    <Link to="/" className="app-brand">
      <Logo size={30} />
      <span>销售拜访管理系统</span>
    </Link>
  )
  // 桌面端顶部: Logo + 系统名 + 收起按钮; 收起后只剩展开按钮
  const siderHead = (
    <div className={mini ? 'sider-head mini' : 'sider-head'}>
      {!mini && brand}
      <Tooltip title={mini ? '展开菜单' : '收起菜单'} placement="right">
        <Button type="text" className="sider-toggle" aria-label={mini ? '展开菜单' : '收起菜单'}
          icon={mini ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => toggleSider(!collapsed)} />
      </Tooltip>
    </div>
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
        <Layout.Sider width={232} collapsedWidth={72} collapsible collapsed={collapsed} trigger={null}
          className="app-sider no-print">
          {siderHead}
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
