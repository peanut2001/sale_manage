import { Button, Result, Skeleton } from 'antd'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import type { ApiState } from '../hooks'

/** 统一处理加载中 / 出错, 数据就绪后渲染 children; onBack 用于弹窗中出错时关闭弹窗 */
export default function Async<T>({ state, onBack, children }: {
  state: ApiState<T>
  onBack?: () => void
  children: (data: T) => ReactNode
}) {
  const navigate = useNavigate()
  if (state.error && state.error.status !== 401) {
    const code = state.error.status
    return (
      <Result status={code === 403 ? '403' : code === 404 ? '404' : 'error'} title={state.error.message}
        extra={<Button onClick={onBack ?? (() => navigate(-1))}>{onBack ? '关闭' : '返回'}</Button>} />
    )
  }
  if (!state.data) return <Skeleton active className="page-skeleton" />
  return <>{children(state.data)}</>
}
