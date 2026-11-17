/**
 * store：单写入口。
 * 表单、工具、聊天都调这里；隐私扫描 / 格式 / 原子写 / git 只在这一层做。
 */
import { existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import {
  commitArchive,
  computeAge,
  insertGrowthRow,
  insertTimelineRow,
  markTodoDone,
  parseGrowth,
  parseTables,
  parseTimeline,
  parseTodos,
  readArchive,
  todayISO,
} from './archive.js'
import { ensureWorkspace, readText, writeFileAtomic, workspacePaths } from './workspace.js'
import { docPath, matchesBase } from './file-names.js'
import { stageOf, stageInfo, buildAssess, buildCheckup } from '../features/stages.js'
import { growthRef } from '../features/growth-standards.js'
import { VACCINE_SCHEDULE, VACCINE_SOURCE, compareVaccines } from '../features/vaccines.js'
import { buildNutritionCompare } from '../features/nutrition.js'
import { buildStageGuide } from '../features/stage-guide.js'
import { buildExpenseEstimate } from '../features/expense-estimate.js'
import { privacyMessage, scanPrivacy } from './privacy.js'

const WRITES = new Map()

/** 最近写入（内存，给看板做“已更新”回执卡；重启即清）。 */
export function recentWrites(childId, after = 0) {
  const arr = WRITES.get(childId) || []
  return arr.filter((w) => w.at > after).slice(-10)
}

function rememberWrite(childId, kind, label, date, receipt) {
  if (!childId) return
  const arr = WRITES.get(childId) || []
  arr.push({ at: Date.now(), kind, label, date, receipt })
  if (arr.length > 50) arr.splice(0, arr.length - 50)
  WRITES.set(childId, arr)
}

export function childOf(config, childId) {
  if (childId !== undefined && childId !== null && String(childId).trim() !== '') {
    return config.children.find((c) => c.id === String(childId))
  }
  return config.children[0]
}

export function missingProfileFields(child, config) {
  const out = []
  const stage = child && child.stage && child.stage.key ? child.stage.key : child?.stage
  if (!child?.birthDate && !['preconception', 'pregnancy'].includes(stage)) out.push('生日')
  if (!child?.sex) out.push('性别')
  if (stage === 'pregnancy' && !child?.dueDate) out.push('预产期')
  if (!config?.country) out.push('国家/地区')
  if (!config?.city) out.push('城市')
  if (stage === 'pregnancy' && !child?.dueDateHospital) out.push('医院预产期')
  return out
}

export function childSummary(child, config) {
  const today = todayISO()
  const age = computeAge(child.birthDate, today)
  const months = age ? age.months : undefined
  return {
    id: child.id,
    name: child.name,
    birthDate: child.birthDate,
    sex: child.sex,
    workspace: child.workspace || (config && config.workspace) || '',
    dueDate: child.dueDate || '',
    dueDateSource: child.dueDateSource || '',
    dueDateHospital: child.dueDateHospital || '',
    dueDateUpdatedAt: child.dueDateUpdatedAt || '',
    lmp: child.lmp || '',
    ultrasoundDate: child.ultrasoundDate || '',
    ultrasoundGaDays: child.ultrasoundGaDays || 0,
    nextCheckup: child.nextCheckup || '',
    avatar: child.avatar || '',
    avatarColor: child.avatarColor || '#D24B36',
    keyMetrics: child.keyMetrics || [],
    kind: child.kind || 'child',
    pregnancyId: child.pregnancyId || '',
    dev: child.dev === true,
    born: child.born === true,
    stageDetail: child.stageDetail || '',
    months,
    ageText: age ? age.text : (child.stage ? '阶段档案' : '月龄未知'),
    ageShort: age ? age.months + ' 个月' : '月龄未知',
    stage: (child.stage && stageInfo(child.stage)) || stageOf(months),
  }
}

export function status(config) {
  const { root, docs } = workspacePaths(config)
  return {
    workspace: root,
    docs,
    exists: existsSync(root),
    mode: config.mode,
    devMode: config.devMode === true,
    crossChatCapture: config.crossChatCapture === true,
    userName: config.userName || '',
    userRole: config.userRole || '',
    motherName: config.motherName || '',
    privacyMode: config.privacyMode === true,
    region: config.region,
    country: config.country || '中国',
    city: config.city || '',
    children: config.children.map((c) => childSummary(c, config)),
  }
}

export function load(config, childId, { ensure = false } = {}) {
  const child = childOf(config, childId)
  if (!child) return { ok: false, error: childId ? '找不到这个孩子：' + childId : '还没有孩子档案：先建档案（设置页/首启）' }
  const wsConfig = { ...config, workspace: child.workspace || config.workspace }
  const { root, docs } = workspacePaths(wsConfig)
  if (ensure && !existsSync(docs)) {
    // 首启时由 onboard 调用；普通读不隐式建
    ensureWorkspace(wsConfig, child)
  }
  const archive = readArchive(docs, child.name)
  if (!archive.ok) return { ok: false, error: archive.error, child: childSummary(child, config) }
  return { ok: true, child, summary: childSummary(child, config), archive, root, docs }
}

function buildExpenseRows(archive) {
  const file = fileOf(archive, '育儿花费')
  if (!file) return []
  const table = parseTables(file.content).find((t) => t.header.includes('日期') && t.header.some((h) => h.includes('金额')))
  if (!table) return []
  const at = (r, name) => { const i = table.header.findIndex((h) => h.includes(name)); return i >= 0 ? (r.cells[i] || '') : '' }
  return table.rows.map((r) => {
    const category = at(r, '类别') || '其他'
    const payer = at(r, '支付人')
    const note = at(r, '备注')
    return {
      date: at(r, '日期'), category, item: at(r, '项目'),
      amount: Number(String(at(r, '金额')).replace(/[^0-9.-]/g, '')) || 0,
      payer, note,
      estimated: category.includes('预估') || payer === '估算' || note.includes('预估'),
    }
  }).filter((r) => r.date || r.item || r.amount)
}

function summarizeExpenses(rows) {
  const all = rows || []
  const actual = all.filter((r) => !r.estimated)
  const estimated = all.filter((r) => r.estimated)
  const sum = (list) => list.reduce((a, r) => a + (Number(r.amount) || 0), 0)
  const total = sum(actual)
  const actualTotal = total
  const estimatedTotal = sum(estimated)
  const thisMonth = todayISO().slice(0, 7)
  const monthRows = actual.filter((r) => String(r.date || '').slice(0, 7) === thisMonth)
  const byCategory = {}
  const byMonth = {}
  for (const r of actual) {
    const c = r.category || '其他'
    byCategory[c] = byCategory[c] || { category: c, amount: 0, count: 0 }
    byCategory[c].amount += Number(r.amount) || 0
    byCategory[c].count += 1
    const m = String(r.date || '').slice(0, 7)
    if (m) {
      byMonth[m] = byMonth[m] || { key: m, amount: 0, count: 0 }
      byMonth[m].amount += Number(r.amount) || 0
      byMonth[m].count += 1
    }
  }
  return {
    total, actualTotal, estimatedTotal, actualCount: actual.length, estimatedCount: estimated.length, count: actual.length,
    month: thisMonth, monthTotal: sum(monthRows), monthCount: monthRows.length,
    byCategory: Object.values(byCategory).sort((a, b) => b.amount - a.amount),
    byMonth: Object.values(byMonth).sort((a, b) => (a.key < b.key ? -1 : 1)),
  }
}

const MILK_TYPES = ['母乳', '奶粉', '水奶', '牛奶', '混合', '其他']
function buildMilkRows(archive) {
  const canonical = fileOf(archive, '奶记录')
  if (canonical) {
    const table = parseTables(canonical.content).find((t) => t.header.includes('日期') && (t.header.some((h) => h.includes('品种')) || t.header.some((h) => h.includes('类型'))) && t.header.some((h) => h.includes('量')))
    if (!table) return []
    const at = (r, name) => { const i = table.header.findIndex((h) => h.includes(name)); return i >= 0 ? (r.cells[i] || '') : '' }
    return table.rows.map((r) => ({
      date: at(r, '日期'), type: (() => { const t = at(r, '品种') || at(r, '类型') || '其他'; return t === '奶粉' ? '配方奶' : t })(),
      brand: at(r, '品牌'), amount: Number(String(at(r, '量')).replace(/[^0-9.-]/g, '')) || 0,
      time: at(r, '时间'), label: at(r, '标签'), estimate: at(r, '估算'), note: at(r, '备注'),
      formula: /配方奶|奶粉|水奶/.test(String(at(r, '品种') || at(r, '类型') || '')),
    })).filter((r) => r.date || r.amount)
  }
  // 旧档案：奶类记录 + 奶粉记录合并；新档案统一写“奶记录”。
  const file = fileOf(archive, '奶类记录')
  const rows = []
  if (file) {
    const table = parseTables(file.content).find((t) => t.header.includes('日期') && t.header.some((h) => h.includes('类型')) && t.header.some((h) => h.includes('量')))
    if (table) {
      const at = (r, name) => { const i = table.header.findIndex((h) => h.includes(name)); return i >= 0 ? (r.cells[i] || '') : '' }
      for (const r of table.rows) rows.push({ date: at(r, '日期'), type: at(r, '类型') || '其他', amount: Number(String(at(r, '量')).replace(/[^0-9.-]/g, '')) || 0, time: at(r, '时间'), note: at(r, '备注') })
    }
  }
  for (const f of buildFormulaRows(archive)) {
    if (rows.some((x) => x.date === f.date && String(x.type || '').includes('奶粉'))) continue
    const text = String(f.intake || '') + ' ' + String(f.estimate || '') + ' ' + String(f.water || '')
    const m = /约\s*(\d+(?:\.\d+)?)\s*m[lL]/i.exec(text) || /(\d+(?:\.\d+)?)\s*m[lL]/i.exec(text)
    const amount = m ? Number(m[1]) : 0
    if (f.date && amount) rows.push({ date: f.date, type: '奶', amount, time: '', note: '来自奶粉记录', derived: true })
  }
  return rows.filter((r) => r.date || r.amount)
}

function applyMilkRows(rows, milkRows) {
  if (!Array.isArray(rows) || !Array.isArray(milkRows) || !milkRows.length) return
  const byDate = new Map()
  for (const r of milkRows) {
    if (!r.date) continue
    const cur = byDate.get(r.date) || { amount: 0, count: 0, types: new Set() }
    cur.amount += Number(r.amount) || 0
    cur.count += 1
    if (r.type) cur.types.add(r.type)
    byDate.set(r.date, cur)
  }
  for (const row of rows) {
    const m = byDate.get(row.date)
    if (!m) continue
    row.milkMl = m.amount
    row.milkCount = m.count
    row.milk = (m.types.size ? [...m.types].join('/') : '奶') + ' ' + m.amount + 'ml'
  }
  for (const [date, m] of byDate) {
    if (rows.some((row) => row.date === date)) continue
    rows.push({ date, months: '', milk: (m.types.size ? [...m.types].join('/') : '奶') + ' ' + m.amount + 'ml', poop: '', pee: '', water: '', food: '', supplement: '', time: '', note: '', milkMl: m.amount, milkCount: m.count, poopCount: 0, peeCount: 0, waterMl: 0, waterCount: 0 })
  }
  rows.sort((a, b) => (a.date < b.date ? 1 : -1))
}

function summarizeMilk(rows) {
  const byType = {}
  for (const r of rows || []) {
    const t = r.type || '其他'
    byType[t] = byType[t] || { type: t, amount: 0, count: 0 }
    byType[t].amount += Number(r.amount) || 0
    byType[t].count += 1
  }
  const total = Object.values(byType).reduce((a, x) => a + x.amount, 0)
  return { total, byType: Object.values(byType).sort((a, b) => b.amount - a.amount) }
}

function buildDailyEvents(archive) {
  const file = fileOf(archive, '日常明细')
  if (!file) return []
  const table = parseTables(file.content).find((t) => t.header.includes('日期') && t.header.some((h) => h.includes('类别')))
  if (!table) return []
  const at = (r, name) => { const i = table.header.findIndex((h) => h.includes(name)); return i >= 0 ? (r.cells[i] || '') : '' }
  return table.rows.map((r) => ({
    date: at(r, '日期'), time: at(r, '时间'), category: at(r, '类别'),
    amount: at(r, '数量'), note: at(r, '备注'),
  })).filter((r) => r.date && (r.category || r.amount))
}

function extractNutrients(text) {
  const out = []
  const re = /(维生素\s*[ADCE]3?|DHA|EPA|铁|钙|锌|益生菌)\s*[:：]?\s*([0-9]+(?:\.[0-9]+)?)\s*(IU|mg|μg|ug|g|亿|CFU)?/gi
  let m
  while ((m = re.exec(String(text || ''))) !== null) {
    out.push({ name: m[1].replace(/\s+/g, ''), amount: Number(m[2]), unit: m[3] || '' })
  }
  return out
}
function buildSupplementDetailRows(archive) {
  const file = fileOf(archive, '补剂明细')
  if (!file) return []
  const table = parseTables(file.content).find((t) => t.header.includes('日期') && t.header.some((h) => h.includes('名称')))
  if (!table) return []
  const at = (r, name) => { const i = table.header.findIndex((h) => h.includes(name)); return i >= 0 ? (r.cells[i] || '') : '' }
  return table.rows.map((r) => {
    const ingredients = at(r, '成分')
    return {
      date: at(r, '日期'), time: at(r, '时间'), name: at(r, '名称'),
      amount: at(r, '数量'), unit: at(r, '单位'), ingredients, note: at(r, '备注'),
      nutrients: extractNutrients(ingredients),
    }
  }).filter((r) => r.date && (r.name || r.ingredients))
}
function summarizeSupplementDetails(rows) {
  const by = {}
  for (const r of rows || []) {
    for (const n of r.nutrients || []) {
      const key = n.name + '|' + n.unit
      by[key] = by[key] || { name: n.name, unit: n.unit, amount: 0, count: 0 }
      by[key].amount += n.amount
      by[key].count += 1
    }
  }
  return { byNutrient: Object.values(by).sort((a, b) => b.amount - a.amount), count: (rows || []).length }
}

function sleepMinutes(start, end) {
  const a = String(start || '').match(/^(\d{1,2}):(\d{2})$/)
  const b = String(end || '').match(/^(\d{1,2}):(\d{2})$/)
  if (!a || !b) return 0
  const mins = (Number(b[1]) * 60 + Number(b[2])) - (Number(a[1]) * 60 + Number(a[2]))
  return mins > 0 ? mins : mins + 24 * 60
}
function buildSleepRows(archive) {
  const file = fileOf(archive, '睡眠记录')
  if (!file) return []
  const table = parseTables(file.content).find((t) => t.header.includes('日期') && t.header.some((h) => h.includes('入睡')))
  if (!table) return []
  const at = (r, name) => { const i = table.header.findIndex((h) => h.includes(name)); return i >= 0 ? (r.cells[i] || '') : '' }
  return table.rows.map((r) => ({
    date: at(r, '日期'), type: at(r, '类型') || '夜间',
    start: at(r, '入睡'), end: at(r, '醒来'),
    minutes: Number(String(at(r, '时长')).replace(/[^0-9.-]/g, '')) || 0,
    nightWakes: Number(String(at(r, '夜醒')).replace(/[^0-9.-]/g, '')) || 0,
    note: at(r, '备注'),
  })).filter((r) => r.date && (r.minutes || r.start || r.end))
}
function buildCarryOver(archive, records) {
  const today = todayISO()
  const todayRecord = (records || []).find((r) => r.date === today) || {}
  const out = []
  const supps = buildRegimenRows(archive, '特殊补剂').filter((r) => r.name && (!r.end || r.end >= today))
  const todayDetails = buildSupplementDetailRows(archive).filter((r) => r.date === today)
  for (const r of supps.slice(0, 2)) {
    if (String(todayRecord.supplement || '').includes(r.name)) continue
    if (todayDetails.some((x) => String(x.name || '').includes(r.name))) continue
    const ageDays = r.start ? Math.max(0, Math.round((new Date(today) - new Date(r.start)) / 86400000)) : 0
    out.push({
      key: 'supp-' + r.name, label: '补剂：' + [r.name, r.dose].filter(Boolean).join(' ') + (ageDays > 7 ? '（' + ageDays + ' 天前，按阶段估）' : ''), kind: 'record',
      estimated: ageDays > 7, ageDays,
      payload: { category: 'supplement', text: [r.name, r.dose].filter(Boolean).join(' '), time: r.time || '', note: ageDays > 7 ? '沿用/按阶段估算' : '沿用' },
    })
  }
  // 睡眠不提供“沿用昨晚”：日期语义是入睡当天，复制到今天会造成重复/错日。
  return out
}

function summarizeSleep(rows) {
  const all = rows || []
  const totalMinutes = all.reduce((a, r) => a + (Number(r.minutes) || 0), 0)
  const nights = all.filter((r) => r.type !== '午睡').length
  const byDayMap = new Map()
  for (const r of all) {
    if (!r.date) continue
    const cur = byDayMap.get(r.date) || { date: r.date, minutes: 0, naps: 0, nightWakes: 0 }
    cur.minutes += Number(r.minutes) || 0
    if (r.type === '午睡') cur.naps += 1
    cur.nightWakes += Number(r.nightWakes) || 0
    byDayMap.set(r.date, cur)
  }
  const byDay = [...byDayMap.values()].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 7)
  return {
    count: all.length, totalMinutes, avgMinutes: all.length ? Math.round(totalMinutes / all.length) : 0,
    nights, nightWakes: all.reduce((a, r) => a + (Number(r.nightWakes) || 0), 0),
    byDay,
  }
}

export function overview(config, childId) {
  const loaded = load(config, childId)
  if (!loaded.ok) return loaded
  const { archive, summary, docs } = loaded
  const timeline = archive.timeline ? parseTimeline(archive.timeline.content) : []
  const growth = archive.growth ? parseGrowth(archive.growth.content) : []
  const todos = archive.todos ? parseTodos(archive.todos.content) : { open: 0, total: 0, sections: [] }
  const recent = timeline.slice(-5).reverse()
  const latestGrowth = growth[growth.length - 1]
  const assess = buildAssess(summary.months)
  const todoItems = []
  for (const sec of todos.sections || []) {
    for (const item of sec.items || []) {
      if (!item.done) todoItems.push({ section: sec.title, text: item.title || item.text, raw: item.text, date: item.date || '', time: item.time || '' })
    }
  }
  todoItems.sort((a, b) => {
    if (a.date && b.date) return (a.date + (a.time || '')).localeCompare(b.date + (b.time || ''))
    if (a.date) return -1
    if (b.date) return 1
    return 0
  })
  const allRecordRows = buildRecordRows(archive, Infinity)
  const records = allRecordRows.slice(0, 60)
  const dailyEvents = buildDailyEvents(archive)
  const sleepRows = buildSleepRows(archive)
  const sleepSummary = summarizeSleep(sleepRows)
  const carryOver = buildCarryOver(archive, records)
  const supplementRows = buildSupplementDetailRows(archive)
  const supplementSummary = summarizeSupplementDetails(supplementRows)
  const milkRows = buildMilkRows(archive)
  const milkSummary = summarizeMilk(milkRows)
  applyMilkRows(allRecordRows, milkRows)
  applyMilkRows(records, milkRows)
  const expenseRows = buildExpenseRows(archive)
  const formulaRows = buildFormulaRows(archive)
  const foodRows = buildFoodRows(archive)
  const checkupRows = buildCheckupRows(archive)
  const pregnancyData = buildPregnancyData(archive)
  const vaccineRows = buildVaccineRows(archive)
  const vaccinePlanRows = buildVaccinePlanRows(archive)
  const expenseEstimate = buildExpenseEstimate({ stage: summary.stage && summary.stage.key, months: summary.months, recordRows: records, formulaRows, foodRows, checkupRows, pregnancy: pregnancyData })
  const actualCategories = new Set(expenseRows.filter((r) => !r.estimated).map((r) => r.category))
  const estimateCategory = (label) => label.includes('奶') ? '奶粉' : label.includes('尿布') ? '尿布' : label.includes('辅食') ? '辅食' : label.includes('体检') || label.includes('医疗') ? '医疗' : label.includes('孕期') || label.includes('营养') ? '孕期' : '其他'
  const autoItems = expenseEstimate.ok ? expenseEstimate.breakdown.filter((x) => !actualCategories.has(estimateCategory(x.label))).map((x) => ({ ...x, category: estimateCategory(x.label) })) : []
  const autoEstimate = { ...expenseEstimate, ok: expenseEstimate.ok && autoItems.length > 0, items: autoItems, monthly: autoItems.reduce((a, x) => a + (Number(x.amount) || 0), 0) }
  const expenseSummary = { ...summarizeExpenses(expenseRows), autoEstimate }
  const customForms = parseCustomForms(docs)
  const pending = readPendingFile(docs).filter((x) => x.status !== 'done')
  const customRecent = customForms.map((f) => {
    const recs = readCustomRowsFromDocs(docs, f)
    const row = recs.ok && recs.rows && recs.rows.length ? recs.rows[recs.rows.length - 1] : null
    if (!row) return null
    const date = row['日期'] || ''
    const value = f.fields.map((x) => row[x.label]).find((x) => x) || ''
    return { date, label: f.name + (value ? '：' + value : '') }
  }).filter(Boolean).sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 4)
  return {
    ok: true,
    country: config.country || '中国',
    city: config.city || '',
    revision: (archive.files || []).map((f) => f.name + ':' + f.mtimeMs + ':' + f.content.length).join('|'),
    child: summary,
    missing: missingProfileFields(summary, config),
    profile: profileHeadline(archive.profile?.content || ''),
    timeline: recent,
    growth: latestGrowth ? { ...latestGrowth, count: growth.length } : undefined,
    growthRows: growth,
    recordRows: records,
    dailyEvents,
    sleepRows,
    sleepSummary,
    carryOver,
    supplementRows,
    supplementSummary,
    milkRows,
    milkSummary,
    vaccineRows,
    vaccinePlanRows,
    checkupRows,
    milestoneRows: buildMilestoneRows(archive),
    specialSupplementRows: buildRegimenRows(archive, '特殊补剂'),
    formulaRows,
    foodRows,
    expenseRows,
    expenseSummary,
    expenseEstimate,
    personality: buildPersonalityRows(archive),
    customForms,
    customRecent,
    pending,
    assessHistory: buildAssessHistory(archive),
    hospitalAssess: buildHospitalAssess(archive),
    prep: buildPrepData(archive),
    pregnancy: { ...pregnancyData, basic: buildPregnancyBasic(archive), reports: buildPregnancyReports(archive), meds: buildPregnancyMeds(archive), meals: buildPregnancyMeals(archive), week: pregnancyWeek(summary.dueDate), dueDate: summary.dueDate || '', dueDateSource: summary.dueDateSource || '', dueDateHospital: summary.dueDateHospital || '', dueDateUpdatedAt: summary.dueDateUpdatedAt || '', lmp: summary.lmp || '', ultrasoundDate: summary.ultrasoundDate || '', ultrasoundGaDays: summary.ultrasoundGaDays || 0, nextCheckup: summary.nextCheckup || '' },
    stageGuide: buildStageGuide(summary.stage && summary.stage.key, summary.months, pregnancyWeek(summary.dueDate)),
    hospitalBag: buildBag(archive),
    medicationRows: buildRegimenRows(archive, '用药'),
    routine: { week: summarizeRoutine(records.filter((r) => !r.inferred), 7), month: summarizeRoutine(records.filter((r) => !r.inferred), 30) },
    todos: { open: todos.open, total: todos.total, items: todoItems.slice(0, 6) },
    assess,
    growthRef: growthRef(summary.sex),
    vaccineSchedule: VACCINE_SCHEDULE,
    vaccineSource: VACCINE_SOURCE,
    vaccineCompare: compareVaccines(vaccineRows, vaccinePlanRows, summary.months),
    dailyAggregates: buildDailyAggregates(archive, allRecordRows),
    nutritionCompare: buildNutritionCompare(foodRows, formulaRows, summary.months, (growth[growth.length - 1] || {}).weight, milkRows),
  }
}

function fileOf(archive, prefix) {
  const base = String(prefix || '').replace(/\.md$/i, '')
  const exactLegacy = (archive.files || []).find((f) => f.name === base + '.md')
  if (exactLegacy && String(exactLegacy.content || '').trim()) return exactLegacy
  const list = (archive.files || []).filter((f) => f.name.startsWith(prefix) || matchesBase(f.name, prefix))
  return list.find((f) => String(f.content || '').trim()) || list[0]
}

function firstTable(file) {
  if (!file) return undefined
  return parseTables(file.content)[0]
}

function pad2(n) { return String(n).padStart(2, '0') }

/** 日常表按天合并；疫苗/体检/里程碑/补剂/用药各自单独。 */
function buildRecordRows(archive, limit = 60) {
  const byDate = new Map()
  const ensure = (date) => {
    if (!date) return undefined
    let row = byDate.get(date)
    if (!row) {
      row = {
        date, months: '', milk: '', poop: '', pee: '', water: '', food: '', supplement: '', time: '', note: '',
        milkMl: 0, milkCount: 0, poopCount: 0, peeCount: 0, waterMl: 0, waterCount: 0, inferred: false,
      }
      byDate.set(date, row)
    }
    return row
  }
  const daily = firstTable(fileOf(archive, '日常记录'))
  if (daily) {
    const H = daily.header
    const at = (cells, name) => {
      const i = H.findIndex((h) => h.includes(name))
      return i >= 0 ? (cells[i] || '') : ''
    }
    for (const r of daily.rows) {
      const date = at(r.cells, '日期')
      const row = ensure(date)
      if (!row) continue
      row.months = row.months || at(r.cells, '月龄')
      row.milk = row.milk || at(r.cells, '奶')
      row.poop = row.poop || at(r.cells, '拉')
      row.pee = row.pee || at(r.cells, '尿')
      row.water = row.water || at(r.cells, '水')
      row.food = row.food || at(r.cells, '辅食')
      row.supplement = row.supplement || at(r.cells, '补剂')
      row.time = row.time || at(r.cells, '时间点')
      row.note = row.note || at(r.cells, '备注')
      if (/推定自/.test(row.note)) row.inferred = true
    }
  }
  const food = firstTable(fileOf(archive, '辅食记录'))
  if (food) {
    const H = food.header
    const at = (cells, name) => { const i = H.findIndex((h) => h.includes(name)); return i >= 0 ? (cells[i] || '') : '' }
    for (const r of food.rows) {
      const row = ensure(at(r.cells, '日期'))
      if (!row) continue
      if (!row.food) row.food = [at(r.cells, '食物'), at(r.cells, '食材')].filter(Boolean).join(' · ')
    }
  }
  const out = [...byDate.values()].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, limit)
  for (const row of out) {
    const milk = parseAmount(row.milk)
    const poop = parseAmount(row.poop)
    const pee = parseAmount(row.pee)
    const water = parseAmount(row.water)
    row.milkMl = milk.ml
    row.milkCount = milk.count
    row.poopCount = poop.count
    row.peeCount = pee.count
    row.waterMl = water.ml
    row.waterCount = water.count
  }
  return out
}

function buildDailyAggregates(archive, inputRows) {
  const rows = inputRows || buildRecordRows(archive, Infinity)
  const blank = () => ({ days: 0, milkMl: 0, milkCount: 0, poopCount: 0, peeCount: 0, waterMl: 0, waterCount: 0, supplementDays: 0 })
  const add = (a, r) => {
    a.days += 1
    a.milkMl += r.milkMl || 0; a.milkCount += r.milkCount || 0
    a.poopCount += r.poopCount || 0; a.peeCount += r.peeCount || 0
    a.waterMl += r.waterMl || 0; a.waterCount += r.waterCount || 0
    if (r.supplement) a.supplementDays += 1
    return a
  }
  const months = new Map()
  const years = new Map()
  const total = blank()
  for (const r of rows) {
    if (r.inferred) continue
    const d = String(r.date || '')
    if (!/^\d{4}-\d{2}/.test(d)) continue
    const mk = d.slice(0, 7), yk = d.slice(0, 4)
    if (!months.has(mk)) months.set(mk, blank())
    if (!years.has(yk)) years.set(yk, blank())
    add(months.get(mk), r); add(years.get(yk), r); add(total, r)
  }
  const list = (m) => [...m.entries()].map(([key, a]) => ({ key, ...a })).sort((x, y) => (x.key < y.key ? 1 : -1))
  return { months: list(months), years: list(years), total }
}

function parseAmount(text) {
  const s = String(text || '')
  const ml = s.match(/(\d+(?:\.\d+)?)\s*(?:ml|毫升)/i)
  const times = s.match(/(\d+)\s*次/)
  return { ml: ml ? Number(ml[1]) : 0, count: times ? Number(times[1]) : 0 }
}

function buildVaccineRows(archive) {
  const file = fileOf(archive, '数据-生长与健康')
  if (!file) return []
  const table = parseTables(file.content).find((t) => t.header.includes('疫苗'))
  if (!table) return []
  return table.rows
    .map((r) => ({ date: r.cells[0], name: r.cells[1], dose: r.cells[2], months: r.cells[3], reaction: r.cells[4] }))
    .filter((r) => r.date !== '')
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}

function buildVaccinePlanRows(archive) {
  const file = fileOf(archive, '疫苗计划')
  if (!file) return []
  const table = parseTables(file.content).find((t) => t.header.includes('官方疫苗') && t.header.includes('实际疫苗'))
  if (!table) return []
  const H = table.header
  const at = (cells, name) => { const i = H.findIndex((h) => h.includes(name)); return i >= 0 ? (cells[i] || '') : '' }
  return table.rows.map((r) => ({
    official: at(r.cells, '官方疫苗'), officialDose: at(r.cells, '官方针次'),
    actual: at(r.cells, '实际疫苗'), actualDose: at(r.cells, '实际针次'),
    months: at(r.cells, '月龄'), note: at(r.cells, '说明'),
  })).filter((x) => x.official && x.actual)
}

function buildCheckupRows(archive) {
  const file = fileOf(archive, '数据-生长与健康')
  if (!file) return []
  const table = parseTables(file.content).find((t) => t.header.includes('项目') && t.header.includes('结果'))
  if (!table) return []
  const H = table.header
  const at = (cells, name) => { const i = H.findIndex((h) => h.includes(name)); return i >= 0 ? (cells[i] || '') : '' }
  return table.rows
    .map((r) => ({
      date: at(r.cells, '日期'), months: at(r.cells, '月龄'), item: at(r.cells, '项目'),
      result: at(r.cells, '结果'), advice: at(r.cells, '医生建议'),
    }))
    .filter((r) => r.date !== '')
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}

export function isMilestoneText(text) {
  const s = String(text || '')
  if (!s) return false
  // 第一次/首次永远算里程碑
  if (/第一次|首次/.test(s)) return true
  // 阶段性突破
  if (/里程碑|突破|觉醒|爆发|如厕|内裤|小马桶/.test(s)) return true
  // 不是里程碑的日常/健康/文字记录
  if (/入睡|睡眠|夜醒|哄睡|作息|早上\s*\d|夜里|睡前|午睡|奶量|午饭|晚饭|早饭|水果|果汁|大便|尿不湿|户外|看手机|屏幕|规则|写["“]|封信|菜谱|生日|宴|阅兵|职业|老师|工作|天气|过敏|发烧|生病/.test(s)) return false
  // 开始会走/说/自己吃等具体能力，不算“开始怕/开始看手机”
  if (/开始[^，。；]{0,10}(?:会|能|走|跑|坐|站|爬|说|叫|吃|穿|用|自己|独立|如厕|翻身|抬头)/.test(s)) return true
  // 会……了 / 能……了：只收短句能力描述
  if (/(?:会|能)(?![一儿])[^，。；]{0,10}了/.test(s) && !/不会|不能|会不会|能不能/.test(s)) return true
  // 明确的独立能力
  if (/(?:自己|独立)[^，。；]{0,8}(?:走|跑|坐|站|吃|穿|脱|用|睡|刷|洗|上厕所|坐马桶)/.test(s)) return true
  // 第一颗牙/断奶/入园等阶段节点
  if (/第一颗牙|断奶|戒奶嘴|入园|入托|上幼儿园/.test(s)) return true
  return false
}

function buildMilestoneRows(archive) {
  const source = archive.milestone || archive.timeline
  if (!source) return []
  return parseTimeline(source.content)
    .filter((t) => archive.milestone ? true : isMilestoneText(t.text))
    .map((t) => ({
      date: t.month ? (t.year + '-' + pad2(t.month) + '-' + pad2(t.day || 1)) : '',
      dateLabel: t.timeLabel || '',
      precision: t.day ? 'day' : 'month',
      months: String(t.ageMonths || ''), text: t.text, source: t.source || '',
    }))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}

function cleanFoodText(value) {
  return String(value || '')
    .replace(/^\s*(早餐|早饭|午餐|午饭|晚餐|晚饭|加餐|夜宵|点心)\s*[:：]?\s*/, '')
    .trim()
}

function buildFoodRows(archive) {
  const file = fileOf(archive, '辅食记录')
  const foodTable = file ? firstTable(file) : null
  const rows = []
  if (foodTable) {
    const H = foodTable.header
    const at = (cells, name) => { const i = H.findIndex((h) => h.includes(name)); return i >= 0 ? (cells[i] || '') : '' }
    for (const r of foodTable.rows) {
      const date = at(r.cells, '日期')
      if (!date) continue
      rows.push({
        date, time: at(r.cells, '时间'), foodType: at(r.cells, '类型') || '辅食', food: cleanFoodText(at(r.cells, '食物')),
        ingredients: at(r.cells, '食材'), quantity: at(r.cells, '份量'), nutrition: at(r.cells, '营养'), reaction: at(r.cells, '反应'), source: at(r.cells, '依据'),
      })
    }
  }
  // 兼容：聊天里用 record 记到「日常记录」的辅食，也在这里显示，不用重录。
  const daily = buildRecordRows(archive, Infinity).filter((r) => r.food)
  const seen = new Set(rows.map((r) => r.date + '|' + String(r.food || '').trim()))
  for (const r of daily) {
    const key = r.date + '|' + String(r.food || '').trim()
    if (seen.has(key)) continue
    seen.add(key)
    rows.push({ date: r.date, time: '', foodType: '辅食', food: cleanFoodText(r.food), ingredients: '', quantity: '', nutrition: '', reaction: '', source: '日常记录' })
  }
  return rows.sort((a, b) => (a.date < b.date ? 1 : -1))
}

function buildFormulaRows(archive) {
  const canonical = fileOf(archive, '奶记录')
  if (canonical) {
    const table = parseTables(canonical.content).find((t) => t.header.includes('日期') && (t.header.some((h) => h.includes('品种')) || t.header.some((h) => h.includes('类型'))) && t.header.some((h) => h.includes('量')))
    if (!table) return []
    const at = (r, name) => { const i = table.header.findIndex((h) => h.includes(name)); return i >= 0 ? (r.cells[i] || '') : '' }
    return table.rows.map((r) => ({
      date: at(r, '日期'), brand: at(r, '品牌'), water: '', intake: '', label: at(r, '标签'),
      estimate: at(r, '估算'), source: at(r, '备注'), amount: Number(String(at(r, '量')).replace(/[^0-9.-]/g, '')) || 0,
      milkType: at(r, '品种') || at(r, '类型') || '', derived: true,
    })).filter((r) => r.date && /配方奶|奶粉|水奶/.test(String(r.milkType || '')))
  }
  const file = fileOf(archive, '奶粉记录')
  if (!file) return []
  const table = firstTable(file)
  if (!table) return []
  const H = table.header
  const at = (cells, name) => { const i = H.findIndex((h) => h.includes(name)); return i >= 0 ? (cells[i] || '') : '' }
  return table.rows
    .map((r) => ({
      date: at(r.cells, '日期'), brand: at(r.cells, '品牌'), water: at(r.cells, '冲调量'),
      intake: at(r.cells, '实际摄入'), label: at(r.cells, '标签营养'), estimate: at(r.cells, '估算摄入'), source: at(r.cells, '依据'),
    }))
    .filter((r) => r.date !== '')
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}

export function buildHospitalAssess(archive) {
  const file = fileOf(archive, '医院评估')
  if (!file) return []
  const table = parseTables(file.content).find((t) => t.header.some((h) => h.includes('机构')) && t.header.some((h) => h.includes('结果')))
  if (!table) return []
  const H = table.header
  const at = (cells, name) => { const i = H.findIndex((h) => h.includes(name)); return i >= 0 ? (cells[i] || '') : '' }
  return table.rows.map((r) => ({
    date: at(r.cells, '日期'), months: at(r.cells, '月龄'), institution: at(r.cells, '机构'),
    tool: at(r.cells, '评估工具'), result: at(r.cells, '结果'), advice: at(r.cells, '医生建议'), note: at(r.cells, '备注'),
  })).filter((x) => x.date || x.result)
}

function buildAssessHistory(archive) {
  const file = fileOf(archive, '评估记录')
  if (!file) return []
  const table = parseTables(file.content).find((t) => t.header.includes('量表') && t.header.includes('结果'))
  if (!table) return []
  const H = table.header
  const at = (cells, name) => { const i = H.findIndex((h) => h.includes(name)); return i >= 0 ? (cells[i] || '') : '' }
  return table.rows.map((r) => ({
    date: at(r.cells, '日期'), months: at(r.cells, '月龄'), scale: at(r.cells, '量表'),
    result: at(r.cells, '结果'), next: at(r.cells, '下一步'),
  })).filter((x) => x.scale !== '')
}

function buildPersonalityRows(archive) {
  const file = fileOf(archive, '人格与偏好')
  if (!file) return []
  const table = parseTables(file.content).find((t) => t.header.includes('维度') && t.header.includes('观察'))
  if (!table) return []
  const H = table.header
  const at = (cells, name) => { const i = H.findIndex((h) => h.includes(name)); return i >= 0 ? (cells[i] || '') : '' }
  return table.rows.map((r) => ({
    date: at(r.cells, '日期'), dimension: at(r.cells, '维度'), observation: at(r.cells, '观察'),
    context: at(r.cells, '场景'), confidence: at(r.cells, '置信度'),
  })).filter((x) => x.observation !== '')
}

function buildPrepData(archive) {
  const file = fileOf(archive, '备孕记录')
  if (!file) return { cycles: [], checkups: [] }
  const tables = parseTables(file.content)
  const at = (H, cells, name) => { const i = H.findIndex((h) => h.includes(name)); return i >= 0 ? (cells[i] || '') : '' }
  const cycleTable = tables.find((t) => t.header.includes('开始日期') && t.header.some((h) => h.includes('周期')))
  const checkTable = tables.find((t) => t.header.includes('项目') && t.header.includes('结果'))
  const cycles = (cycleTable ? cycleTable.rows : []).map((r) => ({
    start: at(cycleTable.header, r.cells, '开始日期'), end: at(cycleTable.header, r.cells, '结束日期'),
    length: at(cycleTable.header, r.cells, '周期'), flow: at(cycleTable.header, r.cells, '经量'),
    note: at(cycleTable.header, r.cells, '备注'),
  })).filter((x) => x.start !== '')
  const checkups = (checkTable ? checkTable.rows : []).map((r) => ({
    date: at(checkTable.header, r.cells, '日期'), item: at(checkTable.header, r.cells, '项目'),
    result: at(checkTable.header, r.cells, '结果'), advice: at(checkTable.header, r.cells, '建议'),
  })).filter((x) => x.date !== '')
  return { cycles, checkups }
}

function buildPregnancyData(archive) {
  const file = fileOf(archive, '孕期记录')
  if (!file) return { vitals: [], checkups: [] }
  const tables = parseTables(file.content)
  const at = (H, cells, name) => { const i = H.findIndex((h) => h.includes(name)); return i >= 0 ? (cells[i] || '') : '' }
  const vitalTable = tables.find((t) => t.header.some((h) => h.includes('体重')) && t.header.some((h) => h.includes('收缩压')))
  const checkTable = tables.find((t) => t.header.some((h) => h.includes('孕周')) && t.header.includes('项目'))
  const vitals = (vitalTable ? vitalTable.rows : []).map((r) => ({
    date: at(vitalTable.header, r.cells, '日期'), week: at(vitalTable.header, r.cells, '孕周'),
    weight: at(vitalTable.header, r.cells, '体重'), systolic: at(vitalTable.header, r.cells, '收缩压'),
    diastolic: at(vitalTable.header, r.cells, '舒张压'), note: at(vitalTable.header, r.cells, '备注'),
  })).filter((x) => x.date !== '')
  const checkups = (checkTable ? checkTable.rows : []).map((r) => ({
    date: at(checkTable.header, r.cells, '日期'), week: at(checkTable.header, r.cells, '孕周'),
    item: at(checkTable.header, r.cells, '项目'), result: at(checkTable.header, r.cells, '结果'),
    advice: at(checkTable.header, r.cells, '医生建议'),
  })).filter((x) => x.date !== '')
  return { vitals, checkups }
}

function buildPregnancyBasic(archive) {
  const file = fileOf(archive, '孕期基本情况')
  if (!file) return {}
  const table = parseTables(file.content).find((t) => t.header.some((h) => h.includes('孕前体重')) && t.header.some((h) => h.includes('身高')))
  if (!table || !table.rows.length) return {}
  const H = table.header
  const at = (cells, name) => { const i = H.findIndex((h) => h.includes(name)); return i >= 0 ? (cells[i] || '') : '' }
  const cells = table.rows[0].cells
  return { dueDate: at(cells, '预产期'), preWeight: at(cells, '孕前体重'), height: at(cells, '身高') }
}

function buildPregnancyReports(archive) {
  const file = fileOf(archive, '孕检报告')
  if (!file) return []
  const table = parseTables(file.content).find((t) => t.header.includes('报告') && t.header.some((h) => h.includes('结论')))
  if (!table) return []
  const H = table.header
  const at = (cells, name) => { const i = H.findIndex((h) => h.includes(name)); return i >= 0 ? (cells[i] || '') : '' }
  return table.rows.map((r) => ({
    date: at(r.cells, '日期'), week: at(r.cells, '孕周'), report: at(r.cells, '报告'),
    findings: at(r.cells, '结论'), advice: at(r.cells, '医生建议'), source: at(r.cells, '来源'),
  })).filter((x) => x.report || x.findings)
}

function buildPregnancyMeds(archive) {
  const file = fileOf(archive, '孕期用药')
  if (!file) return []
  const table = parseTables(file.content).find((t) => t.header.includes('名称') && t.header.includes('剂量'))
  if (!table) return []
  const H = table.header
  const at = (cells, name) => { const i = H.findIndex((h) => h.includes(name)); return i >= 0 ? (cells[i] || '') : '' }
  return table.rows.map((r) => ({
    name: at(r.cells, '名称'), dose: at(r.cells, '剂量'), frequency: at(r.cells, '频率'), time: at(r.cells, '时间'),
    start: at(r.cells, '开始'), end: at(r.cells, '停用'), source: at(r.cells, '依据'),
  })).filter((x) => x.name)
}

function buildPregnancyMeals(archive) {
  const file = fileOf(archive, '孕期饮食')
  if (!file) return []
  const table = parseTables(file.content).find((t) => t.header.includes('餐次') && t.header.some((h) => h.includes('吃了什么')))
  if (!table) return []
  const H = table.header
  const at = (cells, name) => { const i = H.findIndex((h) => h.includes(name)); return i >= 0 ? (cells[i] || '') : '' }
  return table.rows.map((r) => ({ date: at(r.cells, '日期'), meal: at(r.cells, '餐次'), food: at(r.cells, '吃了什么'), note: at(r.cells, '备注') }))
    .filter((x) => x.food)
}

function pregnancyWeek(dueDate) {
  if (!dueDate) return undefined
  const due = new Date(String(dueDate) + 'T00:00:00Z')
  const now = new Date(todayISO() + 'T00:00:00Z')
  if (Number.isNaN(due.getTime())) return undefined
  const days = Math.ceil((due.getTime() - now.getTime()) / 86400000)
  return Math.max(0, Math.min(42, Math.floor((280 - days) / 7)))
}

function buildRegimenRows(archive, prefix) {
  const file = fileOf(archive, prefix)
  if (!file) return []
  const table = firstTable(file)
  if (!table) return []
  const H = table.header
  const at = (cells, name) => { const i = H.findIndex((h) => h.includes(name)); return i >= 0 ? (cells[i] || '') : '' }
  return table.rows
    .map((r) => ({
      name: at(r.cells, '名称'), product: at(r.cells, '产品'), dose: at(r.cells, '剂量'),
      frequency: at(r.cells, '频率'), time: at(r.cells, '时间'), start: at(r.cells, '开始'),
      end: at(r.cells, '停用') || at(r.cells, '结束'), reason: at(r.cells, '医嘱') || at(r.cells, '原因'),
      note: at(r.cells, '备注'), source: at(r.cells, '依据'),
    }))
    .filter((r) => r.name !== '')
}

function summarizeRoutine(rows, days) {
  const today = todayISO()
  const d = new Date(today + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() - (days - 1))
  const from = d.toISOString().slice(0, 10)
  const inRange = rows.filter((r) => r.date >= from && r.date <= today)
  const sum = { days, from, to: today, daysRecorded: 0, milkMl: 0, milkCount: 0, poopCount: 0, peeCount: 0, waterMl: 0, waterCount: 0, supplementDays: 0 }
  for (const r of inRange) {
    if (r.milk || r.poop || r.pee || r.water || r.food || r.supplement) sum.daysRecorded += 1
    sum.milkMl += r.milkMl || 0
    sum.milkCount += r.milkCount || 0
    sum.poopCount += r.poopCount || 0
    sum.peeCount += r.peeCount || 0
    sum.waterMl += r.waterMl || 0
    sum.waterCount += r.waterCount || 0
    if (r.supplement) sum.supplementDays += 1
  }
  return sum
}

function profileHeadline(md) {
  const line = md.split('\n').map((l) => l.trim()).find((l) =>
    l !== '' && !l.startsWith('#') && !l.startsWith('>') && !l.startsWith('|') && !l.startsWith('〔'))
  return line ? line.slice(0, 120) : ''
}

function appendTodoItem(md, text, date, time, section) {
  const body = String(text || '').trim()
  if (!body) return undefined
  const head = section || '日程'
  const line = '- [ ] ' + (date ? date + ' ' : '') + (time ? time + ' ' : '') + body
  const lines = String(md || '').split('\n')
  const hi = lines.findIndex((l) => new RegExp('^##\\s*' + head.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*$').test(l))
  if (hi >= 0) {
    let at = hi + 1
    while (at < lines.length && !/^##\s+/.test(lines[at])) at++
    while (at > hi + 1 && lines[at - 1].trim() === '') at--
    lines.splice(at, 0, line)
    return lines.join('\n')
  }
  return String(md || '').replace(/\s*$/, '') + '\n\n## ' + head + '\n\n' + line + '\n'
}

/**
 * 所有写盘都走这里：扫描、日期、原子写、统一提交。
 * @param {{config:object,root:string,writes:Array<{file:string,next:string}>,message:string,scanText?:string,date?:string}} opts
 */
async function saveDocs(opts) {
  const { config, root, writes, message, scanText, date } = opts || {}
  if (!Array.isArray(writes) || !writes.length) return { ok: false, error: '没有可写入的文件' }
  if (scanText !== undefined && String(scanText).trim() !== '') {
    const scan = scanPrivacy(String(scanText), { realNames: config.realNames })
    if (!scan.ok) return { ok: false, blocked: true, error: privacyMessage(scan.hits), hits: scan.hits }
  }
  const d = String(date || '').slice(0, 10)
  if (d && d > todayISO() && config.devMode !== true) {
    return { ok: false, code: 'future-date', error: '正常模式不能补未来数据；要测试请开开发测试模式（设置页「问问」）' }
  }
  try {
    for (const w of writes) {
      if (typeof w.next !== 'string') return { ok: false, error: '表格式没对上，没写入：' + (w.file || '') }
      mkdirSync(dirname(w.file), { recursive: true })
      writeFileAtomic(w.file, w.next)
    }
    const committed = config.autoCommit === false ? 'off' : await commitArchive(root, message)
    return { ok: true, committed }
  } catch (e) {
    return { ok: false, error: String(e && e.message ? e.message : e) }
  }
}

/**
 * 唯一写入口。
 * kind: record | growth | vaccine | milestone | todo
 */
export async function write(config, childId, kind, payload = {}) {
  const loaded = load(config, childId)
  if (!loaded.ok) return loaded
  const { archive, summary, root, docs } = loaded
  const text = String(payload.text || '').trim()
  const date = String(payload.date || todayISO()).slice(0, 10)
  if (date > todayISO() && kind !== 'todo' && config.devMode !== true) {
    return { ok: false, code: 'future-date', error: '正常模式不能补未来数据；要测试请开开发测试模式（设置页「问问」）' }
  }
  const scanText = [text, payload.note, payload.ingredients, payload.nutrition, payload.food, payload.reason, payload.source, payload.name, payload.product, payload.advice, payload.brand, payload.water, payload.intake, payload.label, payload.estimate, payload.findings, payload.report, payload.meal, payload.dose, payload.official, payload.actual, payload.institution, payload.result, payload.advice]
    .filter((x) => x !== undefined && x !== null && String(x).trim() !== '').join(' ')
  const scan = scanPrivacy(scanText, { realNames: config.realNames })
  if (!scan.ok) return { ok: false, blocked: true, error: privacyMessage(scan.hits), hits: scan.hits }

  const commitMsg = 'child: ' + kind + ' ' + (summary.name || '') + ' ' + date
  try {
    let file
    let next
    let extraWrite
    if (kind === 'record') {
      const cat = String(payload.category || 'other')
      if (cat === 'milk') {
        // 奶是奶记录主表；旧调用仍可记，但不再复制进日常表。
        file = docPath(docs, summary.name, '奶记录')
        next = appendMilkRecord(readText(file), date, { milkType: payload.milkType || '母乳', amount: payload.amount ?? text, time: payload.time, note: payload.note, brand: payload.brand || '' }, '母乳')
      } else if (cat === 'food') {
        file = docPath(docs, summary.name, '辅食记录')
        next = appendFood(readText(file), { date, time: payload.time || '', foodType: '辅食', food: cleanFoodText(text || payload.food || ''), quantity: payload.quantity || '', ingredients: payload.ingredients || '', nutrition: payload.nutrition || '', reaction: payload.reaction || '', source: payload.source || '' })
      } else if (cat === 'poop' || cat === 'pee' || cat === 'water' || cat === 'supplement') {
        file = docPath(docs, summary.name, '日常记录')
        next = appendDaily(readText(file), cat, date, summary.months, text, payload.time, payload.note)
        const evFile = docPath(docs, summary.name, '日常明细')
        if (!existsSync(evFile)) {
          try { writeFileAtomic(evFile, '# 日常明细\n\n| 日期 | 时间 | 类别 | 数量 | 备注 |\n|---|---|---|---|---|\n|  |  |  |  |  |\n') } catch { /* ignore */ }
        }
        const catLabel = { poop: '拉', pee: '尿', water: '水', supplement: '补剂' }[cat] || cat
        const evNext = appendMappedTable(readText(evFile), ['日期', '类别'], {
          '日期': date, '时间': payload.time || '', '类别': catLabel,
          '数量': payload.amount !== undefined ? payload.amount : text || '',
          '备注': payload.note || '',
        })
        if (typeof evNext === 'string') extraWrite = { file: evFile, next: evNext }
      } else {
        file = docPath(docs, summary.name, '时间线')
        next = appendTimeline(readText(file), date, summary.months, text, payload.source || '家长口述')
      }
    } else if (kind === 'growth') {
      file = docPath(docs, summary.name, '数据-生长与健康')
      next = insertGrowthRow(readText(file), {
        date, ageMonths: summary.months ?? '',
        height: payload.height ?? '', weight: payload.weight ?? '', head: payload.head ?? '',
        source: payload.source || '家长口述', note: payload.note || '',
      })
    } else if (kind === 'vaccine') {
      file = docPath(docs, summary.name, '数据-生长与健康')
      next = appendVaccine(readText(file), date, text || payload.name || '', payload.dose || '', payload.months ?? summary.months ?? '')
    } else if (kind === 'milestone') {
      file = docPath(docs, summary.name, '里程碑')
      let md = readText(file)
      if (!md) md = `# ${summary.name || '孩子'} · 里程碑\n\n> 只记第一次，或阶段性突破；日常和普通事件记在时间线/日常记录。\n\n| 时间 | 月龄 | 事件 | 出处 |\n|---|---|---|---|\n`
      next = appendTimeline(md, date, summary.months, text, payload.source || '家长口述')
    } else if (kind === 'food') {
      file = docPath(docs, summary.name, '辅食记录')
      next = appendFood(readText(file), {
        date, time: payload.time || '', foodType: (['餐食', '正餐', '辅食', ''].includes(String(payload.foodType || '')) ? '辅食' : payload.foodType), food: cleanFoodText(text || payload.food || ''),
        ingredients: payload.ingredients || '', quantity: payload.quantity || '', nutrition: payload.nutrition || '',
        reaction: payload.reaction || '', source: payload.source || '',
      })
    } else if (kind === 'formula') {
      const canonical = docPath(docs, summary.name, '奶记录')
      const legacy = docPath(docs, summary.name, '奶粉记录')
      if (!existsSync(canonical) && existsSync(legacy)) {
        file = legacy
        next = appendFormula(readText(legacy), {
          date, brand: payload.brand || '', water: payload.water || '', intake: payload.intake || '',
          label: payload.label || '', estimate: payload.estimate || '', source: payload.source || '',
        })
      } else {
        file = canonical
        next = appendMilkRecord(readText(canonical), date, { ...payload, milkType: payload.milkType || '配方奶' }, '配方奶')
      }
    } else if (kind === 'pregnancyBasic') {
      file = docPath(docs, summary.name, '孕期基本情况')
      next = setPregnancyBasic(readText(file), {
        '预产期': payload.dueDate || '', '孕前体重': payload.preWeight || '', '身高': payload.height || '',
      })
    } else if (kind === 'vaccinePlan') {
      file = docPath(docs, summary.name, '疫苗计划')
      next = appendMappedTable(readText(file), ['官方疫苗', '实际疫苗'], {
        '官方疫苗': payload.official || '', '官方针次': payload.officialDose || '',
        '实际疫苗': payload.actual || text || '', '实际针次': payload.actualDose || '',
        '月龄': payload.months || '', '说明': payload.note || '',
      })
    } else if (kind === 'sleepLog') {
      file = docPath(docs, summary.name, '睡眠记录')
      if (!existsSync(file)) {
        mkdirSync(dirname(file), { recursive: true })
        try { writeFileAtomic(file, '# 睡眠记录\n\n| 日期 | 类型 | 入睡 | 醒来 | 时长(分钟) | 夜醒 | 备注 |\n|---|---|---|---|---|---|---|\n|  |  |  |  |  |  |  |\n') } catch { /* ignore */ }
      }
      next = appendMappedTable(readText(file), ['日期', '入睡', '醒来'], {
        '日期': date, '类型': payload.sleepType || '夜间', '入睡': payload.sleepStart || '',
        '醒来': payload.sleepEnd || '', '时长(分钟)': payload.duration || sleepMinutes(payload.sleepStart, payload.sleepEnd) || '',
        '夜醒': payload.nightWakes ?? '', '备注': payload.note || '',
      })
    } else if (kind === 'supplementDetail') {
      file = docPath(docs, summary.name, '补剂明细')
      if (!existsSync(file)) {
        mkdirSync(dirname(file), { recursive: true })
        try { writeFileAtomic(file, '# 补剂明细\n\n| 日期 | 时间 | 名称 | 数量 | 单位 | 成分含量 | 备注 |\n|---|---|---|---|---|---|---|\n|  |  |  |  |  |  |  |\n') } catch { /* ignore */ }
      }
      next = appendMappedTable(readText(file), ['日期', '名称'], {
        '日期': date, '时间': payload.time || '', '名称': text || payload.name || '',
        '数量': payload.amount ?? '', '单位': payload.unit || '', '成分含量': payload.ingredients || '',
        '备注': payload.note || '',
      })
    } else if (kind === 'milkDetail') {
      const canonical = docPath(docs, summary.name, '奶记录')
      const legacy = docPath(docs, summary.name, '奶类记录')
      if (!existsSync(canonical) && existsSync(legacy)) {
        file = legacy
        next = appendMappedTable(readText(legacy), ['日期', '类型', '量'], {
          '日期': date, '类型': milkTypeOf(payload.milkType, '其他'), '量': payload.amount ?? '',
          '时间': payload.time || '', '备注': payload.note || '',
        })
      } else {
        file = canonical
        next = appendMilkRecord(readText(canonical), date, payload, '母乳')
      }
    } else if (kind === 'expense') {
      file = docPath(docs, summary.name, '育儿花费')
      if (!existsSync(file)) {
        mkdirSync(dirname(file), { recursive: true })
        try { writeFileAtomic(file, '# 育儿花费\n\n| 日期 | 类别 | 项目 | 商品 | 金额 | 支付人 | 备注 |\n|---|---|---|---|---:|---|---|\n|  |  |  |  |  |  |  |\n') } catch { /* ignore */ }
      }
      next = appendMappedTable(readText(file), ['日期', '金额'], {
        '日期': date,
        '类别': payload.expenseCategory || payload.category || '其他',
        '项目': text || payload.item || '',
        '商品': payload.product || '',
        '金额': payload.amount === undefined || payload.amount === null ? '' : payload.amount,
        '支付人': payload.payer || '',
        '备注': payload.note || '',
      })
    } else if (kind === 'checkup') {
      file = docPath(docs, summary.name, '数据-生长与健康')
      let md = readText(file)
      md = appendCheckup(md, {
        date, months: summary.months ?? '', item: text || payload.item || '',
        result: payload.result || '', advice: payload.advice || '',
      })
      // 头围/身高/体重随体检一起进生长表；不要求家长平时量
      if (md && (payload.head !== undefined || payload.height !== undefined || payload.weight !== undefined)) {
        md = insertGrowthRow(md, {
          date, ageMonths: summary.months ?? '',
          height: payload.height ?? '', weight: payload.weight ?? '', head: payload.head ?? '',
          source: '体检', note: payload.note || '',
        })
      }
      next = md
    } else if (kind === 'specialSupplement') {
      file = docPath(docs, summary.name, '特殊补剂')
      next = appendRegimen(readText(file), {
        name: text || payload.name || '', product: payload.product || '', dose: payload.dose || '',
        frequency: payload.frequency || '', time: payload.time || '', start: payload.start || '',
        end: payload.stop || '', source: payload.source || '',
      }, false)
    } else if (kind === 'medication') {
      file = docPath(docs, summary.name, '用药')
      next = appendRegimen(readText(file), {
        name: text || payload.name || '', dose: payload.dose || '', frequency: payload.frequency || '',
        time: payload.time || '', start: payload.start || '', end: payload.stop || '',
        reason: payload.reason || '', note: payload.note || '',
      }, true)
    } else if (kind === 'pregnancyReport') {
      file = docPath(docs, summary.name, '孕检报告')
      next = appendMappedTable(readText(file), ['报告', '结论'], {
        '日期': date, '孕周': payload.week || '', '报告': text || payload.report || '',
        '关键指标/结论': payload.findings || payload.result || '', '医生建议': payload.advice || '', '来源': payload.source || '',
      })
    } else if (kind === 'pregnancyMed') {
      file = docPath(docs, summary.name, '孕期用药与补剂')
      next = appendMappedTable(readText(file), ['名称', '剂量'], {
        '名称': text || payload.name || '', '剂量': payload.dose || '', '频率': payload.frequency || '',
        '时间': payload.time || '', '开始': payload.start || '', '停用': payload.stop || '', '依据': payload.reason || payload.source || '',
      })
    } else if (kind === 'pregnancyMeal') {
      file = docPath(docs, summary.name, '孕期饮食记录')
      next = appendMappedTable(readText(file), ['餐次', '吃了什么'], {
        '日期': date, '餐次': payload.meal || '', '吃了什么': text || payload.food || '', '备注': payload.note || '',
      })
    } else if (kind === 'hospitalAssessment') {
      file = docPath(docs, summary.name, '医院评估')
      next = appendMappedTable(readText(file), ['机构', '结果'], {
        '日期': date, '月龄': payload.months || '', '机构': payload.institution || '',
        '评估工具/项目': text || payload.tool || '', '结果': payload.result || '',
        '医生建议': payload.advice || '', '备注': payload.note || '',
      })
    } else if (kind === 'assessment') {
      file = docPath(docs, summary.name, '评估记录')
      next = appendMappedTable(readText(file), ['量表', '结果'], {
        '日期': date, '月龄': payload.months || '', '量表': payload.scale || '', '结果': payload.result || '', '下一步': payload.next || '',
      })
    } else if (kind === 'personality') {
      file = docPath(docs, summary.name, '人格与偏好')
      next = appendMappedTable(readText(file), ['维度', '观察'], {
        '日期': date, '维度': payload.dimension || '其他', '观察': text || payload.observation || '',
        '场景/依据': payload.context || '', '置信度': payload.confidence || '中',
      })
    } else if (kind === 'cycle') {
      file = docPath(docs, summary.name, '备孕记录')
      next = appendMappedTable(readText(file), ['开始日期', '周期'], {
        '开始日期': date, '结束日期': payload.end || '', '周期长度': payload.length || '',
        '经量': payload.flow || '', '备注': payload.note || '',
      })
    } else if (kind === 'prepCheckup') {
      file = docPath(docs, summary.name, '备孕记录')
      next = appendMappedTable(readText(file), ['项目', '结果'], {
        '日期': date, '项目': text || payload.item || '', '结果': payload.result || '', '建议': payload.advice || '',
      })
    } else if (kind === 'pregnancyVital') {
      file = docPath(docs, summary.name, '孕期记录')
      next = appendMappedTable(readText(file), ['体重', '收缩压'], {
        '日期': date, '孕周': payload.week || '', '体重': payload.weight || '',
        '收缩压': payload.systolic || '', '舒张压': payload.diastolic || '', '备注': payload.note || '',
      })
    } else if (kind === 'pregnancyCheckup') {
      file = docPath(docs, summary.name, '孕期记录')
      next = appendMappedTable(readText(file), ['孕周', '项目'], {
        '日期': date, '孕周': payload.week || '', '项目': text || payload.item || '',
        '结果': payload.result || '', '医生建议': payload.advice || '',
      })
    } else if (kind === 'todoAdd') {
      file = docPath(docs, summary.name, '待补清单')
      next = appendTodoItem(readText(file), text || payload.content || '', payload.dueDate || payload.date || '', payload.dueTime || payload.time || '', payload.section || '日程')
    } else if (kind === 'todo') {
      file = docPath(docs, summary.name, '待补清单')
      next = markTodoDone(readText(file), text).content
    } else {
      return { ok: false, error: '未知写入类型：' + kind }
    }
    if (typeof next !== 'string') return { ok: false, error: '表格式没对上，没写入：' + (file || '') }
    const saved = await saveDocs({ config, root, writes: [{ file, next }].concat(extraWrite ? [extraWrite] : []), message: commitMsg })
    if (!saved.ok) return saved
    const committed = saved.committed
    const rc = receipt(kind, summary, text, date)
    rememberWrite(summary.id, kind, writeLabel(kind, payload, text), date, rc)
    return { ok: true, file, committed, receipt: rc }
  } catch (e) {
    return { ok: false, error: String(e && e.message ? e.message : e) }
  }
}

function writeLabel(kind, payload, text) {
  if (kind === 'growth') {
    const parts = []
    if (payload.height !== undefined) parts.push('身高 ' + payload.height + ' cm')
    if (payload.weight !== undefined) parts.push('体重 ' + payload.weight + ' kg')
    if (payload.head !== undefined) parts.push('头围 ' + payload.head + ' cm')
    return parts.join(' / ') || '生长数据'
  }
  if (kind === 'vaccine') return '疫苗：' + (text || '')
  if (kind === 'vaccinePlan') return '疫苗计划：' + (payload.official || '') + ' → ' + (payload.actual || text || '')
  if (kind === 'milestone') return '里程碑：' + (text || '')
  if (kind === 'todo') return '待补：' + (text || '')
  if (kind === 'food') return '辅食：' + (text || '')
  if (kind === 'checkup') return '体检：' + (text || '')
  if (kind === 'formula') return '奶粉：' + (payload.brand || '')
  if (kind === 'pregnancyBasic') return '孕期基本情况'
  if (kind === 'pregnancyReport') return '孕检报告：' + (text || payload.report || '')
  if (kind === 'pregnancyMed') return '孕期用药：' + (text || payload.name || '')
  if (kind === 'pregnancyMeal') return '孕期饮食：' + (text || payload.food || '')
  if (kind === 'hospitalAssessment') return '医院评估：' + (payload.institution || '') + ' · ' + (text || payload.tool || '')
  if (kind === 'assessment') return '评估：' + (payload.scale || '') + ' · ' + (payload.result || '')
  if (kind === 'personality') return '人格/偏好：' + (payload.dimension || '') + ' · ' + (text || '')
  if (kind === 'cycle') return '周期：' + (payload.date || '')
  if (kind === 'prepCheckup') return '孕前检查：' + (text || payload.item || '')
  if (kind === 'pregnancyVital') return '孕期：' + (payload.date || '')
  if (kind === 'pregnancyCheckup') return '产检：' + (text || payload.item || '')
  if (kind === 'specialSupplement') return '特殊补剂：' + (text || payload.name || '')
  if (kind === 'medication') return '用药：' + (text || payload.name || '')
  const dailyName = { milk: '奶', poop: '拉', pee: '尿', water: '水', food: '辅食', supplement: '补剂', vaccine: '疫苗', milestone: '里程碑' }[payload.category]
  return (dailyName || '记录') + '：' + (text || '')
}

function receipt(kind, summary, text, date) {
  const kindName = { record: '记录', growth: '生长', vaccine: '疫苗', milestone: '里程碑', food: '辅食', formula: '奶粉', checkup: '体检', vaccinePlan: '疫苗计划', specialSupplement: '特殊补剂', medication: '用药', todo: '待补', personality: '人格/偏好', assessment: '评估', hospitalAssessment: '医院评估', pregnancyBasic: '孕期基本情况', pregnancyReport: '孕检报告', pregnancyMed: '孕期用药', pregnancyMeal: '孕期饮食', cycle: '周期', prepCheckup: '孕前检查', pregnancyVital: '孕期', pregnancyCheckup: '产检' }
  return '记给：' + summary.name + '（' + summary.ageShort + '）· ' + (kindName[kind] || kind) + ' · ' + date
}

function setPregnancyBasic(md, values) {
  const table = parseTables(md).find((t) => t.header.some((h) => h.includes('孕前体重')) && t.header.some((h) => h.includes('身高')))
  if (!table) return undefined
  const cells = table.header.map((h) => {
    const key = Object.keys(values).find((k) => h.includes(k))
    return key ? values[key] : ''
  })
  if (table.rows.length) {
    const lines = md.split('\n')
    lines[table.rows[0].line] = '| ' + cells.map((c) => String(c).replace(/\|/g, '／')).join(' | ') + ' |'
    return lines.join('\n')
  }
  return insertAtTableEnd(md, table, cells)
}

function milkTypeOf(value, fallback = '其他') {
  const t = String(value || '').trim() || fallback
  if (t === '奶粉') return '配方奶'
  return t
}

function appendMilkRecord(md, date, payload, defaultType) {
  let base = md
  if (!base) base = '# 奶记录\n\n> 所有奶都记这里：母乳 / 配方奶 / 水奶 / 牛奶 / 羊奶 / 混合；只记录，不做喂养建议。\n\n| 日期 | 品种 | 品牌/段数 | 量(ml) | 时间 | 标签营养（每100ml） | 估算摄入 | 备注 |\n|---|---|---|---:|---|---|---|---|\n'
  const amount = payload.amount !== undefined && payload.amount !== null && payload.amount !== ''
    ? payload.amount
    : ((/约\s*(\d+(?:\.\d+)?)\s*m[lL]/i.exec(String(payload.intake || '') + ' ' + String(payload.estimate || '')) || String(payload.intake || '').match(/(\d+(?:\.\d+)?)\s*m[lL]/i) || [])[1] || '')
  return appendMappedTable(base, ['日期', '品种', '量'], {
    '日期': date, '品种': milkTypeOf(payload.milkType, defaultType),
    '品牌/段数': payload.brand || payload.product || '', '量': amount,
    '时间': payload.time || '', '标签营养（每100ml）': payload.label || '',
    '估算摄入': payload.estimate || '', '备注': payload.note || payload.source || '',
  })
}

function appendTimeline(md, date, ageMonths, text, source) {
  const [y, m, d] = date.split('-').map(Number)
  if (!y || !m || !d) return undefined
  return insertTimelineRow(md, { year: y, month: m, day: d, ageMonths: ageMonths ?? '', text, source })
}

function appendDaily(md, cat, date, months, text, time, note) {
  const table = parseTables(md).find((t) => t.header.includes('日期') && (t.header.includes('奶') || t.header.includes('拉')))
  if (!table) return undefined
  const header = table.header
  const idx = (name) => header.findIndex((h) => h.includes(name))
  const dateIdx = idx('日期')
  const lines = md.split('\n')
  const row = table.rows.find((r) => r.cells[dateIdx] === date)
  const cells = row ? header.map((_, i) => row.cells[i] ?? '') : header.map(() => '')
  if (!row) {
    cells[dateIdx] = date
    const mi = idx('月龄'); if (mi >= 0) cells[mi] = String(months ?? '')
  }
  const colMap = { milk: '奶', poop: '拉', pee: '尿', water: '水', food: '辅食', supplement: '补剂' }
  const colName = colMap[cat] || '奶'
  const ci = idx(colName)
  const add = text || '1 次'
  if (ci >= 0) cells[ci] = mergeDaily(cells[ci], add, colName)
  else {
    const bi = idx('备注')
    if (bi >= 0) cells[bi] = [cells[bi], colName + '：' + add].filter(Boolean).join('；')
  }
  if (time) {
    const ti = idx('时间点')
    if (ti >= 0) {
      const label = time + ' ' + colName
      const parts = String(cells[ti] || '').split('；').map((x) => x.trim()).filter(Boolean)
      if (!parts.includes(label)) parts.push(label)
      parts.sort((a, b) => timeValue(a) - timeValue(b))
      cells[ti] = parts.join('；')
    } else {
      const bi = idx('备注')
      if (bi >= 0) cells[bi] = [cells[bi], time].filter(Boolean).join('；')
    }
  }
  if (note) {
    const bi = idx('备注')
    if (bi >= 0) cells[bi] = [cells[bi], note].filter(Boolean).join('；')
  }
  if (row) {
    lines[row.line] = '| ' + cells.map(cellText).join(' | ') + ' |'
    return lines.join('\n')
  }
  return insertAtTableEnd(md, table, cells)
}

function timeValue(s) {
  const m = String(s).match(/^(\d{1,2}):(\d{2})/)
  return m ? Number(m[1]) * 60 + Number(m[2]) : 9999
}

function mergeDaily(old, add, colName) {
  if (!old) return add
  if (colName === '补剂') {
    const oldNames = String(old).split(/[、,，]/).map((x) => x.trim()).filter(Boolean)
    const newNames = String(add).split(/[、,，]/).map((x) => x.trim()).filter(Boolean)
    return [...new Set([...oldNames, ...newNames])].join('、')
  }
  if (colName === '辅食') return old === add ? old : old + '；' + add
  const num = (s) => {
    const m = String(s).match(/^(\d+(?:\.\d+)?)/)
    return m ? Number(m[1]) : null
  }
  const a = num(old)
  const b = num(add)
  if (a !== null && b !== null) {
    if (/ml|毫升/i.test(old + add)) return (a + b) + 'ml'
    if (/次/.test(old + add)) return (a + b) + ' 次'
  }
  return old + '；' + add
}

function cellText(c) {
  return String(c == null ? '' : c).replace(/\|/g, '／').replace(/\r?\n/g, ' ')
}

function appendVaccine(md, date, name, dose, months) {
  const tables = parseTables(md)
  const table = tables.find((t) => t.header.includes('疫苗'))
  if (!table) return undefined
  return insertAtTableEnd(md, table, [date, name, dose, months, ''])
}

function appendSimple(md, headerStarts, cells) {
  const tables = parseTables(md)
  const table = tables.find((t) => headerStarts.every((h) => t.header.includes(h)))
  if (!table) return undefined
  return insertAtTableEnd(md, table, cells)
}

function appendFood(md, v) {
  const table = parseTables(md).find((t) => t.header.includes('日期') && t.header.includes('食物'))
  if (!table) return undefined
  const H = table.header
  const cells = H.map(() => '')
  const set = (name, value) => { const i = H.findIndex((h) => h.includes(name)); if (i >= 0) cells[i] = value }
  set('日期', v.date)
  set('时间', v.time)
  set('类型', v.foodType)
  set('食物', cleanFoodText(v.food))
  set('食材', v.ingredients)
  set('份量', v.quantity)
  set('营养', v.nutrition)
  set('反应', v.reaction)
  set('依据', v.source)
  return insertAtTableEnd(md, table, cells)
}

function appendFormula(md, v) {
  const table = parseTables(md)[0]
  if (!table) return undefined
  const H = table.header
  const cells = H.map(() => '')
  const set = (name, value) => { const i = H.findIndex((h) => h.includes(name)); if (i >= 0) cells[i] = value }
  set('日期', v.date); set('品牌', v.brand); set('冲调量', v.water); set('实际摄入', v.intake)
  set('标签营养', v.label); set('估算摄入', v.estimate); set('依据', v.source)
  return insertAtTableEnd(md, table, cells)
}

function appendCheckup(md, v) {
  const table = parseTables(md).find((t) => t.header.includes('项目') && t.header.includes('结果'))
  if (!table) return undefined
  const H = table.header
  const cells = H.map(() => '')
  const set = (name, value) => { const i = H.findIndex((h) => h.includes(name)); if (i >= 0) cells[i] = value }
  set('日期', v.date)
  set('月龄', v.months)
  set('项目', v.item)
  set('结果', v.result)
  set('医生建议', v.advice)
  return insertAtTableEnd(md, table, cells)
}

function appendRegimen(md, v, medication) {
  const table = parseTables(md)[0]
  if (!table) return undefined
  const H = table.header
  const cells = H.map(() => '')
  const set = (name, value) => { const i = H.findIndex((h) => h.includes(name)); if (i >= 0) cells[i] = value }
  set('名称', v.name)
  if (medication) {
    set('剂量', v.dose); set('频率', v.frequency); set('时间', v.time)
    set('开始', v.start); set('结束', v.end); set('医嘱', v.reason); set('原因', v.reason); set('备注', v.note)
  } else {
    set('产品', v.product); set('剂量', v.dose); set('频率', v.frequency); set('时间', v.time)
    set('开始', v.start); set('停用', v.end); set('依据', v.source)
  }
  return insertAtTableEnd(md, table, cells)
}

function appendMappedTable(md, required, values) {
  const table = parseTables(md).find((t) => required.every((h) => t.header.some((x) => x.includes(h))))
  if (!table) return undefined
  const cells = table.header.map((h) => {
    const key = Object.keys(values).find((k) => h.includes(k))
    return key ? values[key] : ''
  })
  return insertAtTableEnd(md, table, cells)
}

function insertAtTableEnd(md, table, cells) {
  const lines = md.split('\n')
  let insertAt = table.endLine + 1
  // 表里若有全空占位行，插在第一条空行前
  for (const row of table.rows) {
    if (row.cells.every((c) => c === '')) { insertAt = row.line; break }
  }
  const row = '| ' + cells.map((c) => String(c == null ? '' : c).replace(/\|/g, '／').replace(/\r?\n/g, ' ')).join(' | ') + ' |'
  lines.splice(insertAt, 0, row)
  return lines.join('\n')
}

export { buildAssess, buildCheckup, computeAge, stageOf }


// ── 日常推定 / 核实 ───────────────────────────────────────────────────────

function yesterdayISO() {
  const d = new Date(todayISO() + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

function dailyRow(md, date) {
  const table = parseTables(md).find((t) => t.header.includes('日期') && (t.header.includes('奶') || t.header.includes('拉')))
  if (!table) return undefined
  const H = table.header
  const dateIdx = H.findIndex((h) => h.includes('日期'))
  const row = table.rows.find((r) => r.cells[dateIdx] === date)
  const at = (cells, name) => { const i = H.findIndex((h) => h.includes(name)); return i >= 0 ? (cells[i] || '') : '' }
  return { table, H, dateIdx, row, at }
}

export async function suggestRoutine(config, childId) {
  const loaded = load(config, childId)
  if (!loaded.ok) return loaded
  const { archive, root, docs, summary } = loaded
  const today = todayISO()
  const md = readText(docPath(docs, summary.name, '日常记录'))
  const t = dailyRow(md, today)
  if (!t) return { ok: false, error: '日常记录表没找到' }
  const milkRows = buildMilkRows(archive)
  const todayMilk = milkRows.filter((r) => r.date === today)
  const hasTodayRow = t.row && ['奶', '拉', '尿', '水', '辅食', '补剂'].some((h) => t.at(t.row.cells, h) !== '')
  if (todayMilk.length) return { ok: true, pending: false }
  if (hasTodayRow) {
    const note = t.at(t.row.cells, '备注')
    if (/推定自/.test(note)) {
      const from = (note.match(/推定自\s*([0-9-]+)/) || [])[1] || ''
      return {
        ok: true, pending: true, from,
        values: { milk: t.at(t.row.cells, '奶'), poop: t.at(t.row.cells, '拉'), pee: t.at(t.row.cells, '尿'), water: t.at(t.row.cells, '水') },
      }
    }
    return { ok: true, pending: false }
  }
  // 生病/旅行等上下文不推定
  if (archive.timeline) {
    const recent = parseTimeline(archive.timeline.content).slice(-4).map((x) => x.text).join(' ')
    if (/(生病|发烧|住院|旅行|回老家|出游)/.test(recent)) return { ok: true, pending: false, skipped: true }
  }
  const y = yesterdayISO()
  const yt = dailyRow(md, y)
  const yMilk = milkRows.filter((r) => r.date === y)
  const legacyMilk = yt && yt.row ? yt.at(yt.row.cells, '奶') : ''
  const milkTotal = yMilk.reduce((a, r) => a + (Number(r.amount) || 0), 0)
  const milkTypes = [...new Set(yMilk.map((r) => r.type).filter(Boolean))]
  const milkType = milkTypes.length > 1 ? '混合' : (milkTypes[0] || '母乳')
  const milkText = milkTotal > 0 ? (milkType + ' ' + Math.round(milkTotal) + 'ml') : (legacyMilk || '')
  const values = {
    milk: milkText,
    milkMl: milkTotal,
    milkType,
    milkBrand: yMilk.length === 1 ? (yMilk[0].brand || '') : '',
    poop: yt && yt.row ? yt.at(yt.row.cells, '拉') : '',
    pee: yt && yt.row ? yt.at(yt.row.cells, '尿') : '',
    water: yt && yt.row ? yt.at(yt.row.cells, '水') : '',
  }
  if (!values.milk && !values.poop && !values.pee && !values.water) return { ok: true, pending: false }
  // 只做“建议”，不自动写入。用户点沿用后才落今天这一行。
  return { ok: true, pending: true, proposed: true, from: y, values }
}

export async function confirmRoutine(config, childId, action, proposal = {}) {
  const loaded = load(config, childId)
  if (!loaded.ok) return loaded
  const { archive, root, docs, summary } = loaded
  const file = docPath(docs, summary.name, '日常记录')
  const md = readText(file)
  const t = dailyRow(md, todayISO())
  const todayMilk = buildMilkRows(archive).filter((r) => r.date === todayISO())
  const todayHasValues = todayMilk.length > 0 || !!(t && t.row && ['奶', '拉', '尿', '水', '辅食', '补剂'].some((name) => t.at(t.row.cells, name) !== ''))
  if (action === 'confirm' && proposal.values && !todayHasValues) {
    const values = proposal.values
    const writes = []
    if (Number(values.milkMl) > 0 || values.milk) {
      const milkFile = docPath(docs, summary.name, '奶记录')
      const milkNext = appendMilkRecord(readText(milkFile), todayISO(), {
        milkType: values.milkType || '母乳', amount: Number(values.milkMl) || values.milk,
        brand: values.milkBrand || '', note: '沿用 ' + String(proposal.from || '昨天'),
      }, values.milkType || '母乳')
      writes.push({ file: milkFile, next: milkNext })
    }
    const dailyValues = { poop: values.poop, pee: values.pee, water: values.water }
    if (dailyValues.poop || dailyValues.pee || dailyValues.water) {
      const cells = t.H.map(() => '')
      cells[t.dateIdx] = todayISO()
      const set = (name, value) => { const i = t.H.findIndex((h) => h.includes(name)); if (i >= 0 && value) cells[i] = value }
      set('月龄', summary.months)
      set('拉', dailyValues.poop); set('尿', dailyValues.pee); set('水', dailyValues.water)
      set('备注', '沿用 ' + String(proposal.from || '昨天'))
      const next = t.row
        ? (() => { const lines = md.split('\n'); lines[t.row.line] = '| ' + cells.map(cellText).join(' | ') + ' |'; return lines.join('\n') })()
        : insertAtTableEnd(md, t.table, cells)
      writes.push({ file, next })
    }
    if (!writes.length) return { ok: true, pending: false }
    await saveDocs({ config, root, writes, message: 'child: routine 沿用 ' + summary.name + ' ' + todayISO(), date: todayISO() })
    return { ok: true, pending: false }
  }
  if (!t || !t.row) return { ok: true, pending: false }
  const note = t.at(t.row.cells, '备注')
  if (!/推定自|沿用/.test(note)) return { ok: true, pending: false }
  const lines = md.split('\n')
  if (action === 'delete') {
    lines.splice(t.row.line, 1)
  } else {
    const cells = t.H.map((_, i) => t.row.cells[i] ?? '')
    const bi = t.H.findIndex((h) => h.includes('备注'))
    if (bi >= 0) cells[bi] = String(note).replace(/推定自[^；，]*[，,]?\s*待核实；?/g, '').replace(/；$/, '').trim()
    lines[t.row.line] = '| ' + cells.map(cellText).join(' | ') + ' |'
  }
  await saveDocs({ config, root, writes: [{ file, next: lines.join('\n') }], message: 'child: routine 核实 ' + summary.name + ' ' + todayISO(), date: todayISO() })
  return { ok: true, pending: false }
}


// ── 自由模式：用户自建表单/记录（独立命名空间，内置模板不碰）────────────────

function customFormPath(docs) {
  return join(docs, '自定义', '表单.md')
}

function customRecordPath(docs, id) {
  return join(docs, '自定义', '记录', String(id).replace(/[^a-z0-9-]/gi, '') + '.md')
}

export function parseCustomForms(docs) {
  const file = customFormPath(docs)
  if (!existsSync(file)) return []
  const table = parseTables(readText(file)).find((t) => t.header.includes('ID') && t.header.includes('名称'))
  if (!table) return []
  const H = table.header
  const at = (cells, name) => { const i = H.findIndex((h) => h.includes(name)); return i >= 0 ? (cells[i] || '') : '' }
  return table.rows.map((r) => {
    let fields = []
    try { fields = JSON.parse(at(r.cells, '字段') || '[]') } catch { fields = [] }
    return { id: at(r.cells, 'ID'), name: at(r.cells, '名称'), fields: Array.isArray(fields) ? fields : [], note: at(r.cells, '说明') }
  }).filter((x) => x.id && x.name)
}

function customHeader(form) {
  return '# ' + form.name + '\n\n> 用户自建表单；内置模板不覆盖。\n\n| 日期 | ' + form.fields.map((f) => f.label).join(' | ') + ' |\n|---|' + form.fields.map(() => '---').join('|') + '|\n'
}

export async function createCustomForm(config, childId, payload = {}) {
  const loaded = load(config, childId)
  if (!loaded.ok) return loaded
  const { docs, root, summary } = loaded
  const name = String(payload.name || '').trim()
  const fields = (Array.isArray(payload.fields) ? payload.fields : []).map((f) => ({
    key: String(f.key || f.label || '').trim(),
    label: String(f.label || f.key || '').trim(),
    type: String(f.type || 'text'),
    options: Array.isArray(f.options) ? f.options : undefined,
  })).filter((f) => f.key && f.label)
  if (!name || !fields.length) return { ok: false, error: '表单名和至少一个字段必填' }
  const scan = scanPrivacy([name, ...fields.map((f) => f.label)].join(' '), { realNames: config.realNames })
  if (!scan.ok) return { ok: false, blocked: true, error: privacyMessage(scan.hits), hits: scan.hits }
  const id = 'f-' + Date.now().toString(36)
  const form = { id, name, fields, note: String(payload.note || '') }
  const tableFile = customFormPath(docs)
  const next = appendMappedTable(readText(tableFile), ['ID', '名称'], {
    'ID': id, '名称': name, '字段': JSON.stringify(fields), '说明': form.note,
  })
  if (typeof next !== 'string') return { ok: false, error: '自定义表单表头没对上' }
  const writes = [{ file: tableFile, next }]
  const recordFile = customRecordPath(docs, id)
  if (!existsSync(recordFile)) writes.push({ file: recordFile, next: customHeader(form) })
  const saved = await saveDocs({ config, root, writes, message: 'form: ' + summary.name + ' ' + name })
  if (!saved.ok) return saved
  return { ok: true, form, committed: saved.committed }
}

export async function appendCustomRecord(config, childId, formId, values = {}) {
  const loaded = load(config, childId)
  if (!loaded.ok) return loaded
  const { docs, root, summary } = loaded
  const form = parseCustomForms(docs).find((f) => f.id === formId)
  if (!form) return { ok: false, error: '没找到这个自定义表单' }
  const text = form.fields.map((f) => values[f.key] == null ? '' : String(values[f.key])).join(' ')
  const scan = scanPrivacy(text, { realNames: config.realNames })
  if (!scan.ok) return { ok: false, blocked: true, error: privacyMessage(scan.hits), hits: scan.hits }
  const file = customRecordPath(docs, formId)
  if (!existsSync(file)) {
    mkdirSync(dirname(file), { recursive: true })
    writeFileAtomic(file, customHeader(form))
  }
  let md = readText(file)
  let table = parseTables(md).find((t) => t.header.includes('日期'))
  if (!table) {
    md = customHeader(form)
    table = parseTables(md)[0]
  }
  const cells = [values.date || todayISO()].concat(form.fields.map((f) => values[f.key] == null ? '' : String(values[f.key])))
  const next = insertAtTableEnd(md, table, cells)
  if (typeof next !== 'string') return { ok: false, error: '自定义记录表头没对上' }
  const saved = await saveDocs({ config, root, writes: [{ file, next }], message: 'custom: ' + summary.name + ' ' + form.name, scanText: text, date: values.date || todayISO() })
  if (!saved.ok) return saved
  return { ok: true, form, date: values.date || todayISO(), committed: saved.committed, receipt: '记给：' + summary.name + ' · ' + form.name }
}

function readCustomRowsFromDocs(docs, form) {
  if (!form) return { ok: false, error: '没找到这个自定义表单' }
  const file = customRecordPath(docs, form.id)
  if (!existsSync(file)) return { ok: true, form, rows: [] }
  const table = parseTables(readText(file)).find((t) => t.header.includes('日期'))
  if (!table) return { ok: true, form, rows: [] }
  const rows = table.rows.map((r) => {
    const obj = {}
    table.header.forEach((h, i) => { obj[h] = r.cells[i] || '' })
    return obj
  })
  return { ok: true, form, rows }
}

export function readCustomRecords(config, childId, formId) {
  const loaded = load(config, childId)
  if (!loaded.ok) return loaded
  const form = parseCustomForms(loaded.docs).find((f) => f.id === formId)
  if (!form) return { ok: false, error: '没找到这个自定义表单' }
  return readCustomRowsFromDocs(loaded.docs, form)
}

/** 所有记录（不截断），给“查看全部”用；客户端按卡片决定聚合维度。 */
export function allRecords(config, childId, kind) {
  const loaded = load(config, childId)
  if (!loaded.ok) return loaded
  const { archive } = loaded
  const sections = []
  const add = (key, title, rows, granularity) => {
    if (rows && rows.length) sections.push({ key, title, rows, granularity: granularity || [] })
  }
  if (kind === 'daily') add('daily', '日常记录', buildRecordRows(archive, Infinity), ['day', 'week', 'month', 'year'])
  else if (kind === 'growth') add('growth', '生长记录', archive.growth ? parseGrowth(archive.growth.content) : [], ['day', 'month', 'year'])
  else if (kind === 'expense') add('expense', '育儿花费', buildExpenseRows(archive), ['day', 'month', 'year'])
  else if (kind === 'milkDetail') add('milkDetail', '奶类记录', buildMilkRows(archive), ['day', 'week', 'month', 'year'])
  else if (kind === 'supplementDetail') add('supplementDetail', '补剂明细', buildSupplementDetailRows(archive), ['day', 'week', 'month', 'year'])
  else if (kind === 'sleepLog') add('sleepLog', '睡眠记录', buildSleepRows(archive), ['day', 'week', 'month', 'year'])
  else if (kind === 'nutrition') {
    add('food', '辅食记录', buildFoodRows(archive), ['day', 'week', 'month', 'year'])
    add('formula', '奶粉记录', buildFormulaRows(archive), ['day', 'week', 'month', 'year'])
  } else if (kind === 'vaccine') {
    add('vaccine', '接种记录', buildVaccineRows(archive), [])
    add('vaccinePlan', '自费/替代计划', buildVaccinePlanRows(archive), [])
  } else if (kind === 'checkup') add('checkup', '体检记录', buildCheckupRows(archive), [])
  else if (kind === 'milestone') add('milestone', '里程碑', buildMilestoneRows(archive), [])
  else if (kind === 'personality') add('personality', '人格与偏好', buildPersonalityRows(archive), ['month', 'year'])
  else if (kind === 'assessment') {
    add('assessment', '自评记录', buildAssessHistory(archive), [])
    add('hospital', '医院评估', buildHospitalAssess(archive), [])
  } else if (kind === 'hospital') add('hospital', '医院评估', buildHospitalAssess(archive), [])
  else if (kind === 'specialSupplement') add('specialSupplement', '特殊补剂', buildRegimenRows(archive, '特殊补剂'), [])
  else if (kind === 'medication') add('medication', '用药', buildRegimenRows(archive, '用药'), [])
  else if (kind === 'pregnancy') {
    add('pregnancyVitals', '孕期体重/血压', buildPregnancyData(archive).vitals, ['day', 'week', 'month'])
    add('pregnancyCheckups', '产检', buildPregnancyData(archive).checkups, [])
    add('pregnancyReports', '孕检报告', buildPregnancyReports(archive), [])
    add('pregnancyMeds', '孕期用药/补剂', buildPregnancyMeds(archive), [])
    add('pregnancyMeals', '孕期饮食', buildPregnancyMeals(archive), ['day', 'week', 'month'])
  } else if (kind === 'prep') {
    const p = buildPrepData(archive)
    add('prepCycles', '备孕周期', p.cycles, [])
    add('prepCheckups', '孕前检查', p.checkups, [])
  }
  return { ok: true, kind, sections }
}

// ── 孕期待产包（用户可自己补）──────────────────────────────────────────────
export function buildBag(archive) {
  const file = fileOf(archive, '待产包')
  if (!file) return { sections: [], total: 0, done: 0 }
  let section = '其他'
  const bySection = new Map()
  for (const line of String(file.content || '').split('\n')) {
    const h = line.match(/^##\s+(.+?)\s*$/)
    if (h) { section = h[1].trim(); continue }
    const item = line.match(/^-\s*\[([ xX])\]\s*(.+?)\s*$/)
    if (!item) continue
    if (!bySection.has(section)) bySection.set(section, [])
    bySection.get(section).push({ text: item[2], done: item[1].toLowerCase() === 'x' })
  }
  const sections = [...bySection.entries()].map(([title, items]) => ({ title, items }))
  const all = sections.flatMap((s) => s.items)
  return { sections, total: all.length, done: all.filter((x) => x.done).length }
}

export async function toggleBag(config, childId, text, done) {
  const loaded = load(config, childId)
  if (!loaded.ok) return loaded
  const file = docPath(loaded.docs, loaded.summary.name, '待产包')
  const md = readText(file)
  if (!md) return { ok: false, error: '还没有待产包清单' }
  const target = String(text || '').trim()
  if (!target) return { ok: false, error: '缺少条目' }
  let changed = false
  const next = md.split('\n').map((line) => {
    const m = line.match(/^-\s*\[([ xX])\]\s*(.+?)\s*$/)
    if (!m || m[2] !== target) return line
    changed = true
    return '- [' + (done ? 'x' : ' ') + '] ' + m[2]
  }).join('\n')
  if (!changed) return { ok: false, error: '没找到这条' }
  return saveDocs({ config, root: loaded.root, writes: [{ file, next }], message: 'bag: ' + loaded.summary.name })
}

export async function addBag(config, childId, section, text) {
  const loaded = load(config, childId)
  if (!loaded.ok) return loaded
  const item = String(text || '').trim()
  const sec = String(section || '其他').trim() || '其他'
  if (!item) return { ok: false, error: '写一下要带什么' }
  const scan = scanPrivacy(item, { realNames: config.realNames })
  if (!scan.ok) return { ok: false, blocked: true, error: privacyMessage(scan.hits), hits: scan.hits }
  const file = docPath(loaded.docs, loaded.summary.name, '待产包')
  const md = readText(file)
  if (!md) return { ok: false, error: '还没有待产包清单' }
  const lines = md.split('\n')
  const heading = lines.findIndex((l) => l.trim() === '## ' + sec)
  if (heading >= 0) {
    let at = lines.length
    for (let i = heading + 1; i < lines.length; i++) if (lines[i].startsWith('## ')) { at = i; break }
    lines.splice(at, 0, '- [ ] ' + item)
  } else {
    lines.push('', '## ' + sec, '', '- [ ] ' + item)
  }
  return saveDocs({ config, root: loaded.root, writes: [{ file, next: lines.join('\n') }], message: 'bag add: ' + loaded.summary.name })
}

/** 删除最近一条报告类摘要（医院评估/孕检报告/体检），用于隐私纠错；只删表里最后一行。 */
export async function deleteLastReport(config, childId) {
  const loaded = load(config, childId)
  if (!loaded.ok) return loaded
  const { docs, summary } = loaded
  const candidates = [
    ['医院评估', '机构'],
    ['孕检报告', '报告'],
    ['数据-生长与健康', '项目'],
  ]
  for (const [name, headWord] of candidates) {
    const file = docPath(docs, summary.name, name)
    if (!existsSync(file)) continue
    const md = readText(file)
    const lines = md.split('\n')
    const hi = lines.findIndex((l) => l.trim().startsWith('|') && l.includes(headWord))
    if (hi < 0) continue
    let end = hi + 2
    while (end < lines.length && lines[end].trim().startsWith('|')) end++
    const dataStart = hi + 2
    if (end <= dataStart) continue
    let removeAt = end - 1
    while (removeAt >= hi + 2 && lines[removeAt].replace(/[|\s-]/g, '') === '') removeAt--
    if (removeAt < hi + 2) continue
    const removed = lines[removeAt]
    const next = lines.slice(0, removeAt).concat(lines.slice(removeAt + 1)).join('\n')
    const saved = await saveDocs({ config, root: loaded.root, writes: [{ file, next }], message: 'privacy: delete last report ' + summary.name })
    if (!saved.ok) return saved
    return { ok: true, removed, file: name, committed: saved.committed }
  }
  return { ok: false, error: '没有找到可删除的报告摘要' }
}

export async function answerTodo(config, childId, text, answer) {
  const loaded = load(config, childId)
  if (!loaded.ok) return loaded
  const needle = String(text || '').trim()
  const body = String(answer || '').trim()
  if (!needle) return { ok: false, error: '缺少待办内容' }
  if (!body) return { ok: false, error: '请填写内容' }
  const file = docPath(loaded.docs, loaded.summary.name, '待补清单')
  const md = readText(file)
  const lines = md.split('\n')
  let hit = -1
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*-\s*\[ \]/.test(lines[i]) && lines[i].includes(needle)) { hit = i; break }
  }
  if (hit < 0) return { ok: false, error: '没找到这条待办' }
  const nextLine = lines[hit].replace('- [ ]', '- [x]') + '：' + body.replace(/\n/g, ' ')
  lines[hit] = nextLine
  const saved = await saveDocs({ config, root: loaded.root, writes: [{ file, next: lines.join('\n') }], message: 'todo answer: ' + loaded.summary.name, scanText: body })
  if (!saved.ok) return saved
  return { ok: true, committed: saved.committed }
}

// ── 待确认记录：模型不确定/敏感内容先放活动区，用户选完再写 ──────────────
function pendingPath(docs) {
  return join(docs, '.待确认记录.json')
}

function readPendingFile(docs) {
  try {
    const p = pendingPath(docs)
    if (!existsSync(p)) return []
    const arr = JSON.parse(readText(p) || '[]')
    return Array.isArray(arr) ? arr : []
  } catch { return [] }
}

export function listPending(config, childId) {
  const loaded = load(config, childId)
  if (!loaded.ok) return loaded
  return { ok: true, items: readPendingFile(loaded.docs).filter((x) => x.status !== 'done') }
}

export async function addPending(config, childId, item = {}) {
  const loaded = load(config, childId)
  if (!loaded.ok) return loaded
  const summary = String(item.summary || item.text || '').trim()
  if (!summary) return { ok: false, error: '待确认内容为空' }
  const scan = scanPrivacy(summary, { realNames: config.realNames })
  if (!scan.ok) return { ok: false, blocked: true, error: privacyMessage(scan.hits), hits: scan.hits }
  const list = readPendingFile(loaded.docs)
  const pending = {
    id: 'p-' + Date.now().toString(36),
    createdAt: todayISO(),
    status: 'pending',
    kind: String(item.kind || 'record'),
    payload: item.payload || {},
    summary,
  }
  list.push(pending)
  try {
    writeFileAtomic(pendingPath(loaded.docs), JSON.stringify(list, null, 2))
    return { ok: true, pending, receipt: '已放进待确认：' + summary }
  } catch (e) { return { ok: false, error: String(e && e.message ? e.message : e) } }
}

export async function confirmPending(config, childId, id) {
  const loaded = load(config, childId)
  if (!loaded.ok) return loaded
  const list = readPendingFile(loaded.docs)
  const item = list.find((x) => x.id === id && x.status === 'pending')
  if (!item) return { ok: false, error: '这条待确认已经不在了' }
  const r = await write(config, childId, item.kind, item.payload)
  if (!r.ok) return r
  try {
    writeFileAtomic(pendingPath(loaded.docs), JSON.stringify(list.filter((x) => x.id !== id), null, 2))
  } catch (e) { return { ok: false, error: '写入成功，但待确认列表清理失败：' + String(e && e.message ? e.message : e) } }
  return { ok: true, receipt: r.receipt || '已确认写入' }
}

export async function cancelPending(config, childId, id) {
  const loaded = load(config, childId)
  if (!loaded.ok) return loaded
  const list = readPendingFile(loaded.docs)
  if (!list.some((x) => x.id === id)) return { ok: false, error: '这条待确认已经不在了' }
  try {
    writeFileAtomic(pendingPath(loaded.docs), JSON.stringify(list.filter((x) => x.id !== id), null, 2))
    return { ok: true }
  } catch (e) { return { ok: false, error: String(e && e.message ? e.message : e) } }
}
