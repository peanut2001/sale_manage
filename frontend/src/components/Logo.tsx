import { useId } from 'react'

const STOPS = {
  normal: [['#7cc8ff', '#3d8bff'], ['#3a7bff', '#1d4fe0']],
  light: [['#ffffff', '#cfe6ff'], ['#e3f0ff', '#8ec0ff']], // 用在蓝色背景上
}

/** S 形标志, 与 public/favicon.svg 一致 */
export default function Logo({ size = 32, light = false }: { size?: number; light?: boolean }) {
  const id = useId()
  const [a, b] = STOPS[light ? 'light' : 'normal']
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}a`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={a[0]} />
          <stop offset="1" stopColor={a[1]} />
        </linearGradient>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={b[0]} />
          <stop offset="1" stopColor={b[1]} />
        </linearGradient>
      </defs>
      <path d="M38 9.5C34.8 6.6 30.2 5 24.8 5 17.2 5 11.5 9 11.5 15c0 5.6 4.5 8 12 9.5"
        fill="none" stroke={`url(#${id}a)`} strokeWidth="8.5" strokeLinecap="round" />
      <path d="M23.5 24.5c7.5 1.5 13 4 13 9.5 0 6-5.7 9-13.3 9-5.4 0-10-1.6-13.2-4.5"
        fill="none" stroke={`url(#${id}b)`} strokeWidth="8.5" strokeLinecap="round" />
    </svg>
  )
}
