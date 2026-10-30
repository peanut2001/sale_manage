import { LockOutlined, UploadOutlined } from '@ant-design/icons'
import { App, Button, Card, Col, Descriptions, Popconfirm, Row, Space, Tag, Typography, Upload } from 'antd'
import { useNavigate } from 'react-router'
import { del, post, put } from '../api'
import Async from '../components/Async'
import UserAvatar from '../components/UserAvatar'
import { useAction, useApi } from '../hooks'
import { useAuth, useMe } from '../session'
import type { Result, Role } from '../types'

interface ProfileData {
  username: string
  name: string
  role: Role
  region: string
  phone: string
  created_at: string
  manager_name: string | null
}

const AVATAR_SIZE = 256

/** 居中裁成正方形, 缩放到 256x256 并压缩为 JPEG (透明部分填白色), 上传后约 10~30KB */
async function toAvatar(file: File): Promise<Blob> {
  const img = await createImageBitmap(file)
  const side = Math.min(img.width, img.height)
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = AVATAR_SIZE
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, AVATAR_SIZE, AVATAR_SIZE)
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE)
  img.close()
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('图片处理失败'))), 'image/jpeg', 0.88))
}

export default function Profile() {
  const state = useApi<ProfileData>('/api/profile')
  return <Async state={state}>{(p) => <ProfileBody p={p} reload={state.reload} />}</Async>
}

function ProfileBody({ p, reload }: { p: ProfileData; reload: () => void }) {
  const { refresh } = useAuth()
  const { me, roleName } = useMe()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [run, loading] = useAction()

  const upload = async (file: File) => {
    let blob: Blob
    try {
      blob = await toAvatar(file)
    } catch {
      message.error('无法读取该图片，请选择 JPG、PNG 等常见格式的图片')
      return
    }
    const fd = new FormData()
    fd.append('file', blob, 'avatar.jpg')
    if (await run(() => post<Result>('/api/profile/avatar', fd))) await refresh()
  }
  const remove = async () => {
    if (await run(() => del<Result>('/api/profile/avatar'))) await refresh()
  }
  const savePhone = async (value: string) => {
    const phone = value.trim()
    if (phone !== p.phone && (await run(() => put<Result>('/api/profile', { phone })))) reload()
  }

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={8} xxl={6}>
        <Card className="full-height">
          <div className="profile-card">
            <UserAvatar user={me} size={96} />
            <div className="profile-name">{p.name}</div>
            <Tag color="blue" variant="filled">{roleName}</Tag>
            <div className="hint">用户名 {p.username} · {p.created_at.slice(0, 10)} 开通</div>
            <Space wrap className="profile-actions">
              <Upload accept="image/*" showUploadList={false} beforeUpload={(f) => (void upload(f), false)}>
                <Button color="primary" variant="filled" icon={<UploadOutlined />} loading={loading}>
                  {me.avatar ? '更换头像' : '上传头像'}
                </Button>
              </Upload>
              {me.avatar && (
                <Popconfirm title="确定移除头像？" onConfirm={remove}>
                  <Button type="text">移除</Button>
                </Popconfirm>
              )}
            </Space>
            <div className="hint">支持 JPG、PNG 等格式，自动居中裁剪为正方形</div>
          </div>
        </Card>
      </Col>
      <Col xs={24} lg={16} xxl={18}>
        <Card title="基本资料" className="mb16">
          <Descriptions column={{ xs: 1, md: 2 }} items={[
            { label: '姓名', children: p.name },
            { label: '用户名', children: p.username },
            { label: '角色', children: roleName },
            ...(p.role === 'sales' ? [{ label: '所属主管', children: p.manager_name || '未设置' }] : []),
            { label: '负责地区', children: p.region || '未设置' },
            {
              label: '手机号',
              children: (
                <Typography.Text editable={{ text: p.phone, onChange: savePhone, maxLength: 20, tooltip: '修改手机号' }}>
                  {p.phone || <span className="hint">未填写</span>}
                </Typography.Text>
              ),
            },
          ]} />
          <div className="hint profile-note">姓名、角色、地区由管理员维护，如需修改请联系管理员。</div>
        </Card>

        <Card title="账号安全">
          <div className="profile-row">
            <div>
              <div>登录密码</div>
              <div className="hint">建议定期更换；新密码至少 8 位，同时包含字母和数字</div>
            </div>
            <Button icon={<LockOutlined />} onClick={() => navigate('/password')}>修改密码</Button>
          </div>
        </Card>
      </Col>
    </Row>
  )
}
