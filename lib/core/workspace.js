/**
 * 工作区：路径、骨架、git。
 * 一个工作区 = 一个孩子的档案；正文在 contentDir（默认 docs）。
 */
import { execFile } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { templates } from './templates.js'
import { parseTables } from './archive.js'
import { scopedBaseName } from './file-names.js'

export function workspacePaths(config) {
  const root = config.workspace
  const docs = join(root, config.contentDir || 'docs')
  return { root, docs }
}


/** 一个总工作区下，每个孩子一个子目录；重名时加 id 后缀。 */
export function childWorkspacePath(root, name, id, children = []) {
  const safe = String(name || '').replace(/[\\/:*?"<>|]/g, '').trim() || String(id || 'child')
  let dir = join(root, safe)
  if ((children || []).some((c) => c.id !== id && c.workspace === dir)) dir = join(root, safe + '-' + String(id).slice(-4))
  return dir
}

export function pregnancyWorkspacePath(root, name, id) {
  const safe = String(name || '').replace(/[\\/:*?"<>|]/g, '').trim() || '孕期'
  return join(root, '孕期-' + safe + (id ? '-' + String(id).slice(-4) : ''))
}

export function inspectWorkspace(config) {
  const { root, docs } = workspacePaths(config)
  const exists = existsSync(root)
  const docsExists = existsSync(docs)
  const archives = docsExists
    ? readdirSync(docs).filter((n) => /^档案-.*\.md$/.test(n))
    : []
  return {
    root,
    docs,
    exists,
    docsExists,
    adopted: archives.length > 0,
    archiveFiles: archives,
    isGit: existsSync(join(root, '.git')),
  }
}

/**
 * 建/接管工作区：只补缺，不覆盖；自动 git。
 * @returns {{root:string, docs:string, adopted:boolean, created:string[], git:string, commit:string}}
 */
export async function ensureWorkspace(config, child) {
  const { root, docs } = workspacePaths(config)
  const info = inspectWorkspace(config)
  const created = []
  mkdirSync(docs, { recursive: true })
  // 旧档案先合并奶记录，避免新模板先把“奶记录.md”占掉。
  migrateLegacyMilk(docs)

  const now = new Date()
  const body = templates({
    name: child?.name || '宝宝',
    birthDate: child?.birthDate || '',
    sex: child?.sex || '',
    year: now.getFullYear(),
  })
  for (const [name, content] of Object.entries(body)) {
    if (name.startsWith('.')) continue
    const targetName = scopedBaseName(child?.name || '', name)
    const file = join(docs, targetName)
    const legacy = join(docs, name)
    if (existsSync(file) || existsSync(legacy)) continue
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, content, 'utf8')
    created.push(targetName)
  }
  mkdirSync(join(docs, '自定义', '记录'), { recursive: true })
  // 档案索引：只列本档案文件，方便定位和导出；不复制数据。
  try {
    const indexName = scopedBaseName(child?.name || '', '档案索引')
    const indexFile = join(docs, indexName)
    if (!existsSync(indexFile)) {
      const list = readdirSync(docs).filter((n) => n.endsWith('.md') && n !== indexName).sort()
      const rows = list.map((n) => '| ' + n + ' | ' + (readFileSync(join(docs, n), 'utf8').split('\n').length) + ' |')
      writeFileSync(indexFile, '# ' + (child?.name || '孩子') + ' · 档案索引\n\n> schema: 1 · 文件都带小名；数据仍以各 Markdown 表为准，这里是目录不是副本。\n\n| 文件 | 行数 |\n|---|---:|\n' + rows.join('\n') + '\n', 'utf8')
      created.push(indexName)
    }
  } catch { /* index is optional */ }
  for (const name of ['.gitignore', '.gitattributes']) {
    const file = join(root, name)
    if (existsSync(file)) continue
    writeFileSync(file, body[name] || '', 'utf8')
    created.push(name)
  }

  migrateWorkspace(config)
  const git = await ensureGit(root)
  let commit = 'skipped'
  if (git === 'ok' && config.autoCommit !== false) {
    commit = await commitAll(root, 'init: 育儿档案骨架')
  }
  return { root, docs, adopted: info.adopted, created, git, commit }
}

/** 旧工作区表头补列：日常记录加 辅食/补剂，辅食记录加 时间/食材/营养/依据。 */
export function migrateWorkspace(config) {
  const { docs } = workspacePaths(config)
  const daily = join(docs, '日常记录.md')
  const food = join(docs, '辅食记录.md')
  migrateFile(daily, ['日期', '奶'], ['日期', '月龄', '奶', '拉', '尿', '水', '辅食', '补剂', '时间点', '备注'])
  migrateFile(food, ['日期', '食物'], ['日期', '时间', '类型', '食物', '份量', '营养估算（参考）', '反应', '依据'])
}

function migrateFile(file, required, desired) {
  if (!existsSync(file)) return
  const md = readFileSync(file, 'utf8')
  const table = parseTables(md).find((t) => required.every((h) => t.header.some((x) => x.includes(h))))
  if (!table) return
  if (desired.every((h) => table.header.some((x) => x.replace(/（.*?）/g, '').includes(h.replace(/（.*?）/g, ''))))) return
  const lines = md.split('\n')
  const mapped = table.rows.map((r) => desired.map((h) => {
    const i = table.header.findIndex((x) => x.replace(/（.*?）/g, '').includes(h.replace(/（.*?）/g, '')))
    return i >= 0 ? (r.cells[i] || '') : ''
  }))
  lines[table.headerLine] = '| ' + desired.join(' | ') + ' |'
  lines[table.headerLine + 1] = '|' + desired.map(() => ' --- ').join('|') + '|'
  for (const r of table.rows) lines[r.line] = '| ' + mapped[table.rows.indexOf(r)].map((c) => String(c).replace(/\|/g, '／')).join(' | ') + ' |'
  writeFileSync(file, lines.join('\n'), 'utf8')
}

async function ensureGit(root) {
  const version = await runGit(root, ['--version'])
  if (!version.ok) return 'no-git'
  if (!existsSync(join(root, '.git'))) {
    let init = await runGit(root, ['init', '-b', 'main'])
    if (!init.ok) init = await runGit(root, ['init'])
    if (!init.ok) return 'failed'
  }
  const name = await runGit(root, ['config', 'user.name'])
  if (!name.ok || name.stdout.trim() === '') {
    await runGit(root, ['config', 'user.name', 'child-doc'])
    await runGit(root, ['config', 'user.email', 'child-doc@local'])
  }
  return 'ok'
}

export async function commitAll(root, message) {
  const add = await runGit(root, ['add', '-A'])
  if (!add.ok) return 'failed:add'
  const commit = await runGit(root, ['commit', '-q', '-m', message])
  if (commit.ok) return 'ok'
  const out = commit.stdout + '\n' + commit.stderr
  if (/nothing to commit|no changes added|nothing added to commit/i.test(out)) return 'no-changes'
  return 'failed:commit'
}

export function runGit(cwd, args) {
  return new Promise((resolve) => {
    execFile('git', args, { cwd, timeout: 20000, windowsHide: true }, (err, stdout, stderr) => {
      resolve({ ok: err === null, stdout: String(stdout || ''), stderr: String(stderr || '') })
    })
  })
}

/** 原子写：临时文件 + rename；Windows 被占用时重试一次。 */
/**
 * 旧档案一次性迁移：奶类记录/奶粉记录 → 奶记录.md。
 * 只在奶记录不存在、旧表有数据时执行；旧文件保留，不删。
 */
export function migrateLegacyMilk(docs) {
  const canonical = join(docs, '奶记录.md')
  if (existsSync(canonical)) return { migrated: false, rows: 0 }
  const rows = []
  const milk = join(docs, '奶类记录.md')
  if (existsSync(milk)) {
    const table = parseTables(readFileSync(milk, 'utf8')).find((t) => t.header.includes('日期') && t.header.some((h) => h.includes('类型')) && t.header.some((h) => h.includes('量')))
    if (table) {
      const at = (r, n) => { const i = table.header.findIndex((h) => h.includes(n)); return i >= 0 ? (r.cells[i] || '') : '' }
      for (const r of table.rows) {
        const date = at(r, '日期')
        if (!date) continue
        rows.push([date, (at(r, '类型') === '奶粉' ? '配方奶' : (at(r, '类型') || '其他')), '', at(r, '量'), at(r, '时间'), '', '', at(r, '备注')])
      }
    }
  }
  const formula = join(docs, '奶粉记录.md')
  if (existsSync(formula)) {
    const table = parseTables(readFileSync(formula, 'utf8')).find((t) => t.header.includes('日期'))
    if (table) {
      const at = (r, n) => { const i = table.header.findIndex((h) => h.includes(n)); return i >= 0 ? (r.cells[i] || '') : '' }
      for (const r of table.rows) {
        const date = at(r, '日期')
        if (!date) continue
        const text = String(at(r, '实际摄入') || '') + ' ' + String(at(r, '估算摄入') || '') + ' ' + String(at(r, '冲调量') || '')
        const ml = (/约\s*(\d+(?:\.\d+)?)\s*m[lL]/i.exec(text) || text.match(/(\d+(?:\.\d+)?)\s*m[lL]/i) || [])[1] || ''
        rows.push([date, '配方奶', at(r, '品牌/段数'), ml, '', at(r, '标签营养（每100ml）'), at(r, '估算摄入'), at(r, '依据')])
      }
    }
  }
  if (!rows.length) return { migrated: false, rows: 0 }
  const esc = (v) => String(v ?? '').replace(/\|/g, '／').replace(/\n/g, ' ')
  const md = '# 奶记录\n\n> 从旧奶类记录/奶粉记录迁入；所有奶统一记这里。\n\n| 日期 | 品种 | 品牌/段数 | 量(ml) | 时间 | 标签营养（每100ml） | 估算摄入 | 备注 |\n|---|---|---|---:|---|---|---|---|\n' + rows.map((r) => '| ' + r.map(esc).join(' | ') + ' |').join('\n') + '\n'
  writeFileAtomic(canonical, md)
  return { migrated: true, rows: rows.length }
}

export function writeFileAtomic(file, content) {
  const tmp = file + '.tmp-' + process.pid + '-' + Date.now()
  writeFileSync(tmp, content, 'utf8')
  try {
    renameSync(tmp, file)
  } catch {
    writeFileSync(file, content, 'utf8')
    try { renameSync(tmp, tmp + '.del') } catch { /* ignore */ }
  }
}

export function readText(file) {
  try { return readFileSync(file, 'utf8') } catch { return '' }
}
