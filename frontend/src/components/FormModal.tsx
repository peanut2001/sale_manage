import { Modal } from 'antd'
import type { ReactNode } from 'react'

/** 新增/修改用的弹窗: 右上角或 Esc 关闭; 点遮罩不关闭, 避免误触丢失已填内容; 关闭后销毁表单 */
export default function FormModal({ open, title, width = 720, onClose, children }: {
  open: boolean
  title: ReactNode
  width?: number
  onClose: () => void
  children: ReactNode
}) {
  return (
    <Modal open={open} title={title} onCancel={onClose} footer={null} destroyOnHidden
      mask={{ closable: false }} width={{ xs: '96%', md: width }} className="form-modal">
      {children}
    </Modal>
  )
}

/** 弹窗底部按钮栏 */
export function ModalActions({ children }: { children: ReactNode }) {
  return <div className="modal-actions">{children}</div>
}
