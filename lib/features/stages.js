/**
 * 阶段与评估：按月龄给自评表、预警征象、体检点。
 * 只做筛查提示，不诊断。
 */
export const SELF_CHECK = {
  3: ['被竖抱时头可以稳稳立着', '能把玩具握一会儿', '和宝宝说话能发声回应', '能用眼睛寻找声源', '对宝宝笑能用笑回应'],
  6: ['自己坐一会儿（可手撑地）', '玩具从一只手传到另一只手', '叫名字朝声音方向转头', '看到物品掉落会去找', '能区分熟人和生人'],
  8: ['腹部贴床爬行', '两手拿小东西对敲', '发一连串重复音节', '注意物品上的细节', '对陌生人有害怕反应'],
  12: ['不扶东西自己站数秒', '把小丸放进小瓶', '听懂 1 个以上物品名', '模仿他人正在做的动作', '对他人表情有反应'],
  18: ['扶着墙或栏杆上楼梯', '用手旋拧（拧瓶盖、上发条）', '说出 3 个有意义的词', '知道常用物品用途', '与他人玩传球等互动游戏'],
  24: ['双脚同时离地跳起', '一页页地翻书', '说简单的句子（如“妈妈抱宝宝”）', '玩装扮游戏（假装给娃娃喂饭）', '主动示意大小便'],
  30: ['会跑且很少摔', '说 2–3 个字的短语', '能听懂两步指令', '能拧开瓶盖', '会自己用勺吃饭'],
  36: ['单脚站片刻', '双脚交替上楼梯', '能说完整句子', '会自己穿鞋', '能和小朋友轮流玩'],
}

export const WARNING = {
  24: ['不会说 3 个物品的名称', '不会按吩咐做简单事情', '不会用勺吃饭', '不会扶栏上楼梯/台阶'],
  30: ['不会说 2–3 个字的短语', '兴趣单一、刻板', '不会示意大小便', '不会跑'],
}

export const CHECKPOINTS = [3, 6, 8, 12, 18, 24, 30, 36]

export const STAGE_INFO = {
  preconception: { key: 'preconception', label: '备孕', depth: 'L1' },
  pregnancy: { key: 'pregnancy', label: '孕期', depth: 'L1' },
  newborn: { key: 'newborn', label: '新生儿', depth: 'L2' },
  infant: { key: 'infant', label: '婴儿', depth: 'L2' },
  toddler: { key: 'toddler', label: '0–3 岁', depth: 'L2' },
  preschool: { key: 'preschool', label: '3–6 岁', depth: 'L1' },
  school: { key: 'school', label: '6 岁+', depth: 'L0' },
}

export function stageInfo(key) {
  return STAGE_INFO[String(key || '')]
}

export function stageOf(months) {
  if (!Number.isFinite(months)) return { key: 'unknown', label: '未知', depth: 'L0' }
  if (months <= 1) return { key: 'newborn', label: '新生儿', depth: 'L2' }
  if (months <= 12) return { key: 'infant', label: '婴儿', depth: 'L2' }
  if (months <= 36) return { key: 'toddler', label: '0–3 岁', depth: 'L2' }
  if (months <= 72) return { key: 'preschool', label: '3–6 岁', depth: 'L1' }
  return { key: 'school', label: '6 岁+', depth: 'L0' }
}

export function nearestCheckpoint(months) {
  if (!Number.isFinite(months)) return undefined
  let current
  let next
  for (const m of CHECKPOINTS) {
    if (m <= months) current = m
    else if (next === undefined) next = m
  }
  const idx = current === undefined ? -1 : CHECKPOINTS.indexOf(current)
  const previous = idx > 0 ? CHECKPOINTS[idx - 1] : undefined
  return { current, previous, next }
}

export function buildCheckup(months) {
  const age = Number(months)
  const { current, next } = nearestCheckpoint(age)
  const lines = []
  lines.push('【月龄】' + (Number.isFinite(age) ? age + ' 个月' : '未知') + '｜当前筛查点：' + (current ? current + ' 月龄' : '未到') + (next ? '｜下一个：' + next + ' 月龄' : ''))
  if (current && SELF_CHECK[current]) {
    lines.push('\n【家长自评】' + current + ' 月龄 ' + SELF_CHECK[current].length + ' 项（勾"是/否"，不是打分）')
    SELF_CHECK[current].forEach((t, i) => lines.push('  ' + (i + 1) + '. ' + t))
  }
  const warnKey = [24, 30].filter((m) => m <= age).pop() || (age < 24 ? undefined : 24)
  if (warnKey && WARNING[warnKey]) {
    lines.push('\n【预警征象】' + warnKey + ' 月龄（任一条阳性→儿保转诊，不是诊断）')
    WARNING[warnKey].forEach((t) => lines.push('  - ' + t))
  }
  if (next) lines.push('\n【下一个评估点】' + next + ' 月龄：自评表 + 体检；到点前会提醒。')
  lines.push('\n【怎么用】这是筛查，不是诊断；有阳性去儿保问一句，不自己下结论。')
  return lines.join('\n')
}

export function buildAssess(months) {
  const age = Number(months)
  const { current, previous, next } = nearestCheckpoint(age) || {}
  const key = current && SELF_CHECK[current] ? current : next && SELF_CHECK[next] ? next : 24
  const checkpoint = (k, role) => ({
    key: k, role, items: SELF_CHECK[k] || [], warning: WARNING[k] || [],
  })
  const list = []
  if (previous !== undefined) list.push(checkpoint(previous, 'previous'))
  if (current !== undefined) list.push(checkpoint(current, 'current'))
  else if (next !== undefined) list.push(checkpoint(next, 'current'))
  if (next !== undefined && next !== current) list.push(checkpoint(next, 'next'))
  return {
    checkpoint: key,
    previous,
    next,
    checkpoints: list,
    items: SELF_CHECK[key] || [],
    warning: WARNING[key] || [],
    rule: '筛查不是诊断；任一条阳性去儿保。',
  }
}
