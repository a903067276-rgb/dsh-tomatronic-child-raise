/**
 * 建档案的唯一服务实现：API 和 child_onboard 工具共用。
 * 只负责写配置 + 建子工作区，不直接写 DSH 内部存储。
 */
import { childWorkspacePath, ensureWorkspace, pregnancyWorkspacePath } from '../core/workspace.js'
import { status } from '../core/store.js'

export async function createArchive(ctx, conf, body = {}) {
  const name = String(body.name || '').trim()
  const birthDate = String(body.birthDate || '').trim()
  const stage = String(body.stage || '').trim()
  const birthOptional = stage === 'preconception' || stage === 'pregnancy'
  if (!name || (!birthDate && !birthOptional)) return { ok: false, error: '小名和生日必填（备孕/孕期可不填生日）' }
  const root = String(conf.workspace || '')
  if (!root) return { ok: false, error: '还没有总工作区' }
  const id = String(body.id || ('c' + Date.now().toString(36)))
  const existingChild = (conf.children || []).find((c) => c.id === id)
  const workspace = existingChild?.workspace || (stage === 'pregnancy'
    ? pregnancyWorkspacePath(root, name, id)
    : childWorkspacePath(root, name, id, conf.children || []))
  const child = {
    id, name, birthDate, sex: String(body.sex || ''), workspace, stage,
    stageDetail: String(body.stageDetail || ''), dueDate: String(body.dueDate || ''),
    dueDateSource: stage === 'pregnancy' ? (existingChild?.dueDateSource || 'manual') : (existingChild?.dueDateSource || ''),
    avatar: existingChild?.avatar || '', avatarColor: String(body.avatarColor || existingChild?.avatarColor || '#D24B36'),
    keyMetrics: existingChild?.keyMetrics || [], kind: stage === 'pregnancy' ? 'pregnancy' : (existingChild?.kind || 'child'),
    pregnancyId: String(body.pregnancyId || existingChild?.pregnancyId || ''), dev: existingChild?.dev === true,
  }
  const children = [...(conf.children || [])]
  const at = children.findIndex((c) => c.id === child.id)
  if (at >= 0) children[at] = child
  else children.push(child)
  const next = {
    ...conf, workspace: root, children,
    country: String(body.country || conf.country || '中国'),
    city: String(body.city || conf.city || ''),
    userName: String(body.userName || conf.userName || ''),
    userRole: String(body.userRole || conf.userRole || ''),
    motherName: String(body.motherName || conf.motherName || ''),
  }
  const configEditor = ctx && typeof ctx.get === 'function' ? ctx.get('configEditor') : undefined
  const entry = configEditor && typeof configEditor.entries === 'function'
    ? configEditor.entries().find((e) => (e.options && e.options.name === 'dsh-tomatronic-child-raise') || String(e.id || '').includes('child-raise'))
    : undefined
  try {
    if (configEditor && typeof configEditor.edit === 'function' && entry) {
      await configEditor.edit(entry, () => next)
    } else {
      const settings = ctx && typeof ctx.get === 'function' ? ctx.get('settings') : undefined
      if (!settings || typeof settings.update !== 'function' || !settings.writable) {
        return { ok: false, error: '当前 profile 不支持应用内写配置；请改 profile patch' }
      }
      const desc = settings.describe({ redactSecrets: true })
      const d = desc.find((x) => x.ns === 'child-raise') || desc.find((x) => x.value && Array.isArray(x.value.children))
      if (!d) return { ok: false, error: '找不到 child-raise 配置条目' }
      await settings.update(d.ns, next, d.revision)
    }
    const ws = await ensureWorkspace({ ...next, workspace: child.workspace }, child)
    return { ok: true, child, workspace: ws, status: status(next) }
  } catch (e) {
    return { ok: false, error: String(e && e.message ? e.message : e) }
  }
}
