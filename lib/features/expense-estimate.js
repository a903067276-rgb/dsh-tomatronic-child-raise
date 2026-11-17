/**
 * 育儿花费估算：用户没填实际花费时，按记录 + 示例均价粗估。
 * 不是实际支出，也不是当地实时物价；只用于提示“大概可能有多少”。
 */
const PRICES = {
  formulaPerMl: 0.045, // 约 45 元/升，示例
  diaperEach: 1.2,
  foodPerDay: 12,
  pregnancyBasePerDay: 12,
  checkupEach: 150,
}

const firstNumber = (v) => {
  const m = String(v == null ? '' : v).replace(/,/g, '').match(/\d+(?:\.\d+)?/)
  return m ? Number(m[0]) : 0
}
const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0

export function buildExpenseEstimate({ stage, months, recordRows = [], formulaRows = [], foodRows = [], checkupRows = [], pregnancy = null } = {}) {
  const recent = (recordRows || []).slice(0, 7)
  const formulaRecent = (formulaRows || []).slice(-7)
  const monthScale = 30

  if (stage === 'pregnancy') {
    const checks = (pregnancy && (pregnancy.checkups || pregnancy.reports)) || []
    const checkCost = checks.length ? PRICES.checkupEach * Math.min(checks.length, 3) / 3 : 0
    const daily = PRICES.pregnancyBasePerDay
    const monthly = Math.round(daily * monthScale + checkCost)
    return {
      ok: true,
      monthly,
      breakdown: [
        { label: '日常营养/用品', amount: Math.round(daily * monthScale), note: '示例 ¥12/天' },
        { label: '产检/检查', amount: Math.round(checkCost), note: checks.length ? '按最近记录均摊到每月' : '还没记录产检' },
      ],
      assumptions: [
        '示例均价：日常 ¥12/天；产检按 ¥150/次、最近记录均摊',
        '不是实际支出；不同城市/医院差异很大',
      ],
      source: '示例均价（不是当地实时物价）',
    }
  }

  if (!['newborn', 'infant', 'toddler'].includes(stage)) {
    return { ok: false, reason: '这个阶段没有可参考的固定喂养/尿布记录；先记一笔实际花费更准。' }
  }

  const days = new Set(recent.map((r) => r.date).filter(Boolean)).size || Math.min(recent.length, 7)
  const milkMl = avg(recent.map((r) => firstNumber(r.milk)).filter((x) => x > 0))
  const formulaMl = avg(formulaRecent.map((r) => firstNumber(r.intake) || firstNumber(r.water)).filter((x) => x > 0))
  const useMilk = formulaMl || milkMl
  const formulaCost = Math.round(useMilk * PRICES.formulaPerMl * monthScale)
  const poop = avg(recent.map((r) => firstNumber(r.poop)))
  const pee = avg(recent.map((r) => firstNumber(r.pee)))
  const diapers = Math.max(4, Math.min(10, poop + pee || 6))
  const diaperCost = Math.round(diapers * PRICES.diaperEach * monthScale)
  const foodCost = Number(months) >= 6 && (foodRows || []).length ? Math.round(PRICES.foodPerDay * monthScale) : 0
  const checkCost = (checkupRows || []).length ? Math.round(PRICES.checkupEach * 2 / 3) : 0
  const monthly = formulaCost + diaperCost + foodCost + checkCost
  return {
    ok: monthly > 0,
    monthly,
    breakdown: [
      { label: '奶/奶粉', amount: formulaCost, note: useMilk ? '按最近记录平均奶量 × 示例 ¥0.045/ml' : '没有奶量记录' },
      { label: '尿布', amount: diaperCost, note: '按最近记录尿/便次数估算 ' + diapers + ' 片/天 × 示例 ¥1.2/片' },
      { label: '辅食', amount: foodCost, note: foodCost ? '按 ¥12/天示例' : '还没到辅食或没有辅食记录' },
      { label: '体检/医疗', amount: checkCost, note: checkCost ? '按最近有体检记录、示例 ¥150/次' : '没有体检记录' },
    ],
    assumptions: [
      '示例均价：奶粉 ¥0.045/ml、尿布 ¥1.2/片、辅食 ¥12/天、体检 ¥150/次',
      '按最近 ' + Math.max(days, 1) + ' 天记录估算；记录少会偏差很大',
      '不是实际支出，也不是当地实时物价；母乳/亲喂不产生奶粉费用，会被高估',
    ],
    source: '示例均价（不是当地实时物价）',
  }
}
