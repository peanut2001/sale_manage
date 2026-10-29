import { Button, Result } from 'antd'
import { useNavigate } from 'react-router'

export default function NotFound() {
  const navigate = useNavigate()
  return <Result status="404" title="页面不存在" extra={<Button type="primary" onClick={() => navigate('/')}>返回首页</Button>} />
}
