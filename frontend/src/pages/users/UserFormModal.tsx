import { Button, Checkbox, Col, Form, Input, Row, Select } from 'antd'
import { post, put } from '../../api'
import Async from '../../components/Async'
import FormModal, { ModalActions } from '../../components/FormModal'
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

interface Props {
  open: boolean
  id?: number // 编辑时传入
  onClose: () => void
  onSaved: () => void
}

const ROLE_TIP = (
  <>
    销售员：只能查看和填写自己的拜访、出差、周报、月报；可申请新增客户。<br />
    销售主管：查看所属销售员的全部数据并审批；维护客户名单。<br />
    系统管理员：全部数据、账号管理、操作日志。
  </>
)

export default function UserFormModal({ open, ...rest }: Props) {
  return (
    <FormModal open={open} title={rest.id ? '编辑账号' : '新增账号'} width={680} onClose={rest.onClose}>
      <UserFormLoader {...rest} />
    </FormModal>
  )
}

function UserFormLoader(props: Omit<Props, 'open'>) {
  const state = useApi<FormData>(`/api/users/form?id=${props.id ?? ''}`)
  return <Async state={state} onBack={props.onClose}>{(d) => <UserFormBody data={d} {...props} />}</Async>
}

function UserFormBody({ data, onClose, onSaved }: Omit<Props, 'open' | 'id'> & { data: FormData }) {
  const { session } = useAuth()
  const [form] = Form.useForm()
  const [run, loading] = useAction()
  const role = Form.useWatch('role', form)
  const u = data.user

  const submit = async (values: object) => {
    const body = serialize(values)
    if (await run(() => (u ? put<Result>(`/api/users/${u.id}`, body) : post<Result>('/api/users', body)))) {
      onSaved()
      onClose()
    }
  }

  return (
    <Form form={form} layout="vertical" onFinish={submit} className="form-card"
      initialValues={u ? { ...u, active: !!u.active, manager_id: u.manager_id ?? undefined } : { active: true, role: 'sales' }}>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item label="用户名（登录名）" name="username" rules={[{ required: true, whitespace: true, message: '请填写用户名' }]}>
            <Input autoComplete="off" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="姓名" name="name" rules={[{ required: true, whitespace: true, message: '请填写姓名' }]}><Input /></Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="角色 / 等级" name="role" rules={[{ required: true }]} tooltip={ROLE_TIP}>
            <Select options={Object.entries(session.roles).map(([value, label]) => ({ value, label }))} />
          </Form.Item>
        </Col>
        {role === 'sales' && (
          <Col xs={24} md={12}>
            <Form.Item label="所属主管（审批人）" name="manager_id">
              <Select allowClear placeholder="-- 无 --" options={toOptions(data.managers)} />
            </Form.Item>
          </Col>
        )}
        <Col xs={24} md={12}><Form.Item label="负责区域" name="region"><Input /></Form.Item></Col>
        <Col xs={24} md={12}><Form.Item label="手机" name="phone"><Input /></Form.Item></Col>
        <Col xs={24} md={12}>
          <Form.Item label={u ? '重置密码（留空则不修改）' : '初始密码'} name="password" extra="用户首次登录时须修改密码"
            rules={u ? [] : [{ required: true, message: '请填写初始密码' }, { min: 6, message: '初始密码至少 6 位' }]}>
            <Input autoComplete="new-password" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="状态" name="active" valuePropName="checked"><Checkbox>启用</Checkbox></Form.Item>
        </Col>
        {u && data.owned > 0 && (
          <Col span={24}>
            <Form.Item label={`离职交接：将其负责的 ${data.owned} 家客户改派给`} name="transfer_to"
              extra="员工离职时：取消「启用」并选择接手人，历史拜访记录保留在原销售员名下">
              <Select allowClear placeholder="-- 不改派 --" options={toOptions(data.others)} />
            </Form.Item>
          </Col>
        )}
      </Row>
      <ModalActions>
        <Button onClick={onClose}>取消</Button>
        <Button type="primary" htmlType="submit" loading={loading}>保存</Button>
      </ModalActions>
    </Form>
  )
}
