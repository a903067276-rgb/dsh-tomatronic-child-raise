/**
 * dsh-tomatronic-child-raise — 档案层
 *
 * 只做两件事：
 * 1. 读：把 child-raise 那套 markdown（档案 / 生长数据 / 时间线 / 待补 / 发展评估）解析成结构化数据；
 * 2. 写：按档案原有格式追加一行（时间线 / 生长表 / 勾待补），不重排、不覆盖别的内容。
 *
 * 纯函数为主（除了 readArchive / commitArchive 碰磁盘），方便单测。
 */
import { execFile } from 'node:child_process'
import { matchesBase } from './file-names.js'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const ARCHIVE_CACHE = new Map()
function readCached(path) {
  try {
    const st = statSync(path)
    const old = ARCHIVE_CACHE.get(path)
    if (old && old.mtimeMs === st.mtimeMs && old.size === st.size) return { content: old.content, mtimeMs: st.mtimeMs }
    const content = readFileSync(path, 'utf8')
    ARCHIVE_CACHE.set(path, { content, mtimeMs: st.mtimeMs, size: st.size })
    if (ARCHIVE_CACHE.size > 2000) ARCHIVE_CACHE.delete(ARCHIVE_CACHE.keys().next().value)
    return { content, mtimeMs: st.mtimeMs }
  } catch { return { content: '', mtimeMs: 0 } }
}

export const FILE_NAMES = {
  growth: '数据-生长与健康.md',
  timeline: '时间线.md',
  milestone: '里程碑.md',
  todos: '待补清单.md',
  assessment: '发展评估.md',
  sources: '资料索引.md',
  privacy: '隐私与脱敏规则.md',
  standards: '发展标准与教育方式.md',
}

/** 展开 ~ 前缀并去掉尾部斜杠。 */
export function expandHome(dir) {
  const t = String(dir == null ? '' : dir).trim()
  if (t === '') return ''
  if (t === '~') return homedir()
  if (t.startsWith('~/')) return join(homedir(), t.slice(2))
  return t
}

// ── 日期 / 月龄 ─────────────────────────────────────────────────────────────

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/

/** 严格解析 YYYY-MM-DD；非法返回 undefined（避免 new Date('2026-02-30') 悄悄变 3 月）。 */
export function parseISODate(text) {
  const m = DATE_RE.exec(String(text == null ? '' : text).trim())
  if (m === null) return undefined
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  const probe = new Date(Date.UTC(y, mo - 1, d))
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== mo - 1 || probe.getUTCDate() !== d) return undefined
  return { year: y, month: mo, day: d }
}

const DAY_MS = 24 * 60 * 60 * 1000

function utcMs(y, m, d) {
  return Date.UTC(y, m - 1, d)
}

/** 加 n 个自然月，日超过当月天数时钳到月末（1-31 + 1 月 → 2-28）。 */
function addMonths(y, m, d, n) {
  const total = y * 12 + (m - 1) + n
  const ny = Math.floor(total / 12)
  const nm = (total % 12) + 1
  const lastDay = new Date(Date.UTC(ny, nm, 0)).getUTCDate()
  return { year: ny, month: nm, day: Math.min(d, lastDay) }
}

/**
 * 算月龄（足月）。返回 {months, days, totalDays, text}。
 * text 形如「23 个月 13 天」，满 12 个月时括注岁数。
 */
export function computeAge(birthDate, onDate) {
  const birth = typeof birthDate === 'string' ? parseISODate(birthDate) : birthDate
  const on = typeof onDate === 'string' ? parseISODate(onDate) : onDate
  if (birth === undefined || on === undefined) return undefined
  const onMs = utcMs(on.year, on.month, on.day)
  const birthMs = utcMs(birth.year, birth.month, birth.day)
  const totalDays = Math.floor((onMs - birthMs) / DAY_MS)
  if (totalDays < 0) return { months: 0, days: 0, totalDays, text: '还没出生' }
  let months = (on.year - birth.year) * 12 + (on.month - birth.month)
  if (on.day < birth.day) months -= 1
  if (months < 0) months = 0
  const anchor = addMonths(birth.year, birth.month, birth.day, months)
  const days = Math.floor((onMs - utcMs(anchor.year, anchor.month, anchor.day)) / DAY_MS)
  const text = months >= 12
    ? months + ' 个月 ' + days + ' 天（' + Math.floor(months / 12) + ' 岁 ' + (months % 12) + ' 个月）'
    : months + ' 个月 ' + days + ' 天'
  return { months, days, totalDays, text }
}

/** 今天（本地时区）的 YYYY-MM-DD。 */
export function todayISO(now = new Date()) {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return y + '-' + m + '-' + d
}

/** 档案里的中文日期写法：「11 月 9 日」。 */
export function monthDayLabel(date) {
  return date.month + ' 月 ' + date.day + ' 日'
}

// ── markdown 解析 ───────────────────────────────────────────────────────────

const TABLE_ROW_RE = /^\s*\|.*\|\s*$/
const SEPARATOR_RE = /^\s*\|[\s:|-]+\|\s*$/

function isTableRow(line) {
  return TABLE_ROW_RE.test(line)
}

function tableCells(line) {
  const t = line.trim()
  const inner = t.startsWith('|') ? t.slice(1) : t
  const body = inner.endsWith('|') ? inner.slice(0, -1) : inner
  return body.split('|').map((c) => c.trim())
}

function isSeparator(line) {
  return SEPARATOR_RE.test(line) && line.includes('-')
}

/** 解析所有 markdown 表格：{header, rows:[{cells,line}], headerLine, endLine}。 */
export function parseTables(markdown) {
  const lines = markdown.split('\n')
  const tables = []
  for (let i = 0; i < lines.length - 1; i++) {
    if (!isTableRow(lines[i]) || !isSeparator(lines[i + 1])) continue
    const header = tableCells(lines[i])
    const rows = []
    let j = i + 2
    for (; j < lines.length; j++) {
      if (!isTableRow(lines[j])) break
      rows.push({ cells: tableCells(lines[j]), line: j })
    }
    tables.push({ header, rows, headerLine: i, endLine: j - 1 })
    i = j - 1
  }
  return tables
}

/** 取 `## 标题` 到下一个 `##` 之间的正文（不包含 `###` 子标题的边界）。 */
export function findSection(markdown, titlePrefix) {
  const lines = markdown.split('\n')
  const start = lines.findIndex((l) => l.startsWith('## ') && l.slice(3).trim().startsWith(titlePrefix))
  if (start < 0) return undefined
  let end = lines.length
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].startsWith('## ')) { end = i; break }
  }
  return { start, end, body: lines.slice(start + 1, end).join('\n').trim() }
}

/** 解析时间线：按 `## YYYY` 分年，收集「时间 / 月龄 / 事件 / 出处」表。 */
export function parseTimeline(markdown) {
  const lines = markdown.split('\n')
  const items = []
  let year
  for (let i = 0; i < lines.length; i++) {
    const heading = /^##\s+(\d{4})\s*$/.exec(lines[i])
    if (heading !== null) { year = Number(heading[1]); continue }
    if (!/^\|\s*时间\s*\|/.test(lines[i])) continue
    let j = i + 2
    for (; j < lines.length && isTableRow(lines[j]); j++) {
      const cells = tableCells(lines[j])
      if (cells.length < 4) continue
      if (cells.every((c) => c === '')) continue
      const dayMatch = /^(\d{1,2})\s*月\s*(\d{1,2})\s*日/.exec(cells[0])
      const monthMatch = /^(\d{1,2})\s*月/.exec(cells[0])
      items.push({
        year,
        month: dayMatch !== null ? Number(dayMatch[1]) : (monthMatch !== null ? Number(monthMatch[1]) : undefined),
        day: dayMatch !== null ? Number(dayMatch[2]) : undefined,
        timeLabel: cells[0],
        ageMonths: cells[1],
        text: cells[2],
        source: cells[3],
        line: j,
      })
    }
    i = j - 1
  }
  return items
}

/** 解析生长记录表。 */
export function parseGrowth(markdown) {
  const tables = parseTables(markdown)
  const table = tables.find((t) => t.header[0] === '日期' && t.header.some((h) => h.includes('身高')))
  if (table === undefined) return []
  return table.rows
    .map((row) => ({
      date: row.cells[0],
      ageMonths: row.cells[1],
      height: row.cells[2],
      weight: row.cells[3],
      head: row.cells[4],
      source: row.cells[5],
      note: row.cells[6],
      line: row.line,
    }))
    .filter((r) => parseISODate(r.date) !== undefined)
}

/** 解析待补清单：{sections:[{title, items:[{done,text,line}]}], open, total}。 */
export function parseTodos(markdown) {
  const lines = markdown.split('\n')
  const sections = []
  let current = { title: '未分组', items: [] }
  for (let i = 0; i < lines.length; i++) {
    const h = /^##\s+(.*)$/.exec(lines[i])
    if (h !== null) {
      if (current.items.length > 0) sections.push(current)
      current = { title: h[1].trim(), items: [] }
      continue
    }
    const item = /^\s*-\s*\[( |x|X)\]\s*(.*)$/.exec(lines[i])
    if (item !== null) {
      const text = item[2].trim()
      const dateTime = /^(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2})\s+(.+)$/.exec(text)
      const dateOnly = /^(\d{4}-\d{2}-\d{2})\s+(.+)$/.exec(text)
      const timeOnly = /^(\d{1,2}:\d{2})\s+(.+)$/.exec(text)
      const timed = dateTime || dateOnly || timeOnly
      current.items.push({
        done: item[1].toLowerCase() === 'x', text,
        title: timed ? timed[timed.length - 1].trim() : text,
        date: dateTime ? dateTime[1] : dateOnly ? dateOnly[1] : '',
        time: dateTime ? dateTime[2] : timeOnly ? timeOnly[1] : '', line: i,
      })
    }
  }
  if (current.items.length > 0) sections.push(current)
  let open = 0
  let total = 0
  for (const s of sections) for (const it of s.items) { total++; if (!it.done) open++ }
  return { sections, open, total }
}

// ── 读档案 ─────────────────────────────────────────────────────────────────

/**
 * 读取档案目录。
 * @returns {{ok:boolean, dir:string, error?:string, files:Array, profile?:object, growth?:object, timeline?:object, todos?:object, assessment?:object}}
 */
export function readArchive(archiveDir, childName) {
  const dir = expandHome(archiveDir)
  if (dir === '') return { ok: false, dir, error: '档案目录未配置（设置页「插件」→ child-raise → archiveDir）', files: [] }
  if (!existsSync(dir)) return { ok: false, dir, error: '档案目录不存在：' + dir, files: [] }
  let entries
  try { entries = readdirSync(dir) } catch (e) { return { ok: false, dir, error: '读不了档案目录：' + String(e && e.message ? e.message : e), files: [] } }
  const files = entries
    .filter((n) => n.toLowerCase().endsWith('.md'))
    .map((name) => {
      const path = join(dir, name)
      const hit = readCached(path)
      return { name, path, content: hit.content, mtimeMs: hit.mtimeMs }
    })
    .filter((f) => f.content !== '')
    .sort((a, b) => a.name.localeCompare(b.name, 'zh'))
  if (files.length === 0) return { ok: false, dir, error: '档案目录里没有可读的 .md：' + dir, files: [] }
  const byName = new Map(files.map((f) => [f.name, f]))
  const pick = (name) => (name !== undefined && (byName.get(name) || files.find((f) => matchesBase(f.name, name)))) || undefined
  const profileFile = childName
    ? pick('档案-' + childName + '.md')
    : undefined
  const profileFallback = files.find((f) => /(^|-)档案-.*\.md$/.test(f.name))
  const profile = profileFile !== undefined ? profileFile : profileFallback
  return {
    ok: true,
    dir,
    files,
    profile,
    growth: pick(FILE_NAMES.growth),
    timeline: pick(FILE_NAMES.timeline),
    milestone: pick(FILE_NAMES.milestone),
    todos: pick(FILE_NAMES.todos),
    assessment: pick(FILE_NAMES.assessment),
    sources: pick(FILE_NAMES.sources),
    standards: pick(FILE_NAMES.standards),
  }
}

// ── 写档案 ─────────────────────────────────────────────────────────────────

function cleanCell(value, max = 400) {
  return String(value == null ? '' : value)
    .replace(/\r?\n/g, ' ')
    .replace(/\|/g, '／')
    .trim()
    .slice(0, max)
}

/** 往时间线追加一行；按年份落表，缺年份就新建。 */
export function insertTimelineRow(markdown, input) {
  const lines = markdown.split('\n')
  const year = input.year
  const row = '| ' + cleanCell(monthDayLabel({ month: input.month, day: input.day }), 40)
    + ' | ' + cleanCell(input.ageMonths, 12)
    + ' | ' + cleanCell(input.text)
    + ' | ' + cleanCell(input.source, 80) + ' |'
  const yearLine = lines.findIndex((l) => new RegExp('^##\\s+' + year + '\\s*$').test(l))
  if (yearLine >= 0) {
    const headerIdx = lines.findIndex((l, i) => i > yearLine && /^\|\s*时间\s*\|/.test(l))
    const nextSection = lines.findIndex((l, i) => i > yearLine && /^##\s/.test(l))
    const inYear = nextSection < 0 || (headerIdx >= 0 && headerIdx < nextSection)
    if (headerIdx >= 0 && inYear) {
      let end = headerIdx + 2
      while (end < lines.length && isTableRow(lines[end])) end++
      // 若最后一行是全空占位行，直接替换它，别留空行
      const last = end - 1
      if (last > headerIdx + 1 && isTableRow(lines[last])) {
        const cells = tableCells(lines[last])
        if (cells.every((c) => c === '')) {
          lines[last] = row
          return lines.join('\n')
        }
      }
      lines.splice(end, 0, row)
      return lines.join('\n')
    }
    // 有年份标题但没有表：补一张表
    const block = ['', '| 时间 | 月龄 | 事件 | 出处 |', '|---|---|---|---|', row, '']
    const insertAt = nextSection < 0 ? lines.length : nextSection
    lines.splice(insertAt, 0, ...block)
    return lines.join('\n')
  }
  const block = ['## ' + year, '', '| 时间 | 月龄 | 事件 | 出处 |', '|---|---|---|---|', row, '']
  const pending = lines.findIndex((l) => /^##\s+待补进时间线的事/.test(l))
  if (pending >= 0) lines.splice(pending, 0, ...block)
  else {
    if (lines.length > 0 && lines[lines.length - 1] !== '') lines.push('')
    lines.push(...block)
  }
  return lines.join('\n')
}

/** 往生长记录表追加一行（放在最后一条有内容的记录之后，保留空占位行）。 */
export function insertGrowthRow(markdown, input) {
  const lines = markdown.split('\n')
  const tables = parseTables(markdown)
  const table = tables.find((t) => t.header[0] === '日期' && t.header.some((h) => h.includes('身高')))
  if (table === undefined) return undefined
  let insertAt = table.headerLine + 2
  for (const row of table.rows) {
    if (row.cells.every((c) => c === '')) continue
    insertAt = row.line + 1
  }
  const row = '| ' + cleanCell(input.date, 20)
    + ' | ' + cleanCell(input.ageMonths, 12)
    + ' | ' + cleanCell(input.height, 20)
    + ' | ' + cleanCell(input.weight, 20)
    + ' | ' + cleanCell(input.head, 20)
    + ' | ' + cleanCell(input.source, 60)
    + ' | ' + cleanCell(input.note, 200) + ' |'
  lines.splice(insertAt, 0, row)
  return lines.join('\n')
}

/** 把第一条包含 needle 的未完成待补项勾上。 */
export function markTodoDone(markdown, needle) {
  const lines = markdown.split('\n')
  const text = String(needle == null ? '' : needle).trim()
  if (text === '') return { content: markdown, item: undefined }
  for (let i = 0; i < lines.length; i++) {
    if (!/^\s*-\s*\[ \]/.test(lines[i]) || !lines[i].includes(text)) continue
    lines[i] = lines[i].replace('- [ ]', '- [x]')
    return { content: lines.join('\n'), item: lines[i].replace(/^\s*-\s*\[x\]\s*/, '').trim() }
  }
  return { content: markdown, item: undefined }
}

/** 档案全文关键词检索（文件名 + 正文行），只回命中行。 */
export function searchArchive(archive, query, limit = 20) {
  const q = String(query == null ? '' : query).trim()
  if (q === '') return []
  const needle = q.toLowerCase()
  const hits = []
  for (const file of archive.files) {
    const nameHit = file.name.toLowerCase().includes(needle)
    const lines = file.content.split('\n')
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].toLowerCase().includes(needle)) continue
      hits.push({ file: file.name, line: i + 1, text: lines[i].trim().slice(0, 240), nameHit })
      if (hits.length >= limit) return hits
    }
    if (nameHit && !lines.some((l) => l.toLowerCase().includes(needle))) {
      hits.push({ file: file.name, line: 0, text: '（文件名命中）', nameHit: true })
      if (hits.length >= limit) return hits
    }
  }
  return hits
}

// ── git 提交 ───────────────────────────────────────────────────────────────

/** 档案目录里 git add -A + commit；返回 'ok' | 'no-changes' | 'no-repo' | 'failed:…'。 */
export function commitArchive(dir, message) {
  return new Promise((resolve) => {
    if (!existsSync(join(dir, '.git'))) { resolve('no-repo'); return }
    const run = (args) => new Promise((res) => {
      execFile('git', args, { cwd: dir, timeout: 15000 }, (err, stdout, stderr) => {
        res({ ok: err === null, stdout: String(stdout || ''), stderr: String(stderr || '') })
      })
    })
    run(['add', '-A']).then((added) => {
      if (!added.ok) { resolve('failed:add'); return }
      run(['commit', '-q', '-m', message]).then((committed) => {
        if (committed.ok) { resolve('ok'); return }
        const out = committed.stdout + '\n' + committed.stderr
        if (/nothing to commit|no changes added|nothing added to commit/i.test(out)) resolve('no-changes')
        else resolve('failed:commit')
      })
    })
  })
}

/** 提交结果 → 一句话。 */
export function commitLabel(status) {
  if (status === 'ok') return '已自动 git commit'
  if (status === 'no-changes') return '没有新改动，未提交'
  if (status === 'no-repo') return '档案目录不是 git 仓库，未提交'
  if (typeof status === 'string' && status.startsWith('failed')) return '⚠ 自动提交失败（' + status + '）'
  return ''
}
