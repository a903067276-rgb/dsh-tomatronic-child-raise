/**
 * 隐私扫描：公开机构信息放行，个人信息拦截。
 * 命中 → 不写，返回命中类型，由 agent/表单提示用户改。
 */
const PUBLIC_ORG = /(医院|妇幼|儿保|诊所|学校|幼儿园|托育|公园|商场|车站|地铁|图书馆|体育馆)/
const PERSONAL_ADDR = /(我家|我家住|家住|住在|小区|花园|公寓|号楼|单元|门牌|室|弄|巷)/
const NUM_ADDR = /\d+\s*(号楼|单元|室|层|栋)/

const HARD = [
  { type: '手机号', re: /1[3-9]\d{9}/ },
  { type: '身份证号', re: /\d{17}[\dXx]/ },
  { type: '银行卡号', re: /\d{16,19}/ },
  { type: '邮箱', re: /[\w.+-]+@[\w-]+\.[\w.]+/ },
  { type: '车牌', re: /[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼][A-Z][A-Z0-9]{4,5}/ },
  { type: '证件', re: /(身份证|户口本|护照|出生医学证明|医保卡).{0,12}\d/ },
  { type: '就诊号', re: /(门诊号|住院号|病历号|就诊卡号|社保卡号|医保号|床号|登记号)\s*[:：]?\s*[A-Za-z0-9-]{3,}/ },
  { type: '姓名', re: /(患者姓名|姓名)\s*[:：]?\s*[\u4e00-\u9fa5]{2,4}/ },
]

export function scanPrivacy(text, options = {}) {
  const raw = String(text == null ? '' : text)
  const hits = []
  for (const { type, re } of HARD) {
    const m = raw.match(re)
    if (m) hits.push({ type, sample: mask(m[0]) })
  }
  if (PERSONAL_ADDR.test(raw) && !PUBLIC_ORG.test(raw)) {
    if (NUM_ADDR.test(raw) || /(我家|家住|住在|小区)/.test(raw)) hits.push({ type: '家庭住址', sample: '' })
  }
  for (const name of options.realNames || []) {
    const n = String(name || '').trim()
    if (n.length >= 2 && raw.includes(n)) hits.push({ type: '真名', sample: '' })
  }
  return { ok: hits.length === 0, hits }
}

function mask(s) {
  const t = String(s)
  if (t.length <= 4) return '***'
  return t.slice(0, 2) + '***' + t.slice(-2)
}

export function privacyMessage(hits) {
  const types = [...new Set(hits.map((h) => h.type))].join('、')
  return '这条里有' + types + '，我先没记。改成公开说法（如「社区医院」「XX 小区」）或删掉号码，我再记？'
}
