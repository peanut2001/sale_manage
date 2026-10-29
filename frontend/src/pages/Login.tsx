import { ArrowRightOutlined, AuditOutlined, BarChartOutlined, CarOutlined, LockOutlined, SolutionOutlined, UserOutlined } from '@ant-design/icons'
import { Alert, Button, Checkbox, Form, Input, Popover } from 'antd'
import { useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router'
import { post } from '../api'
import bg from '../assets/login-bg.jpg'
import Logo from '../components/Logo'
import { useAuth } from '../session'
import './Login.css'

const FEATURES = [
  { icon: <SolutionOutlined />, title: '拜访记录', sub: '沉淀客户与洽谈' },
  { icon: <CarOutlined />, title: '出差报告', sub: '行程费用留痕' },
  { icon: <BarChartOutlined />, title: '周报月报', sub: '自动统计分析' },
  { icon: <AuditOutlined />, title: '主管审批', sub: '意见全程留存' },
]
const SLOGANS = ['高效外勤', '精细管理', '数据驱动', '成就业绩']
const TAGLINE = '客户拜访、出差报告、周报月报一体化管理'

interface LoginForm {
  username: string
  password: string
  remember: boolean
}

export default function Login() {
  const { session, refresh } = useAuth()
  const navigate = useNavigate()
  const next = useSearchParams()[0].get('next') ?? ''
  const target = next.startsWith('/') && !next.startsWith('//') ? next : '/'
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (session.user) return <Navigate to={target} replace />

  const submit = async (values: LoginForm) => {
    setLoading(true)
    setError('')
    try {
      await post('/api/login', { ...values })
      await refresh()
      navigate(target, { replace: true })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-hero" style={{ backgroundImage: `url(${bg})` }} />
      <header className="login-top">
        <div className="login-brand"><Logo size={36} light /><span>销售拜访管理系统</span></div>
        <nav className="login-slogans">{SLOGANS.map((s) => <span key={s}>{s}</span>)}</nav>
      </header>

      <section className="login-intro">
        <h1>销售拜访管理系统</h1>
        <p>{TAGLINE}</p>
        <ul className="login-features">
          {FEATURES.map((f) => (
            <li key={f.title}>
              <span className="login-feature-icon">{f.icon}</span>
              <div><b>{f.title}</b><small>{f.sub}</small></div>
            </li>
          ))}
        </ul>
      </section>

      <main className="login-card-wrap">
        <div className="login-card">
          <Logo size={60} />
          <h2>销售拜访管理系统</h2>
          <p className="login-card-sub">{TAGLINE}</p>
          {error && <Alert type="error" showIcon title={error} className="login-error" />}
          <Form<LoginForm> layout="vertical" requiredMark={false} size="large" onFinish={submit}
            initialValues={{ remember: true }}>
            <Form.Item label="用户名" name="username" rules={[{ required: true, whitespace: true, message: '请输入用户名' }]}>
              <Input prefix={<UserOutlined />} placeholder="请输入用户名" autoComplete="username" autoFocus />
            </Form.Item>
            <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" autoComplete="current-password" />
            </Form.Item>
            <div className="login-row">
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>记住我</Checkbox>
              </Form.Item>
              <Popover trigger="click" placement="topRight"
                content="请联系系统管理员在「账号管理」中重置密码，重置后首次登录需修改密码">
                <a role="button" tabIndex={0}>忘记密码？</a>
              </Popover>
            </div>
            <Button type="primary" htmlType="submit" block loading={loading} className="login-btn">
              登录 {!loading && <ArrowRightOutlined />}
            </Button>
          </Form>
          <footer className="login-footer">
            <span>© {session.today.slice(0, 4)} 销售拜访管理系统</span><i>|</i><span>用数字化助力销售业绩增长</span>
          </footer>
        </div>
      </main>
    </div>
  )
}
