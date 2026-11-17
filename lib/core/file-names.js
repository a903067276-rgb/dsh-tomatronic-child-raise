/** 档案文件名规则：新档案的顶层文件统一带小名，如 宝宝-日常记录.md。
 * 旧文件保持可读：查找时同时接受不带前缀的原名。
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export function safeChildName(name) {
  return String(name || '').replace(/[\\/:*?"<>|]/g, '').trim() || '孩子'
}

export function scopedBaseName(childName, base) {
  const raw = String(base || '').replace(/\.md$/i, '')
  if (!raw) return ''
  if (raw.includes('/') || raw.startsWith('档案-') || raw === 'README' || raw.startsWith('.')) return raw + '.md'
  return safeChildName(childName) + '-' + raw + '.md'
}

export function baseNameOf(fileName) {
  return String(fileName || '').replace(/\.md$/i, '')
}

export function matchesBase(fileName, base) {
  const n = baseNameOf(fileName)
  const b = String(base || '').replace(/\.md$/i, '')
  return n === b || n.endsWith('-' + b) || n.includes('-' + b)
}

export function docPath(docs, childName, base) {
  const scoped = join(docs, scopedBaseName(childName, base))
  const legacy = join(docs, String(base).replace(/\.md$/i, '') + '.md')
  // 旧文件已有数据时优先旧文件，避免被新建的“只有表头”的前缀文件抢走。
  if (existsSync(legacy)) return legacy
  if (existsSync(scoped)) return scoped
  return scoped
}
