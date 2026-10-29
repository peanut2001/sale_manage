import { Alert, Button, Card, Form, Input } from 'antd'
import { useNavigate } from 'react-router'
import { post } from '../api'
import { useAction } from '../hooks'
import { useAuth, useMe } from '../session'
import type { Result } from '../types'

interface PasswordForm {
  old: string
  new: string
  new2: string
}

export default function Password() {
  const { refresh } = useAuth()
  const { me } = useMe()
  const navigate = useNavigate()
  const [run, loading] = useAction()

  const submit = async (values: PasswordForm) => {
    if (await run(() => post<Result>('/api/password', { ...values }))) {
      await refresh()
      navigate('/')
    }
  }

  return (
    <>
      <Card style={{ maxWidth: 480 }}>
        {!!me.must_change_pw && (
          <Alert type="warning" showIcon title="首次登录或密码被重置，请先修改密码"
            description="修改完成后才能使用其他功能" style={{ marginBottom: 20 }} />
        )}
        <Form<PasswordForm> layout="vertical" onFinish={submit} requiredMark={false}>
          <Form.Item label="原密码" name="old" rules={[{ required: true, message: '请输入原密码' }]}>
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Form.Item label="新密码" name="new" extra="至少 8 位，同时包含字母和数字"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 8, message: '新密码至少 8 位' },
              { pattern: /^(?=.*\d)(?=.*\D)/, message: '需同时包含字母和数字' },
            ]}>
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item label="确认新密码" name="new2" dependencies={['new']}
            rules={[
              { required: true, message: '请再次输入新密码' },
              ({ getFieldValue }) => ({
                validator: (_, v) => (!v || v === getFieldValue('new') ? Promise.resolve() : Promise.reject(new Error('两次输入的新密码不一致'))),
              }),
            ]}>
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>保存</Button>
        </Form>
      </Card>
    </>
  )
}
