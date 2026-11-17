/**
 * 国家免疫规划疫苗儿童免疫程序（参考，2021 年版）。
 * 具体以当地接种门诊为准；这里只做对照，不构成医疗建议。
 */
export const VACCINE_SCHEDULE = [
  { age: '出生', months: 0, items: ['乙肝疫苗 第1剂', '卡介苗'] },
  { age: '1 月龄', months: 1, items: ['乙肝疫苗 第2剂'] },
  { age: '2 月龄', months: 2, items: ['脊灰灭活疫苗 第1剂'] },
  { age: '3 月龄', months: 3, items: ['脊灰灭活疫苗 第2剂', '百白破 第1剂'] },
  { age: '4 月龄', months: 4, items: ['脊灰减毒活疫苗 第3剂', '百白破 第2剂'] },
  { age: '5 月龄', months: 5, items: ['百白破 第3剂'] },
  { age: '6 月龄', months: 6, items: ['乙肝疫苗 第3剂', 'A 群流脑 第1剂'] },
  { age: '8 月龄', months: 8, items: ['麻腮风 第1剂', '乙脑减毒活疫苗 第1剂'] },
  { age: '9 月龄', months: 9, items: ['A 群流脑 第2剂'] },
  { age: '18 月龄', months: 18, items: ['百白破 第4剂', '麻腮风 第2剂', '甲肝减毒活疫苗 第1剂'] },
  { age: '2 岁', months: 24, items: ['乙脑减毒活疫苗 第2剂'] },
  { age: '3 岁', months: 36, items: ['A+C 群流脑 第1剂'] },
  { age: '4 岁', months: 48, items: ['脊灰减毒活疫苗 第4剂'] },
  { age: '6 岁', months: 72, items: ['白破 第1剂', 'A+C 群流脑 第2剂'] },
]

export const VACCINE_SOURCE = {
  title: '国家免疫规划疫苗儿童免疫程序及说明（2021 年版）',
  url: 'https://www.nhc.gov.cn/',
  note: '乙脑/甲肝有减毒与灭活不同程序；以当地接种门诊为准。',
}

const VACCINE_KEY = [
  [/^乙肝|HepB/i, '乙肝'],
  [/卡介苗|BCG/i, '卡介苗'],
  [/脊灰.*灭活|IPV/i, '脊灰灭活'],
  [/脊灰.*减毒|OPV|糖丸/i, '脊灰减毒'],
  [/五联|Pentaxim|潘太欣/i, '五联'],
  [/百白破|DTP/i, '百白破'],
  [/^白破|DT$/i, '白破'],
  [/麻腮风|MMR/i, '麻腮风'],
  [/乙脑.*灭活|JE.*inactiv/i, '乙脑灭活'],
  [/乙脑|JE/i, '乙脑'],
  [/甲肝.*灭活|HepA.*inactiv/i, '甲肝灭活'],
  [/甲肝|HepA/i, '甲肝'],
  [/四价流脑|ACYW|流脑结合/i, '四价流脑'],
  [/A\+C|AC.*流脑/i, 'A+C流脑'],
  [/A群|A\s*群/i, 'A群流脑'],
  [/13\s*价.*肺炎|PCV13/i, '13价肺炎'],
  [/5\s*价.*轮状|五价.*轮状|轮状/i, '5价轮状'],
  [/水痘|VarV/i, '水痘'],
  [/Hib|b型流感/i, 'Hib'],
  [/EV71|手足口/i, 'EV71'],
]

export const SELF_PAID_VACCINES = [
  { key: '五联', name: '五联疫苗', covers: [{ key: '百白破', doses: 4 }, { key: '脊灰灭活', doses: 4, label: '脊灰 1–4 针（IPV1–2、bOPV3–4）' }, { key: '脊灰减毒', doses: 4, hidden: true }], note: '含百白破+脊灰灭活+Hib；全程 4 剂五联可视为完成百白破和脊灰程序（IPV 1–2、bOPV 3–4）；Hib 不在国家免费程序内。未全程按门诊补。' },
  { key: '甲肝灭活', name: '甲肝灭活疫苗', covers: [{ key: '甲肝', doses: 1 }], note: '可替代国家程序的甲肝减毒活疫苗；按当地门诊程序。' },
  { key: '乙脑灭活', name: '乙脑灭活疫苗', covers: [{ key: '乙脑', doses: 2 }], note: '可替代国家程序的乙脑减毒活疫苗；针次按当地门诊程序。' },
  { key: '13价肺炎', name: '13 价肺炎结合疫苗', covers: [], note: '国家免疫规划没有免费肺炎结合疫苗；不替代任何官方针次。' },
  { key: '5价轮状', name: '5 价轮状病毒疫苗', covers: [], note: '自费；国家免疫规划没有免费轮状疫苗，不替代官方针次。' },
  { key: '水痘', name: '水痘疫苗', covers: [], note: '自费；部分地区纳入地方免费程序，但不是国家统一规划，不替代官方针次。' },
  { key: '四价流脑', name: '四价流脑结合疫苗', covers: [{ key: 'A群流脑', doses: 2 }], note: '6/9 月龄基础剂次可按当地程序替代 A 群流脑；3/6 岁 A+C 是否替代看产品年龄和当地程序，不自动算。' },
  { key: 'Hib', name: 'Hib 疫苗', covers: [], note: '自费；国家免疫规划没有单独 Hib 针次，不替代官方针次。' },
  { key: 'EV71', name: 'EV71/手足口疫苗', covers: [], note: '自费；不替代国家免疫规划针次。' },
]

export const VACCINE_COMBOS = SELF_PAID_VACCINES.filter((v) => v.covers.length > 0)

export function vaccineKey(name) {
  const raw = String(name || '').replace(/疫苗|针|第\s*\d+\s*剂|（.*?）|\(.*?\)|\s/g, '')
  const hit = VACCINE_KEY.find(([re]) => re.test(raw))
  return hit ? hit[1] : raw
}

function doseOf(row) {
  const fromDose = String(row.dose || '').match(/(\d+)/)
  if (fromDose) return Number(fromDose[1])
  const fromName = String(row.name || '').match(/第\s*(\d+)\s*剂/)
  return fromName ? Number(fromName[1]) : undefined
}

export const VACCINE_DOSES = VACCINE_SCHEDULE.flatMap((slot) => slot.items.map((item) => {
  const m = String(item).match(/^(.*?)\s*第\s*(\d+)\s*剂$/)
  const vaccine = m ? m[1].trim() : String(item).trim()
  return {
    key: vaccineKey(vaccine),
    vaccine,
    dose: m ? Number(m[2]) : 1,
    months: slot.months,
    age: slot.age,
  }
}))

export function compareVaccines(rows = [], plans = [], ageMonths) {
  const actual = (rows || []).map((r) => ({
    ...r, key: vaccineKey(r.name), dose: doseOf(r),
  }))
  const mapped = (plans || []).map((p) => ({
    ...p, key: vaccineKey(p.official), officialDose: Number(String(p.officialDose || '').match(/(\d+)/)?.[1] || 0),
  }))
  const used = new Set()
  const comboHit = (d) => {
    for (const combo of VACCINE_COMBOS) {
      const cover = combo.covers.find((c) => c.key === d.key && d.dose <= c.doses)
      if (!cover) continue
      const hit = actual.find((x) => x.key === combo.key && x.dose === d.dose)
      if (hit) return { hit, combo }
    }
    return null
  }
  const official = VACCINE_DOSES.map((d) => {
    const a = actual.find((x) => x.key === d.key && x.dose === d.dose)
    const p = mapped.find((x) => x.key === d.key && x.officialDose === d.dose)
    const c = a ? null : comboHit(d)
    if (a) used.add(a)
    if (c) used.add(c.hit)
    let status = 'future'
    if (a) status = 'done'
    else if (c) status = 'alt'
    else if (p) status = 'alt'
    else if (Number.isFinite(Number(ageMonths)) && Number(ageMonths) >= d.months) status = 'due'
    return {
      ...d, status,
      date: a ? a.date : (c ? c.hit.date : ''),
      plan: c ? c.hit.name : (p ? p.actual : ''),
      planDose: c ? c.hit.dose : (p ? p.actualDose : ''),
      note: c ? c.combo.note : (p ? p.note : ''),
    }
  })
  const selfKeys = new Set(SELF_PAID_VACCINES.map((v) => v.key))
  const extras = actual.filter((x) => !used.has(x) && !selfKeys.has(x.key))
  const selfPaid = SELF_PAID_VACCINES.map((v) => {
    const got = actual.filter((x) => x.key === v.key)
    return { ...v, doses: got.length, dates: got.map((x) => x.date).filter(Boolean) }
  })
  return {
    official,
    extras,
    selfPaid,
    summary: {
      total: official.length,
      done: official.filter((x) => x.status === 'done').length,
      due: official.filter((x) => x.status === 'due').length,
      alt: official.filter((x) => x.status === 'alt').length,
      future: official.filter((x) => x.status === 'future').length,
      extras: extras.length,
    },
  }
}
