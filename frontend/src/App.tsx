import { App as AntApp, ConfigProvider, Spin } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { lazy, Suspense, type ReactElement } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'
import AppLayout, { RoleRoute } from './components/AppLayout'
import AuthProvider from './components/AuthProvider'
import { theme } from './theme'
import type { Role } from './types'

// 按页面拆分打包, 登录页只加载自己需要的部分
const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Password = lazy(() => import('./pages/Password'))
const VisitList = lazy(() => import('./pages/visits/VisitList'))
const VisitForm = lazy(() => import('./pages/visits/VisitForm'))
const VisitDetail = lazy(() => import('./pages/visits/VisitDetail'))
const TripList = lazy(() => import('./pages/trips/TripList'))
const TripForm = lazy(() => import('./pages/trips/TripForm'))
const TripDetail = lazy(() => import('./pages/trips/TripDetail'))
const WeeklyList = lazy(() => import('./pages/weekly/WeeklyList'))
const WeeklyForm = lazy(() => import('./pages/weekly/WeeklyForm'))
const WeeklyDetail = lazy(() => import('./pages/weekly/WeeklyDetail'))
const MonthlyList = lazy(() => import('./pages/monthly/MonthlyList'))
const MonthlyDetail = lazy(() => import('./pages/monthly/MonthlyDetail'))
const Approvals = lazy(() => import('./pages/Approvals'))
const CustomerList = lazy(() => import('./pages/customers/CustomerList'))
const CustomerForm = lazy(() => import('./pages/customers/CustomerForm'))
const CustomerDetail = lazy(() => import('./pages/customers/CustomerDetail'))
const Stats = lazy(() => import('./pages/Stats'))
const UserList = lazy(() => import('./pages/users/UserList'))
const UserForm = lazy(() => import('./pages/users/UserForm'))
const Logs = lazy(() => import('./pages/Logs'))
const NotFound = lazy(() => import('./pages/NotFound'))

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
                  <Route path="visits/new" element={<VisitForm />} />
                  <Route path="visits/:id" element={<VisitDetail />} />
                  <Route path="visits/:id/edit" element={<VisitForm />} />
                  <Route path="trips" element={<TripList />} />
                  <Route path="trips/new" element={<TripForm />} />
                  <Route path="trips/:id" element={<TripDetail />} />
                  <Route path="trips/:id/edit" element={<TripForm />} />
                  <Route path="weekly" element={<WeeklyList />} />
                  <Route path="weekly/new" element={<WeeklyForm />} />
                  <Route path="weekly/:id" element={<WeeklyDetail />} />
                  <Route path="weekly/:id/edit" element={<WeeklyForm />} />
                  <Route path="monthly" element={<MonthlyList />} />
                  <Route path="monthly/:id" element={<MonthlyDetail />} />
                  <Route path="approvals" element={only(MANAGERS, <Approvals />)} />
                  <Route path="customers" element={<CustomerList />} />
                  <Route path="customers/new" element={<CustomerForm />} />
                  <Route path="customers/:id" element={<CustomerDetail />} />
                  <Route path="customers/:id/edit" element={<CustomerForm />} />
                  <Route path="stats" element={<Stats />} />
                  <Route path="users" element={only(ADMIN, <UserList />)} />
                  <Route path="users/new" element={only(ADMIN, <UserForm />)} />
                  <Route path="users/:id/edit" element={only(ADMIN, <UserForm />)} />
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
