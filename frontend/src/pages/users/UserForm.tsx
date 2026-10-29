import { Button, Card, Checkbox, Col, Form, Input, Row, Select } from 'antd'
import { useNavigate, useParams } from 'react-router'
import { post, put } from '../../api'
import Async from '../../components/Async'
import PageHeader from '../../components/PageHeader'
import { useAction, useApi } from '../../hooks'
import { useAuth } from '../../session'
import type { Account, Option, Result } from '../../types'
import { serialize, toOptions } from '../../utils'

interface FormData {
  user: Account | null
  managers: Option[]
  owned: number
  others: Option[]
}

export default function UserForm() {
  const { id } = useParams()
  const state = useApi<FormData>(`/api/users/form?id=${id ?? ''}`)
  return (
    <>
      <PageHeader title={id ? '编辑账号' : '新增账号'} />
      <Async state={state}>{(d) => <UserFormBody data={d} />}</Async>
    </>
  )
}

function UserFormBody({ data }: { data: FormData }) {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [run, loading] = useAction()
  const role = Form.useWatch('role', form)
  const u = data.user

  const submit = async (values: object) => {
    const body = serialize(values)
    if (await run(() => (u ? put<Result>(`/api/users/${u.id}`, body) : post<Result>('/api/users', body)))) navigate('/users')
  }

  return (
    <div className="stack">
      <Card className="form-card">
        <Form form={form} layout="vertical" onFinish={submit}
          initialValues={u ? { ...u, active: !!u.active, manager_id: u.manager_id ?? undefined } : { active: true, role: 'sales' }}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="用户名 (登录名)" name="username" rules={[{ required: true, whitespace: true, message: '请填写用户名' }]}>
                <Input autoComplete="off" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="姓名" name="name" rules={[{ required: true, whitespace: true, message: '请填写姓名' }]}><Input /></Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="角色 / 等级" name="role" rules={[{ required: true }]}>
                <Select options={Object.entries(session.roles).map(([value, label]) => ({ value, label }))} />
              </Form.Item>
            </Col>
            {role === 'sales' && (
              <Col xs={24} md={12}>
                <Form.Item label="所属主管 (审批人)" name="manager_id">
                  <Select allowClear placeholder="-- 无 --" options={toOptions(data.managers)} />
                </Form.Item>
              </Col>
            )}
            <Col xs={24} md={12}><Form.Item label="负责区域" name="region"><Input /></Form.Item></Col>
            <Col xs={24} md={12}><Form.Item label="手机" name="phone"><Input /></Form.Item></Col>
            <Col xs={24} md={12}>
              <Form.Item label={u ? '重置密码 (留空则不修改)' : '初始密码'} name="password" extra="用户首次登录时须修改密码"
                rules={u ? [] : [{ required: true, message: '请填写初始密码' }, { min: 6, message: '初始密码至少 6 位' }]}>
                <Input autoComplete="new-password" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="状态" name="active" valuePropName="checked"><Checkbox>启用</Checkbox></Form.Item>
            </Col>
            {u && data.owned > 0 && (
              <Col span={24}>
                <Form.Item label={`离职交接: 将其负责的 ${data.owned} 家客户改派给`} name="transfer_to"
                  extra='员工离职时: 取消"启用"并选择接手人, 历史拜访记录保留在原销售员名下'>
                  <Select allowClear placeholder="-- 不改派 --" options={toOptions(data.others)} />
                </Form.Item>
              </Col>
            )}
          </Row>
          <div className="form-actions">
            <Button type="primary" htmlType="submit" loading={loading}>保存</Button>
            <Button onClick={() => navigate('/users')}>取消</Button>
          </div>
        </Form>
      </Card>
      <Card size="small" title="权限说明" className="hint">
        <p>销售员: 只能查看和填写自己的拜访、出差、周报、月报; 可申请新增客户。</p>
        <p>销售主管: 查看所属销售员的全部数据并审批; 维护客户名单。</p>
        <p style={{ marginBottom: 0 }}>系统管理员: 全部数据、账号管理、操作日志。</p>
      </Card>
    </div>
  )
}
