import { Avatar } from 'antd'
import type { User } from '../types'

/** 用户头像: 未上传 (或图片加载失败) 时显示姓名首字; 地址带版本号, 换头像后自动刷新 */
export default function UserAvatar({ user, size }: { user: Pick<User, 'id' | 'name' | 'avatar'>; size: number }) {
  return (
    <Avatar size={size} className="user-avatar"
      src={user.avatar ? `/api/avatar/${user.id}?v=${encodeURIComponent(user.avatar)}` : undefined}>
      {user.name.slice(0, 1)}
    </Avatar>
  )
}
