import { Tag } from 'antd'
import { useAuth } from '../session'
import type { Level } from '../types'

const COLORS: Record<string, string> = { gray: 'default', blue: 'blue', orange: 'orange', green: 'green', red: 'red' }

export function StatusTag({ status }: { status: string }) {
  const [label, color] = useAuth().session.status[status] ?? [status, 'gray']
  return <Tag variant="filled" color={COLORS[color]}>{label}</Tag>
}

const LEVEL_COLORS: Record<Level, string> = { A: 'red', B: 'blue', C: 'default' }

export function LevelTag({ level }: { level: Level }) {
  return <Tag variant="filled" color={LEVEL_COLORS[level]} className="level-tag">{level}</Tag>
}
