/**
 * 孕期数据层：只做纯计算/构造，不写配置、不碰文件。
 * 预产期、出生建孩子、字段归一都放这里，API 和工具共用。
 */
import { childWorkspacePath } from '../core/workspace.js'

export function computeEdd({ source = 'hospital', dueDate = '', lmp = '', ultrasoundDate = '', ultrasoundGaDays = 0 } = {}) {
  const addDays = (iso, days) => {
    const d = new Date(String(iso) + 'T00:00:00Z')
    if (Number.isNaN(d.getTime())) return ''
    d.setUTCDate(d.getUTCDate() + Number(days || 0))
    return d.toISOString().slice(0, 10)
  }
  if (source === 'lmp' && /^\d{4}-\d{2}-\d{2}$/.test(lmp)) return addDays(lmp, 280)
  if (source === 'ultrasound' && /^\d{4}-\d{2}-\d{2}$/.test(ultrasoundDate) && Number(ultrasoundGaDays) > 0) {
    return addDays(ultrasoundDate, 280 - Number(ultrasoundGaDays))
  }
  return String(dueDate || '')
}

export function normalizeFoodType(value) {
  return ['餐食', '正餐', '辅食', ''].includes(String(value || '')) ? '辅食' : String(value || '')
}

export function makeBirthChildren(config, pregnancyId, birthDate, babies = []) {
  const pregnancy = (config.children || []).find((c) => c.id === pregnancyId)
  if (!pregnancy || pregnancy.kind !== 'pregnancy') return { ok: false, error: '没有这个孕期档案' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(birthDate || ''))) return { ok: false, error: '请填出生日期' }
  const list = (babies || []).map((b) => ({ name: String(b?.name || '').trim(), sex: String(b?.sex || '').trim() })).filter((b) => b.name)
  if (!list.length) return { ok: false, error: '至少填一个宝宝的小名' }
  if (list.length > 4) return { ok: false, error: '一次最多建 4 个宝宝' }
  const existing = [...(config.children || [])]
  const created = []
  for (const b of list) {
    const id = 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
    const workspace = childWorkspacePath(config.workspace, b.name, id, existing)
    const child = { id, name: b.name, birthDate, sex: b.sex, workspace, stage: 'newborn', stageDetail: '', dueDate: '', avatar: '', avatarColor: '#D24B36', keyMetrics: [], kind: 'child', pregnancyId: pregnancy.id, dev: false, born: false }
    existing.push(child)
    created.push(child)
  }
  const nextChildren = existing.map((c) => c.id === pregnancy.id ? { ...c, born: true } : c)
  return { ok: true, pregnancy, created, nextChildren }
}
