import { App as AntApp, ConfigProvider, Spin } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { lazy, Suspense, type ReactElement } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'
import AppLayout, { RoleRoute } from './components/AppLayout'
import AuthProvider from './components/AuthProvider'
import { pageLoaders } from './routes'
import { theme } from './theme'
import type { Role } from './types'

// 按页面拆分打包, 登录页只加载自己需要的部分 (加载器见 routes.ts)
const Login = lazy(pageLoaders.Login)
const Dashboard = lazy(pageLoaders.Dashboard)
const Password = lazy(pageLoaders.Password)
const VisitList = lazy(pageLoaders.VisitList)
const VisitDetail = lazy(pageLoaders.VisitDetail)
const TripList = lazy(pageLoaders.TripList)
const TripDetail = lazy(pageLoaders.TripDetail)
const WeeklyList = lazy(pageLoaders.WeeklyList)
const WeeklyDetail = lazy(pageLoaders.WeeklyDetail)
const MonthlyList = lazy(pageLoaders.MonthlyList)
const MonthlyDetail = lazy(pageLoaders.MonthlyDetail)
const Approvals = lazy(pageLoaders.Approvals)
const CustomerList = lazy(pageLoaders.CustomerList)
const CustomerDetail = lazy(pageLoaders.CustomerDetail)
const Stats = lazy(pageLoaders.Stats)
const UserList = lazy(pageLoaders.UserList)
const Logs = lazy(pageLoaders.Logs)
const NotFound = lazy(pageLoaders.NotFound)

const only = (roles: Role[], el: ReactElement) => <RoleRoute roles={roles}>{el}</RoleRoute>
const MANAGERS: Role[] = ['manager', 'admin']
const ADMIN: Role[] = ['admin']

export default function App() {
  return (
    <ConfigProvider locale={zhCN} theme={theme} button={{ autoInsertSpace: false }}>
      <AntApp>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<Spin size="large" fullscreen />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route element={<AppLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="password" element={<Password />} />
                  <Route path="visits" element={<VisitList />} />
                  <Route path="visits/:id" element={<VisitDetail />} />
                  <Route path="trips" element={<TripList />} />
                  <Route path="trips/:id" element={<TripDetail />} />
                  <Route path="weekly" element={<WeeklyList />} />
                  <Route path="weekly/:id" element={<WeeklyDetail />} />
                  <Route path="monthly" element={<MonthlyList />} />
                  <Route path="monthly/:id" element={<MonthlyDetail />} />
                  <Route path="approvals" element={only(MANAGERS, <Approvals />)} />
                  <Route path="customers" element={<CustomerList />} />
                  <Route path="customers/:id" element={<CustomerDetail />} />
                  <Route path="stats" element={<Stats />} />
                  <Route path="users" element={only(ADMIN, <UserList />)} />
                  <Route path="logs" element={only(ADMIN, <Logs />)} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </AntApp>
    </ConfigProvider>
  )
}
