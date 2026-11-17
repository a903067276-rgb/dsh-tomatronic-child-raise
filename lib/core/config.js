/**
 * 配置：孩子列表、工作区、地区、模式、自动提交。
 * 配置落在 profile 的 cordis.patch.yml（设置页保存即热生效）。
 */
import { homedir } from 'node:os'
import { join } from 'node:path'
import z from '@deepseek-ai/schemastery'

export const DEFAULT_WORKSPACE = join(homedir(), 'Documents', 'DSH', 'child-doc')

export const Config = z.object({
  workspace: z.string().default(''),
  contentDir: z.string().default('docs'),
  region: z.string().default('cn'),
  country: z.string().default('中国'),
  city: z.string().default(''),
  mode: z.string().default('real'),
  devMode: z.boolean().default(false),
  crossChatCapture: z.boolean().default(false),
  userName: z.string().default(''),
  userRole: z.string().default(''),
  motherName: z.string().default(''),
  privacyMode: z.boolean().default(false),
  autoCommit: z.boolean().default(true),
  children: z.array(z.object({
    id: z.string(),
    name: z.string(),
    birthDate: z.string().default(''),
    sex: z.string().default(''),
    workspace: z.string().default(''),
    stage: z.string().default(''),
    stageDetail: z.string().default(''),
    dueDate: z.string().default(''),
    dueDateSource: z.string().default(''),
    dueDateHospital: z.string().default(''),
    dueDateUpdatedAt: z.string().default(''),
    lmp: z.string().default(''),
    ultrasoundDate: z.string().default(''),
    ultrasoundGaDays: z.number().default(0),
    nextCheckup: z.string().default(''),
    avatar: z.string().default(''),
    avatarColor: z.string().default('#D24B36'),
    keyMetrics: z.array(z.string()).default([]),
    kind: z.string().default('child'),
    pregnancyId: z.string().default(''),
    dev: z.boolean().default(false),
    born: z.boolean().default(false),
  })).default([]),
  realNames: z.array(z.string()).default([]),
  panels: z.object({
    growth: z.boolean().default(true),
    records: z.boolean().default(true),
    assessment: z.boolean().default(true),
  }).default({}),
})

/** 读取 volatile 引用（新宿主给 { get() }）。 */
export function refValue(ref) {
  try {
    if (ref !== null && typeof ref === 'object' && typeof ref.get === 'function') return ref.get()
    return ref
  } catch {
    return undefined
  }
}

/** 把配置归一成内部结构（带默认值和路径展开）。 */
export function resolveConfig(raw) {
  const cfg = raw ?? {}
  const workspace = expandHome(refValue(cfg.workspace) || DEFAULT_WORKSPACE)
  const children = (refValue(cfg.children) || []).map((c) => ({
    id: String(c.id || '').trim(),
    name: String(c.name || '').trim(),
    birthDate: String(c.birthDate || '').trim(),
    sex: String(c.sex || '').trim(),
    workspace: expandHome(refValue(c.workspace) || ''),
    stage: String(c.stage || '').trim(),
    stageDetail: String(c.stageDetail || '').trim(),
    dueDate: String(c.dueDate || '').trim(),
    dueDateSource: String(c.dueDateSource || '').trim(),
    dueDateHospital: String(c.dueDateHospital || '').trim(),
    dueDateUpdatedAt: String(c.dueDateUpdatedAt || '').trim(),
    lmp: String(c.lmp || '').trim(),
    ultrasoundDate: String(c.ultrasoundDate || '').trim(),
    ultrasoundGaDays: Number(c.ultrasoundGaDays || 0),
    nextCheckup: String(c.nextCheckup || '').trim(),
    avatar: String(c.avatar || '').trim(),
    avatarColor: String(c.avatarColor || '#D24B36'),
    keyMetrics: Array.isArray(c.keyMetrics) ? c.keyMetrics : [],
    kind: String(c.kind || 'child'),
    pregnancyId: String(c.pregnancyId || '').trim(),
    dev: c.dev === true,
    born: c.born === true,
  })).filter((c) => c.id !== '' && c.name !== '')
  return {
    workspace,
    contentDir: String(refValue(cfg.contentDir) || 'docs').replace(/^\/+|\/+$/g, '') || 'docs',
    region: String(refValue(cfg.region) || 'cn'),
    country: String(refValue(cfg.country) || '中国'),
    city: String(refValue(cfg.city) || ''),
    mode: String(refValue(cfg.mode) || 'real'),
    devMode: refValue(cfg.devMode) === true,
    crossChatCapture: refValue(cfg.crossChatCapture) === true,
    userName: String(refValue(cfg.userName) || ''),
    userRole: String(refValue(cfg.userRole) || ''),
    motherName: String(refValue(cfg.motherName) || ''),
    privacyMode: refValue(cfg.privacyMode) === true,
    autoCommit: refValue(cfg.autoCommit) !== false,
    children,
    realNames: refValue(cfg.realNames) || [],
  }
}

export function expandHome(p) {
  const t = String(p == null ? '' : p).trim()
  if (t === '') return ''
  if (t === '~') return homedir()
  if (t.startsWith('~/')) return join(homedir(), t.slice(2))
  return t
}
