/**
 * HTTP RPC：给看板/表单用。
 * 所有写入走 store.write —— 和 agent 工具同一条路。
 */
import { addBag, addPending, allRecords, answerTodo, appendCustomRecord, buildAssess, cancelPending, confirmPending, deleteLastReport, listPending, buildCheckup, confirmRoutine, createCustomForm, load, overview, parseCustomForms, readCustomRecords, recentWrites, status, suggestRoutine, toggleBag, write } from '../core/store.js'
import { join, basename, extname, dirname } from 'node:path'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { ensureWorkspace, inspectWorkspace } from '../core/workspace.js'
import { computeEdd, makeBirthChildren } from '../features/pregnancy.js'
import { createArchive } from './onboard.js'

const BASE = '/api/dsh-tomatronic-child-raise'

/** Host 是否为回环或内网字面 IP（拒绝域名，防 DNS rebinding；同时兼容局域网/手机访问）。 */
export function isLocalHostHeader(hostHeader) {
  const raw = String(hostHeader || '').toLowerCase().trim()
  if (raw === '') return false
  // 去掉端口；IPv6 形如 [::1]:3080
  const hostOnly = raw.startsWith('[') ? raw.slice(0, raw.indexOf(']') + 1) : raw.split(':')[0]
  if (hostOnly === 'localhost' || hostOnly === '[::1]') return true
  const v4 = /^\d{1,3}(\.\d{1,3}){3}$/
  if (!v4.test(hostOnly)) return false
  const [a, b] = hostOnly.split('.').map(Number)
  if (a === 127) return true // 回环
  if (a === 10) return true // 10.0.0.0/8
  if (a === 192 && b === 168) return true // 192.168.0.0/16
  if (a === 172 && b >= 16 && b <= 31) return true // 172.16.0.0/12
  return false
}

/** 返回 null = 通过；返回字符串 = 拒绝原因。 */
export function guardHost(req) {
  const host = String(req.headers.host || '')
  if (!isLocalHostHeader(host)) return '拒绝访问：只允许本机或局域网宿主访问'
  const hostFromUrl = (u) => {
    try { return new URL(String(u)).host } catch { return '' }
  }
  const origin = String(req.headers.origin || '')
  const referer = String(req.headers.referer || req.headers.referrer || '')
  const claimed = origin !== '' ? hostFromUrl(origin) : referer !== '' ? hostFromUrl(referer) : ''
  if (claimed !== '' && claimed !== host) return '跨源请求被拒绝'
  if (req.method === 'POST' && origin === '') return '缺少 Origin：拒绝非浏览器写入'
  const site = String(req.headers['sec-fetch-site'] || '')
  if (site !== '' && site !== 'same-origin' && site !== 'none') return '跨站请求被拒绝'
  return null
}

export function apiHandler(cfg, ctx) {
  return async (req, res) => {
    try {
      const url = new URL(req.url || '/', 'http://dsh.local')
      const path = url.pathname.replace(/\/+$/, '')
      if (!path.startsWith(BASE)) return writeJson(res, 404, { ok: false, error: 'not found' })
      const route = path.slice(BASE.length) || '/'
      const childId = url.searchParams.get('child') || undefined

      // ── 宿主身份校验（2026-11-19，插件市场审核意见）─────────────────────────────
      // 背景：DSH 宿主的鉴权**不覆盖插件自注册的路由**（实测：不带 token 请求 /api/... 仍返回 200），
      // 而本路由能读写孩子的健康/成长档案（PII）⇒ 必须自己证明"请求来自本机或本局域网的宿主 UI"。
      // 三条规则（对 GET/POST 全部生效）：
      //   1) Host 必须是回环或内网字面 IP —— 域名形式的 Host 一律拒绝，防 DNS rebinding；
      //   2) 带 Origin / Referer 时，其 host 必须与 Host 一致（同源）；
      //   3) POST 必须带 Origin（浏览器同源写一定带；缺失多为脚本直连，拒绝），且禁跨站。
      const denied = guardHost(req)
      if (denied !== null) return writeJson(res, 403, { ok: false, error: denied })
      if (req.method === 'POST') {
        const ct = String(req.headers['content-type'] || '')
        if (!ct.includes('application/json')) return writeJson(res, 415, { ok: false, error: '需要 application/json' })
        const origin = String(req.headers.origin || '')
        if (origin) {
          try { if (new URL(origin).host !== req.headers.host) return writeJson(res, 403, { ok: false, error: '跨源写入被拒绝' }) }
          catch { return writeJson(res, 403, { ok: false, error: 'Origin 不合法' }) }
        }
      }

      if (req.method === 'GET' && route === '/status') {
        return writeJson(res, 200, { ok: true, ...status(cfg()), workspaceInfo: inspectWorkspace(cfg()) })
      }
      if (req.method === 'GET' && route === '/updates') {
        const after = Number(url.searchParams.get('after') || 0) || 0
        return writeJson(res, 200, { ok: true, writes: recentWrites(childId, after) })
      }
      if (req.method === 'GET' && route === '/bag') {
        const o = overview(cfg(), childId)
        return writeJson(res, o.ok ? 200 : 400, o.ok ? { ok: true, bag: o.hospitalBag } : o)
      }
      if (req.method === 'POST' && route === '/bag/toggle') {
        const body = await readBody(req)
        const r = await toggleBag(cfg(), body.childId || childId, body.text, body.done === true)
        return writeJson(res, r.ok ? 200 : 400, r)
      }
      if (req.method === 'POST' && route === '/bag/add') {
        const body = await readBody(req)
        const r = await addBag(cfg(), body.childId || childId, body.section, body.text)
        return writeJson(res, r.ok ? 200 : 400, r)
      }
      if (req.method === 'GET' && route === '/records') {
        const r = allRecords(cfg(), childId, url.searchParams.get('kind') || '')
        return writeJson(res, r.ok ? 200 : 400, r)
      }
      if (req.method === 'GET' && route === '/custom/forms') {
        const loaded = load(cfg(), childId)
        if (!loaded.ok) return writeJson(res, 400, loaded)
        return writeJson(res, 200, { ok: true, forms: parseCustomForms(loaded.docs) })
      }
      if (req.method === 'POST' && route === '/custom/forms') {
        const body = await readBody(req)
        const r = await createCustomForm(cfg(), body.childId || childId, body)
        return writeJson(res, r.ok ? 200 : 400, r)
      }
      if (req.method === 'GET' && route === '/custom/records') {
        const r = readCustomRecords(cfg(), childId, url.searchParams.get('formId') || '')
        return writeJson(res, r.ok ? 200 : 400, r)
      }
      if (req.method === 'POST' && route === '/custom/records') {
        const body = await readBody(req)
        const r = await appendCustomRecord(cfg(), body.childId || childId, body.formId, body.values || {})
        return writeJson(res, r.ok ? 200 : 400, r)
      }
      if (req.method === 'GET' && route === '/avatar') {
        const conf = cfg()
        const child = (conf.children || []).find((c) => c.id === childId) || (conf.children || [])[0]
        if (!child || !child.avatar) return writeJson(res, 404, { ok: false, error: '没有头像' })
        const docs = join(child.workspace || conf.workspace, conf.contentDir || 'docs')
        const file = join(docs, basename(child.avatar))
        if (!existsSync(file)) return writeJson(res, 404, { ok: false, error: '头像文件不存在' })
        try {
          const buf = readFileSync(file)
          const ext = extname(file).toLowerCase()
          const type = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg'
          res.statusCode = 200
          res.setHeader('content-type', type)
          res.setHeader('cache-control', 'private, max-age=60')
          res.end(buf)
          return
        } catch (e) { return writeJson(res, 500, { ok: false, error: String(e && e.message ? e.message : e) }) }
      }
      if (req.method === 'POST' && route === '/avatar') {
        const body = await readBody(req)
        const conf = cfg()
        const child = (conf.children || []).find((c) => c.id === (body.childId || childId))
        if (!child) return writeJson(res, 400, { ok: false, error: '没有这个孩子' })
        const patch = {}
        if (body.clear === true) patch.avatar = ''
        if (typeof body.color === 'string' && body.color.trim()) {
          if (!/^(#[0-9a-fA-F]{6}|hsl\([^)]*\)|rgb\([^)]*\))$/.test(body.color.trim())) return writeJson(res, 400, { ok: false, error: '颜色格式不对' })
          patch.avatarColor = body.color.trim()
        }
        if (typeof body.dataUrl === 'string' && body.dataUrl) {
          const m = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(body.dataUrl)
          if (!m) return writeJson(res, 400, { ok: false, error: '只支持 png/jpeg/webp' })
          const buf = Buffer.from(m[2], 'base64')
          if (buf.length > 900_000) return writeJson(res, 400, { ok: false, error: '头像太大（<900KB）' })
          const ext = m[1] === 'jpeg' ? 'jpg' : m[1]
          const docs = join(child.workspace || conf.workspace, conf.contentDir || 'docs')
          mkdirSync(docs, { recursive: true })
          const name = '.avatar.' + ext
          writeFileSync(join(docs, name), buf)
          patch.avatar = name
        }
        if (!Object.keys(patch).length) return writeJson(res, 400, { ok: false, error: '没有要保存的头像' })
        const ok = await editChildConfig(ctx, child.id, patch)
        if (!ok) return writeJson(res, 400, { ok: false, error: '当前 profile 不支持保存头像' })
        return writeJson(res, 200, { ok: true, avatar: Object.prototype.hasOwnProperty.call(patch, 'avatar') ? patch.avatar : (child.avatar || ''), avatarColor: patch.avatarColor || child.avatarColor || '#D24B36' })
      }
      if (req.method === 'POST' && route === '/key-metrics') {
        const body = await readBody(req)
        const metrics = Array.isArray(body.metrics) ? body.metrics.filter((x) => typeof x === 'string').slice(0, 3) : []
        if (!metrics.length) return writeJson(res, 400, { ok: false, error: '至少选一个指标' })
        const conf = cfg()
        const child = (conf.children || []).find((c) => c.id === (body.childId || childId))
        if (!child) return writeJson(res, 400, { ok: false, error: '没有这个孩子' })
        const ok = await editChildConfig(ctx, child.id, { keyMetrics: metrics })
        return writeJson(res, ok ? 200 : 400, ok ? { ok: true, metrics } : { ok: false, error: '当前 profile 不支持保存指标' })
      }
      if (req.method === 'GET' && route === '/overview') {
        const o = overview(cfg(), childId)
        if (!o.ok) return writeJson(res, 400, o)
        const etag = '"' + createHash('sha1').update(String(o.revision || '')).digest('hex').slice(0, 20) + '"'
        res.setHeader('etag', etag)
        if (String(req.headers['if-none-match'] || '') === etag) { res.statusCode = 304; res.end(); return }
        return writeJson(res, 200, o)
      }
      if (req.method === 'GET' && route === '/checkup') {
        const loaded = load(cfg(), childId)
        const months = loaded.ok ? loaded.summary.months : undefined
        return writeJson(res, 200, { ok: true, text: buildCheckup(months), months })
      }
      if (req.method === 'GET' && route === '/assess') {
        const loaded = load(cfg(), childId)
        const months = loaded.ok ? loaded.summary.months : undefined
        return writeJson(res, 200, { ok: true, ...buildAssess(months), months })
      }
      if (req.method === 'POST' && route === '/workspace/init') {
        const conf = cfg()
        if (!conf.workspace) return writeJson(res, 400, { ok: false, error: '没有配置工作区' })
        mkdirSync(join(conf.workspace, conf.contentDir || 'docs'), { recursive: true })
        return writeJson(res, 200, { ok: true, workspace: conf.workspace })
      }
      if (req.method === 'POST' && route === '/workspace/set') {
        const body = await readBody(req)
        const requested = String(body.path || '').trim()
        if (!requested || !requested.startsWith('/')) return writeJson(res, 400, { ok: false, error: '请选择绝对路径' })
        const configEditor = ctx && typeof ctx.get === 'function' ? ctx.get('configEditor') : undefined
        const entry = configEditor && typeof configEditor.entries === 'function'
          ? configEditor.entries().find((e) => (e.options && e.options.name === 'dsh-tomatronic-child-raise') || String(e.id || '').includes('child-raise'))
          : undefined
        if (!configEditor || typeof configEditor.edit !== 'function' || !entry) return writeJson(res, 400, { ok: false, error: '当前 profile 不支持改工作目录' })
        try {
          const conf = cfg()
          const oldRoot = String(conf.workspace || '')
          const children = [...(conf.children || [])]
          const warnings = []
          if (body.migrate === true && oldRoot && oldRoot !== requested && children.length) {
            const moved = []
            for (const child of children) {
              const source = String(child.workspace || '')
              if (!source || !source.startsWith(oldRoot + '/')) { warnings.push(child.name + ' 的档案在旧目录外，未迁移'); continue }
              const target = join(requested, basename(source))
              if (existsSync(target)) { warnings.push(child.name + ' 的目标目录已存在，未迁移'); continue }
              mkdirSync(dirname(target), { recursive: true })
              renameSync(source, target)
              moved.push([source, target])
              child.workspace = target
            }
            try {
              await configEditor.edit(entry, (current) => ({ ...current, workspace: requested, children }))
            } catch (e) {
              for (const [source, target] of moved) { try { renameSync(target, source) } catch { /* best effort */ } }
              throw e
            }
          } else {
            await configEditor.edit(entry, (current) => ({ ...current, workspace: requested }))
            if (children.length) warnings.push('已有档案仍在原路径，只影响新建档案')
          }
          mkdirSync(join(requested, conf.contentDir || 'docs'), { recursive: true })
          return writeJson(res, 200, { ok: true, workspace: requested, warning: warnings.join('；') })
        } catch (e) { return writeJson(res, 400, { ok: false, error: String(e && e.message ? e.message : e) }) }
      }
      if (req.method === 'POST' && route === '/pregnancy/edd') {
        const body = await readBody(req)
        const conf = cfg()
        const targetId = String(body.childId || childId || '').trim()
        const child = (conf.children || []).find((c) => c.id === targetId)
        if (!child) return writeJson(res, 400, { ok: false, error: '没有这个孕期档案' })
        const source = String(body.source || 'hospital').trim()
        const lmp = String(body.lmp || '').trim()
        const scanDate = String(body.ultrasoundDate || '').trim()
        const gaDays = Number(body.ultrasoundGaDays || 0)
        const dueDate = computeEdd({ source, dueDate: String(body.dueDate || '').trim(), lmp, ultrasoundDate: scanDate, ultrasoundGaDays: gaDays })
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return writeJson(res, 400, { ok: false, error: '请填有效的预产期日期' })
        const patch = {
          dueDate,
          dueDateSource: source,
          dueDateHospital: String(body.hospital || '').trim(),
          dueDateUpdatedAt: new Date().toISOString().slice(0, 10),
          lmp,
          ultrasoundDate: scanDate,
          ultrasoundGaDays: gaDays,
          nextCheckup: String(body.nextCheckup || '').trim(),
        }
        try {
          const ok = await editChildConfig(ctx, targetId, patch)
          if (!ok) return writeJson(res, 400, { ok: false, error: '配置写入失败' })
          let warning = ''
          try {
            const schedule = ctx && typeof ctx.get === 'function' ? ctx.get('schedule') : undefined
            if (schedule && typeof schedule.catalog === 'function' && typeof schedule.edit === 'function') {
              const prefix = '问问 · 孕期·' + child.name + '：'
              const list = await schedule.catalog()
              const stale = list.filter((t) => t.title && t.title.startsWith(prefix))
              for (const t of stale) await schedule.edit({ id: t.id, action: 'delete' })
              if (stale.length) warning = '旧孕期提醒已删除（' + stale.length + ' 条），请按新预产期重设'
            }
          } catch { /* reminder cleanup is best effort */ }
          return writeJson(res, 200, { ok: true, ...patch, warning })
        } catch (e) { return writeJson(res, 400, { ok: false, error: String(e && e.message ? e.message : e) }) }
      }
      if (req.method === 'POST' && route === '/todo/answer') {
        const body = await readBody(req)
        const r = await answerTodo(cfg(), body.childId || childId, body.text, body.answer)
        return writeJson(res, r.ok ? 200 : 400, r)
      }
      if (req.method === 'POST' && route === '/write') {
        const body = await readBody(req)
        const r = await write(cfg(), body.childId || childId, body.kind, body.payload || {})
        return writeJson(res, r.ok ? 200 : 400, r)
      }
      if (req.method === 'GET' && route === '/reminders') {
        const schedule = ctx && typeof ctx.get === 'function' ? ctx.get('schedule') : undefined
        if (!schedule || typeof schedule.catalog !== 'function') return writeJson(res, 200, { ok: false, error: 'DSH 定时任务服务不可用', items: [] })
        try {
          const list = await schedule.catalog()
          const items = list.filter((t) => t.title && t.title.startsWith('问问 ·')).map((t) => ({ id: t.id, title: t.title, status: t.status, scheduledAt: t.scheduledAt }))
          return writeJson(res, 200, { ok: true, items })
        } catch (e) { return writeJson(res, 200, { ok: false, error: String(e && e.message ? e.message : e), items: [] }) }
      }
      if (req.method === 'POST' && route === '/reminder') {
        const body = await readBody(req)
        const schedule = ctx && typeof ctx.get === 'function' ? ctx.get('schedule') : undefined
        if (!schedule || typeof schedule.create !== 'function') {
          return writeJson(res, 400, { ok: false, error: 'DSH 定时任务服务不可用' })
        }
        const name = String(body.name || '').trim()
        const time = String(body.time || '').trim()
        if (!name || !/^\d{2}:\d{2}$/.test(time)) return writeJson(res, 400, { ok: false, error: '名称和时间（HH:MM）必填' })
        const conf = cfg()
        const child = (conf.children || []).find((c) => c.id === (body.childId || childId)) || (conf.children || [])[0]
        if (!child) return writeJson(res, 400, { ok: false, error: '没有孩子档案' })
        const kindLabel = { medication: '用药', pregnancyMed: '孕期用药', specialSupplement: '补剂' }[body.kind] || '补剂'
        const title = '问问 · ' + kindLabel + '：' + name + ' ' + time
        try {
          const list = await schedule.catalog()
          if (list.some((x) => x.title === title)) return writeJson(res, 200, { ok: true, title, existing: true })
          await schedule.create({
            title,
            prompt: '提醒：' + child.name + ' ' + (kindLabel === '孕期用药' ? '孕期该用药/补剂' : '该' + (kindLabel === '用药' ? '用药' : '吃补剂')) + '「' + name + '」（你设的 ' + time + '）。记录一下；如果已经吃过/用过，说一声。',
            timing: { kind: 'daily', daily: { time: time + ':00', time_zone: 'Asia/Shanghai' } },
            target: { kind: 'new_once', create: { cwd: child.workspace || conf.workspace } },
          })
          return writeJson(res, 200, { ok: true, title })
        } catch (e) {
          return writeJson(res, 400, { ok: false, error: String(e && e.message ? e.message : e) })
        }
      }
      if (req.method === 'POST' && route === '/reminder/delete') {
        const body = await readBody(req)
        const schedule = ctx && typeof ctx.get === 'function' ? ctx.get('schedule') : undefined
        if (!schedule || typeof schedule.catalog !== 'function' || typeof schedule.edit !== 'function') {
          return writeJson(res, 400, { ok: false, error: 'DSH 定时任务服务不可用' })
        }
        const title = String(body.title || '').trim()
        const id = String(body.id || '').trim()
        const list = await schedule.catalog()
        const task = id ? list.find((x) => String(x.id) === id) : list.find((x) => x.title === title)
        if (!task) return writeJson(res, 404, { ok: false, error: '没找到这条提醒' })
        await schedule.edit({ id: task.id, action: 'delete' })
        return writeJson(res, 200, { ok: true })
      }
      if (req.method === 'POST' && route === '/pregnancy-reminder') {
        const body = await readBody(req)
        const schedule = ctx && typeof ctx.get === 'function' ? ctx.get('schedule') : undefined
        if (!schedule || typeof schedule.create !== 'function') return writeJson(res, 400, { ok: false, error: 'DSH 定时任务服务不可用' })
        const title = String(body.title || '').trim()
        const date = String(body.date || '').trim()
        if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return writeJson(res, 400, { ok: false, error: '标题和日期必填' })
        const conf = cfg()
        const child = (conf.children || []).find((c) => c.id === (body.childId || childId)) || (conf.children || [])[0]
        if (!child) return writeJson(res, 400, { ok: false, error: '没有档案' })
        const taskTitle = '问问 · 孕期·' + child.name + '：' + title + ' ' + date
        try {
          const list = await schedule.catalog()
          if (list.some((x) => x.title === taskTitle)) return writeJson(res, 200, { ok: true, title: taskTitle, existing: true })
          await schedule.create({
            title: taskTitle,
            prompt: '孕期提醒（' + child.name + '）：' + title + '（' + date + '）。按医生安排；把报告/结果归到孕检报告里，不要自己解读。',
            timing: { kind: 'at', at: { date, time: '09:00:00', time_zone: 'Asia/Shanghai' } },
            target: { kind: 'new_once', create: { cwd: child.workspace || conf.workspace } },
          })
          return writeJson(res, 200, { ok: true, title: taskTitle })
        } catch (e) { return writeJson(res, 400, { ok: false, error: String(e && e.message ? e.message : e) }) }
      }
      if (req.method === 'POST' && route === '/workspace/ensure') {
        const body = await readBody(req)
        const conf = cfg()
        const child = (conf.children || []).find((c) => c.id === (body.childId || childId))
        if (!child) return writeJson(res, 400, { ok: false, error: '没有这个档案' })
        try {
          const ws = await ensureWorkspace({ ...conf, workspace: child.workspace }, child)
          return writeJson(res, 200, { ok: true, workspace: child.workspace, ensured: ws })
        } catch (e) { return writeJson(res, 400, { ok: false, error: String(e && e.message ? e.message : e) }) }
      }
      if (req.method === 'POST' && route === '/workspace/repair-sessions') {
        const registry = ctx && typeof ctx.get === 'function' ? ctx.get('workspaceRegistry') : undefined
        const persistence = ctx && typeof ctx.get === 'function' ? ctx.get('sessionPersistence') : undefined
        if (!registry || typeof registry.list !== 'function' || !persistence || typeof persistence.list !== 'function') {
          return writeJson(res, 400, { ok: false, error: '当前宿主不支持会话归组' })
        }
        const conf = cfg()
        const root = String(conf.workspace || '').replace(/\/+$/, '')
        try {
          const workspaces = registry.list()
          const byPath = new Map(workspaces.map((w) => [String(w.path || '').replace(/\/+$/, ''), w]))
          const validChildren = new Set((conf.children || []).map((c) => String(c.workspace || '').replace(/\/+$/, '')).filter(Boolean))
          const headers = await persistence.list()
          let attached = 0
          let matched = 0
          let errors = 0
          const samples = []
          const cwdSamples = headers.slice(0, 5).map((h) => String((h && h.header && h.header.cwd) || ''))
          for (const snap of headers) {
            const h = (snap && snap.header) || snap || {}
            const cwd = String(h.cwd || '').replace(/\/+$/, '')
            if (!cwd || (cwd !== root && !cwd.startsWith(root + '/'))) continue
            matched += 1
            // 只有当前配置里的孩子目录才允许重建/注册；已删除的旧孩子会话归到总工作区，不把目录复活。
            const allowedChild = cwd === root || validChildren.has(cwd)
            // 已删除/未配置的子目录不再交给 workspace 服务，避免它顺手把目录重建。
            if (!allowedChild) continue
            try { if (!existsSync(cwd)) mkdirSync(cwd, { recursive: true }) } catch { /* keep */ }
            let ws = byPath.get(cwd)
            if (!ws && typeof registry.create === 'function') {
              try { ws = await registry.create(cwd, cwd.split('/').pop()); byPath.set(cwd, ws) } catch { /* keep */ }
            }
            if (!ws) ws = byPath.get(root)
            if (ws && typeof ws.attachSession === 'function' && h.id) {
              try { await ws.attachSession(h.id); attached += 1 } catch (e) { errors += 1; if (samples.length < 3) samples.push(String(e && e.message ? e.message : e)) }
            }
          }
          return writeJson(res, 200, { ok: true, attached, matched, errors, total: headers.length, samples, cwdSamples })
        } catch (e) { return writeJson(res, 400, { ok: false, error: String(e && e.message ? e.message : e) }) }
      }
      if (req.method === 'POST' && route === '/workspace/cleanup') {
        const registry = ctx && typeof ctx.get === 'function' ? ctx.get('workspaceRegistry') : undefined
        if (!registry || typeof registry.list !== 'function' || typeof registry.delete !== 'function') {
          return writeJson(res, 400, { ok: false, error: '当前宿主不支持工作区清理' })
        }
        const conf = cfg()
        const root = String(conf.workspace || '').replace(/\/+$/, '')
        const valid = new Set((conf.children || []).map((c) => String(c.workspace || '').replace(/\/+$/, '')).filter(Boolean))
        const removed = []
        try {
          for (const w of registry.list()) {
            const path = String(w.path || '').replace(/\/+$/, '')
            if (!path || path === root || !path.startsWith(root + '/')) continue
            if (valid.has(path)) continue
            if (await registry.delete(w.id)) removed.push(w.title || path)
          }
          return writeJson(res, 200, { ok: true, removed })
        } catch (e) { return writeJson(res, 400, { ok: false, error: String(e && e.message ? e.message : e), removed }) }
      }
      if (req.method === 'POST' && route === '/dev-mode') {
        const body = await readBody(req)
        const configEditor = ctx && typeof ctx.get === 'function' ? ctx.get('configEditor') : undefined
        const entry = configEditor && typeof configEditor.entries === 'function'
          ? configEditor.entries().find((e) => (e.options && e.options.name === 'dsh-tomatronic-child-raise') || String(e.id || '').includes('child-raise'))
          : undefined
        if (!configEditor || typeof configEditor.edit !== 'function' || !entry) return writeJson(res, 400, { ok: false, error: '当前 profile 不支持改开发模式' })
        const enabled = body.enabled === true
        try {
          await configEditor.edit(entry, (current) => ({ ...current, devMode: enabled }))
          return writeJson(res, 200, { ok: true, devMode: enabled })
        } catch (e) { return writeJson(res, 400, { ok: false, error: String(e && e.message ? e.message : e) }) }
      }
      if (req.method === 'POST' && route === '/virtual-mode') {
        const body = await readBody(req)
        const configEditor = ctx && typeof ctx.get === 'function' ? ctx.get('configEditor') : undefined
        const entry = configEditor && typeof configEditor.entries === 'function'
          ? configEditor.entries().find((e) => (e.options && e.options.name === 'dsh-tomatronic-child-raise') || String(e.id || '').includes('child-raise'))
          : undefined
        if (!configEditor || typeof configEditor.edit !== 'function' || !entry) return writeJson(res, 400, { ok: false, error: '当前 profile 不支持改虚拟模式' })
        const enabled = body.enabled === true
        try {
          await configEditor.edit(entry, (current) => ({ ...current, mode: enabled ? 'virtual' : 'real' }))
          return writeJson(res, 200, { ok: true, mode: enabled ? 'virtual' : 'real' })
        } catch (e) { return writeJson(res, 400, { ok: false, error: String(e && e.message ? e.message : e) }) }
      }
      if (req.method === 'POST' && route === '/birth') {
        const body = await readBody(req)
        const conf = cfg()
        const pregnancyId = String(body.pregnancyId || '').trim()
        const pregnancy = (conf.children || []).find((c) => c.id === pregnancyId)
        if (!pregnancy || pregnancy.kind !== 'pregnancy') return writeJson(res, 400, { ok: false, error: '没有这个孕期档案' })
        const birthDate = String(body.birthDate || '').trim()
        const made = makeBirthChildren(conf, pregnancyId, birthDate, Array.isArray(body.babies) ? body.babies : [])
        if (!made.ok) return writeJson(res, 400, { ok: false, error: made.error })
        const created = made.created
        const nextChildren = made.nextChildren
        const configEditor = ctx && typeof ctx.get === 'function' ? ctx.get('configEditor') : undefined
        const entry = configEditor && typeof configEditor.entries === 'function'
          ? configEditor.entries().find((e) => (e.options && e.options.name === 'dsh-tomatronic-child-raise') || String(e.id || '').includes('child-raise'))
          : undefined
        if (!configEditor || typeof configEditor.edit !== 'function' || !entry) return writeJson(res, 400, { ok: false, error: '当前 profile 不支持写配置' })
        try {
          await configEditor.edit(entry, (current) => ({ ...current, children: nextChildren }))
          for (const child of created) await ensureWorkspace({ ...conf, workspace: child.workspace }, child)
          return writeJson(res, 200, { ok: true, pregnancyId: pregnancy.id, children: created.map((c) => ({ id: c.id, name: c.name, workspace: c.workspace })) })
        } catch (e) { return writeJson(res, 400, { ok: false, error: String(e && e.message ? e.message : e) }) }
      }
      if (req.method === 'POST' && route === '/capture-mode') {
        const body = await readBody(req)
        const configEditor = ctx && typeof ctx.get === 'function' ? ctx.get('configEditor') : undefined
        const entry = configEditor && typeof configEditor.entries === 'function'
          ? configEditor.entries().find((e) => (e.options && e.options.name === 'dsh-tomatronic-child-raise') || String(e.id || '').includes('child-raise'))
          : undefined
        if (!configEditor || typeof configEditor.edit !== 'function' || !entry) return writeJson(res, 400, { ok: false, error: '当前 profile 不支持改跨对话归集' })
        const enabled = body.enabled === true
        try {
          await configEditor.edit(entry, (current) => ({ ...current, crossChatCapture: enabled }))
          return writeJson(res, 200, { ok: true, crossChatCapture: enabled })
        } catch (e) { return writeJson(res, 400, { ok: false, error: String(e && e.message ? e.message : e) }) }
      }
      if (req.method === 'GET' && route === '/pending') {
        const r = listPending(cfg(), childId)
        return writeJson(res, r.ok ? 200 : 400, r)
      }
      if (req.method === 'POST' && route === '/pending/confirm') {
        const body = await readBody(req)
        const r = await confirmPending(cfg(), body.childId || childId, body.id)
        return writeJson(res, r.ok ? 200 : 400, r)
      }
      if (req.method === 'POST' && route === '/pending/cancel') {
        const body = await readBody(req)
        const r = await cancelPending(cfg(), body.childId || childId, body.id)
        return writeJson(res, r.ok ? 200 : 400, r)
      }
      if (req.method === 'POST' && route === '/delete-last-report') {
        const body = await readBody(req)
        const r = await deleteLastReport(cfg(), body.childId || childId)
        return writeJson(res, r.ok ? 200 : 400, r)
      }
      if (req.method === 'POST' && route === '/privacy-mode') {
        const body = await readBody(req)
        const configEditor = ctx && typeof ctx.get === 'function' ? ctx.get('configEditor') : undefined
        const entry = configEditor && typeof configEditor.entries === 'function'
          ? configEditor.entries().find((e) => (e.options && e.options.name === 'dsh-tomatronic-child-raise') || String(e.id || '').includes('child-raise'))
          : undefined
        if (!configEditor || typeof configEditor.edit !== 'function' || !entry) return writeJson(res, 400, { ok: false, error: '当前 profile 不支持隐私模式开关' })
        const enabled = body.enabled === true
        try { await configEditor.edit(entry, (current) => ({ ...current, privacyMode: enabled })); return writeJson(res, 200, { ok: true, privacyMode: enabled }) }
        catch (e) { return writeJson(res, 400, { ok: false, error: String(e && e.message ? e.message : e) }) }
      }
      if (req.method === 'POST' && route === '/onboard') {
        const body = await readBody(req)
        const r = await createArchive(ctx, cfg(), body)
        return writeJson(res, r.ok ? 200 : 400, r)
      }
      if (req.method === 'POST' && route === '/routine/suggest') {
        const body = await readBody(req)
        const r = await suggestRoutine(cfg(), body.childId || childId)
        return writeJson(res, r.ok ? 200 : 400, r)
      }
      if (req.method === 'POST' && route === '/routine/confirm') {
        const body = await readBody(req)
        const r = await confirmRoutine(cfg(), body.childId || childId, body.action || 'confirm', { values: body.values, from: body.from })
        return writeJson(res, r.ok ? 200 : 400, r)
      }
      if (req.method === 'POST' && route === '/bootstrap') {
        const body = await readBody(req)
        const conf = cfg()
        const child = conf.children.find((c) => c.id === (body.childId || childId)) || conf.children[0]
        if (!child) return writeJson(res, 400, { ok: false, error: '配置里没有孩子；先在设置里加一个' })
        const ws = await ensureWorkspace({ ...conf, workspace: child.workspace || conf.workspace }, child)
        return writeJson(res, 200, { ok: true, workspace: ws, status: status(conf) })
      }
      return writeJson(res, 404, { ok: false, error: 'unknown route ' + route })
    } catch (e) {
      return writeJson(res, 500, { ok: false, error: String(e && e.message ? e.message : e) })
    }
  }
}


async function editChildConfig(ctx, childId, patch) {
  const configEditor = ctx && typeof ctx.get === 'function' ? ctx.get('configEditor') : undefined
  const entry = configEditor && typeof configEditor.entries === 'function'
    ? configEditor.entries().find((e) => e.options && e.options.name === 'dsh-tomatronic-child-raise') || configEditor.entries().find((e) => String(e.id || '').includes('child-raise'))
    : undefined
  if (!configEditor || typeof configEditor.edit !== 'function' || !entry) return false
  try {
    await configEditor.edit(entry, (current) => ({
      ...current,
      children: (current.children || []).map((c) => c.id === childId ? { ...c, ...patch } : c),
    }))
    return true
  } catch { return false }
}

function writeJson(res, code, value) {
  try {
    res.statusCode = code
    res.setHeader('content-type', 'application/json; charset=utf-8')
    res.setHeader('cache-control', 'no-store')
    res.end(JSON.stringify(value))
  } catch { /* ignore */ }
}

function readBody(req) {
  return new Promise((resolve) => {
    let raw = ''
    req.on('data', (c) => { raw += c; if (raw.length > 3_000_000) req.destroy() })
    req.on('end', () => { try { resolve(JSON.parse(raw || '{}')) } catch { resolve({}) } })
    req.on('error', () => resolve({}))
  })
}
