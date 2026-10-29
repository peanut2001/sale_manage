/**
 * 单元格内单行省略, 悬停显示全文。
 * 不用 Table 列的 ellipsis: 它会让整张表改为固定列宽, 其他列被平分挤压 (如客户名换行)。
 */
export default function Clip({ text, width }: { text?: string | null; width: number }) {
  return <div className="clip" style={{ maxWidth: width }} title={text ?? ''}>{text}</div>
}
