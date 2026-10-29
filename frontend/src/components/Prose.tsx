/** 保留换行的多行文本, 空值显示占位符 */
export default function Prose({ text, empty = '-' }: { text?: string | null; empty?: string }) {
  return <div className="prose">{text || empty}</div>
}
