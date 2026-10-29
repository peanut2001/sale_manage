// 构建后把 JS/CSS 预压缩成 .gz, 由 Flask 按浏览器是否支持 gzip 返回 (体积约为原来的 1/3)
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { constants, gzipSync } from 'node:zlib'

const dir = new URL('../dist/assets/', import.meta.url)
let count = 0
let before = 0
let after = 0
for (const name of readdirSync(dir)) {
  if (!/\.(js|css|svg)$/.test(name)) continue
  const raw = readFileSync(new URL(name, dir))
  if (raw.length < 1024) continue
  const gz = gzipSync(raw, { level: constants.Z_BEST_COMPRESSION })
  writeFileSync(new URL(`${name}.gz`, dir), gz)
  count += 1
  before += raw.length
  after += gz.length
}
console.log(`gzip: ${count} 个文件, ${(before / 1024).toFixed(0)} KB -> ${(after / 1024).toFixed(0)} KB`)
