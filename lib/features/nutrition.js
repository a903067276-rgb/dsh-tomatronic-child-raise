/**
 * 营养对照：只把用户已记的辅食/奶粉估算，和同月龄官方参考量摆在一起。
 * 不是摄入调查，不诊断；缺项/没记都可能导致偏低。
 */
export const NUTRITION_SOURCE = {
  title: '中国居民膳食营养素参考摄入量（2023）',
  url: 'https://www.cnsoc.org/',
  note: '按年龄段的参考量；能量/蛋白等有性别和活动差异，只作对照，不替代医生/营养师。',
}

export const NUTRITION_REFERENCE = [
  { min: 0, max: 6, label: '0–6 月龄', kcalPerKg: 90, protein: 9, iron: 0.3, calcium: 200, zinc: 2, vitaminD: 10 },
  { min: 7, max: 12, label: '7–12 月龄', kcalPerKg: 80, protein: 20, iron: 10, calcium: 260, zinc: 3.5, vitaminD: 10 },
  { min: 13, max: 36, label: '1–3 岁', kcal: 1000, protein: 25, iron: 9, calcium: 600, zinc: 4, vitaminD: 10 },
]

export function nutritionRef(months) {
  const m = Number(months)
  if (!Number.isFinite(m)) return undefined
  return NUTRITION_REFERENCE.find((r) => m >= r.min && m <= r.max)
}

export function parseNutritionText(text) {
  const raw = String(text || '')
  const num = (re) => { const m = raw.match(re); return m ? Number(m[1]) : undefined }
  const kj = num(/([\d.]+)\s*kJ/i)
  return {
    kcal: num(/(?:约\s*)?([\d.]+)\s*(?:kcal|千卡|大卡)/i) ?? (kj !== undefined ? Math.round(kj / 4.184) : num(/能量\s*([\d.]+)/)),
    protein: num(/蛋白(?:质)?\s*(?:约\s*)?([\d.]+)\s*g/i),
    iron: num(/铁\s*(?:约\s*)?([\d.]+)\s*mg/i),
    calcium: num(/钙\s*(?:约\s*)?([\d.]+)\s*mg/i),
    zinc: num(/锌\s*(?:约\s*)?([\d.]+)\s*mg/i),
  }
}

// 只按常见儿童份量粗估；用户没写克数时也能给一个参考，不当作精确摄入。
const FOOD_ESTIMATES = [
  { re: /米饭|白饭|大米饭/, grams: 50, kcal: 116, protein: 2.6, iron: 0.2, calcium: 7, zinc: 0.6 },
  { re: /面条|面片|意面/, grams: 50, kcal: 110, protein: 4.0, iron: 0.5, calcium: 8, zinc: 0.5 },
  { re: /粥|稀饭/, grams: 120, kcal: 46, protein: 1.1, iron: 0.2, calcium: 7, zinc: 0.2 },
  { re: /排骨|猪肉|瘦肉|肉末/, grams: 30, kcal: 260, protein: 17, iron: 1.2, calcium: 8, zinc: 2.0 },
  { re: /鸡肉|鸡胸|鸡腿/, grams: 30, kcal: 165, protein: 20, iron: 0.5, calcium: 8, zinc: 1.0 },
  { re: /鱼|虾|龙利鱼/, grams: 30, kcal: 100, protein: 18, iron: 0.5, calcium: 30, zinc: 0.6 },
  { re: /鸡蛋|蛋黄|蛋羹/, grams: 50, kcal: 144, protein: 13, iron: 2.0, calcium: 56, zinc: 1.1 },
  { re: /豆腐|豆制品/, grams: 40, kcal: 80, protein: 8, iron: 1.5, calcium: 80, zinc: 0.6 },
  { re: /西兰花/, grams: 30, kcal: 34, protein: 2.8, iron: 0.7, calcium: 47, zinc: 0.4 },
  { re: /青菜|菠菜|蔬菜|生菜|油菜/, grams: 30, kcal: 20, protein: 1.5, iron: 1.0, calcium: 50, zinc: 0.3 },
  { re: /土豆|红薯|山药/, grams: 40, kcal: 80, protein: 1.5, iron: 0.5, calcium: 10, zinc: 0.3 },
  { re: /南瓜|胡萝卜/, grams: 30, kcal: 25, protein: 0.7, iron: 0.3, calcium: 15, zinc: 0.2 },
  { re: /苹果|香蕉|梨|葡萄|草莓|蓝莓|橙子|猕猴桃|牛油果|水果/, grams: 50, kcal: 52, protein: 0.3, iron: 0.2, calcium: 6, zinc: 0.1 },
  { re: /酸奶|牛奶|奶昔/, grams: 100, kcal: 70, protein: 3.0, iron: 0.1, calcium: 100, zinc: 0.4 },
  { re: /饼干|面包|蛋糕|溶豆|米饼|奶酪|坚果酱|零食/, grams: 20, kcal: 400, protein: 7, iron: 1.5, calcium: 50, zinc: 0.8 },
  { re: /米粉|米糊|燕麦/, grams: 30, kcal: 380, protein: 7, iron: 3.0, calcium: 100, zinc: 1.5 },
]
export function estimateFoodNutrition(text, foodType) {
  const raw = String(text || '')
  let any = false
  const total = { kcal: 0, protein: 0, iron: 0, calcium: 0, zinc: 0 }
  for (const f of FOOD_ESTIMATES) {
    if (!f.re.test(raw)) continue
    any = true
    const ratio = f.grams / 100
    total.kcal += f.kcal * ratio
    total.protein += f.protein * ratio
    total.iron += f.iron * ratio
    total.calcium += f.calcium * ratio
    total.zinc += f.zinc * ratio
  }
  if (any) return total
  // 只写了“水果/零食/饮料”这种大类时，也给一个保守的常见儿童份量。
  const fallback = {
    '水果': { kcal: 52, protein: 0.3, iron: 0.2, calcium: 6, zinc: 0.1 },
    '零食': { kcal: 100, protein: 1.5, iron: 0.3, calcium: 10, zinc: 0.2 },
    '饮料': { kcal: 45, protein: 0.3, iron: 0.1, calcium: 10, zinc: 0.1 },
  }[String(foodType || '')]
  return fallback ? { ...fallback } : undefined
}

export function buildNutritionCompare(foodRows = [], formulaRows = [], months, weight, milkRows = [], today = new Date()) {
  const ref = nutritionRef(months)
  if (!ref) return { ok: false, error: '没有对应月龄的参考' }
  const cutoff = new Date(today.getTime() - 6 * 86400000).toISOString().slice(0, 10)
  const rows = []
  let missing = 0
  let estimatedRows = 0
  const has = (v) => Object.values(v || {}).some((x) => Number.isFinite(Number(x)) && Number(x) > 0)
  for (const r of foodRows || []) {
    if (!r.date || r.date < cutoff) continue
    const v = parseNutritionText(r.nutrition)
    if (has(v)) { rows.push({ date: r.date, ...v }); continue }
    const est = estimateFoodNutrition(r.food || r.ingredients, r.foodType)
    if (est) { rows.push({ date: r.date, ...est }); estimatedRows += 1 }
    else missing += 1
  }
  for (const r of formulaRows || []) {
    if (!r.date || r.date < cutoff) continue
    const label = parseNutritionText(r.label)
    if (has(label) && Number(r.amount) > 0) {
      const ml = Number(r.amount)
      rows.push({ date: r.date, kcal: (label.kcal || 0) * ml / 100, protein: (label.protein || 0) * ml / 100, iron: (label.iron || 0) * ml / 100, calcium: (label.calcium || 0) * ml / 100, zinc: (label.zinc || 0) * ml / 100 })
      continue
    }
    const v = parseNutritionText(r.estimate)
    if (has(v)) { rows.push({ date: r.date, ...v }); continue }
    const ml = Number(r.amount) || Number(String(r.intake || r.water || '').match(/\d+(?:\.\d+)?/)?.[0] || 0)
    if (ml > 0) {
      // 没有标签时，用常见配方奶的保守参考值先估，页面会标“估算”。
      rows.push({ date: r.date, kcal: ml * 0.67, protein: ml * 0.013, iron: ml * 0.007, calcium: ml * 0.5, zinc: ml * 0.005 })
      estimatedRows += 1
    } else missing += 1
  }
  const milkDefaults = {
    '母乳': { kcal: 70, protein: 1.0, iron: 0.1, calcium: 30, zinc: 0.2 },
    '奶粉': { kcal: 67, protein: 1.3, iron: 0.7, calcium: 50, zinc: 0.5 },
    '水奶': { kcal: 67, protein: 1.3, iron: 0.7, calcium: 50, zinc: 0.5 },
    '牛奶': { kcal: 65, protein: 3.3, iron: 0.1, calcium: 120, zinc: 0.4 },
    '混合': { kcal: 67, protein: 1.3, iron: 0.6, calcium: 50, zinc: 0.5 },
    '其他': { kcal: 67, protein: 1.3, iron: 0.6, calcium: 50, zinc: 0.5 },
  }
  for (const r of milkRows || []) {
    if (r.derived || r.formula) continue
    if (!r.date || r.date < cutoff) continue
    const ml = Number(r.amount) || 0
    if (ml <= 0) { missing += 1; continue }
    const label = parseNutritionText(r.label)
    if (has(label)) {
      rows.push({ date: r.date, kcal: (label.kcal || 0) * ml / 100, protein: (label.protein || 0) * ml / 100, iron: (label.iron || 0) * ml / 100, calcium: (label.calcium || 0) * ml / 100, zinc: (label.zinc || 0) * ml / 100 })
      continue
    }
    const d = milkDefaults[r.milkType] || milkDefaults['其他']
    rows.push({ date: r.date, kcal: ml * d.kcal / 100, protein: ml * d.protein / 100, iron: ml * d.iron / 100, calcium: ml * d.calcium / 100, zinc: ml * d.zinc / 100 })
  }
  const days = [...new Set(rows.map((r) => r.date))].filter(Boolean)
  const n = Math.max(days.length, 1)
  const sum = (key) => rows.reduce((a, r) => a + (Number(r[key]) || 0), 0)
  const totals = { kcal: sum('kcal'), protein: sum('protein'), iron: sum('iron'), calcium: sum('calcium'), zinc: sum('zinc') }
  const avg = Object.fromEntries(Object.entries(totals).map(([k, v]) => [k, v / n]))
  const w = Number(weight)
  const kcalRef = ref.kcalPerKg && Number.isFinite(w) && w > 0 ? Math.round(ref.kcalPerKg * w) : ref.kcal
  return {
    ok: true,
    ref: { ...ref, kcal: kcalRef },
    days: days.length,
    recordedDays: days.length,
    totals,
    avg,
    source: NUTRITION_SOURCE,
    missing,
    estimatedRows,
    estimated: estimatedRows > 0,
    note: days.length ? '只按已记录的餐食/奶粉/奶量估算；没记的不代表没吃。没写克数的餐食按常见儿童份量粗估；仍算不出的记录不计入，补营养估算后自动重算。' : '最近 7 天没有可估算的记录。',
  }
}
