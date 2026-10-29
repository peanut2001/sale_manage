// 各页面按需加载; 登录后空闲时预加载, 首次进入页面无需再等代码下载
export const pageLoaders = {
  Login: () => import('./pages/Login'),
  Dashboard: () => import('./pages/Dashboard'),
  Password: () => import('./pages/Password'),
  VisitList: () => import('./pages/visits/VisitList'),
  VisitDetail: () => import('./pages/visits/VisitDetail'),
  TripList: () => import('./pages/trips/TripList'),
  TripDetail: () => import('./pages/trips/TripDetail'),
  WeeklyList: () => import('./pages/weekly/WeeklyList'),
  WeeklyDetail: () => import('./pages/weekly/WeeklyDetail'),
  MonthlyList: () => import('./pages/monthly/MonthlyList'),
  MonthlyDetail: () => import('./pages/monthly/MonthlyDetail'),
  Approvals: () => import('./pages/Approvals'),
  CustomerList: () => import('./pages/customers/CustomerList'),
  CustomerDetail: () => import('./pages/customers/CustomerDetail'),
  Stats: () => import('./pages/Stats'),
  UserList: () => import('./pages/users/UserList'),
  Logs: () => import('./pages/Logs'),
  NotFound: () => import('./pages/NotFound'),
}

export function prefetchPages() {
  Object.values(pageLoaders).forEach((load) => void load().catch(() => {}))
}
