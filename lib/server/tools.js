/**
 * 工具：读档案 / 记一笔 / 体检对照 / 量表。
 * 所有写入都走 store.write（单写入口）。
 */
import { defineTool } from '@deepseek-ai/dsh-tools'
import { parseGrowth, parseTimeline, parseTodos, searchArchive } from '../core/archive.js'
import { addPending, buildAssess, buildCheckup, load, overview, write } from '../core/store.js'
import { buildStageGuide } from '../features/stage-guide.js'
import { join } from 'node:path'
import { ensureWorkspace } from '../core/workspace.js'
import { computeEdd, makeBirthChildren } from '../features/pregnancy.js'
import { createArchive } from './onboard.js'

const textOut = (text) => ({ schema: { type: 'object', additionalProperties: false, properties: { text: { type: 'string', required: true } } }, render: (_a, v) => [{ type: 'text', text: (v && v.text) || '' }] })

export function registerTools(ctx, cfg) {
  ctx.effect(() => ctx.tools.register(defineTool({
    name: 'child_profile',
    description: '读孩子的成长档案：月龄、人格与偏好、最近记录、生长数据、待补、评估状态。任何 DSH 会话（不限于问问面板）聊到孩子/育儿/人格/偏好/发育/体检时先调用它。可用 section 选部分，query 搜关键词。',
    parameters: {
      childId: { type: 'string', description: '哪个孩子；不传用第一个' },
      section: { type: 'string', enum: ['auto', 'timeline', 'growth', 'todos', 'assess', 'personality', 'guide', 'files', 'query'], description: '默认 auto（摘要）' },
      query: { type: 'string', description: 'section=query 时的关键词' },
    },
    output: textOut(),
    execute: async (args) => {
      const a = args || {}
      const loaded = load(cfg(), a.childId)
      if (!loaded.ok) return { text: '读不了档案：' + loaded.error }
      const { archive, summary } = loaded
      const section = a.section || 'auto'
      if (section === 'query') {
        const hits = searchArchive(archive, a.query || '', 20)
        return { text: hits.length ? hits.map((h) => h.file + ':' + h.line + '  ' + h.text).join('\n') : '没有命中「' + (a.query || '') + '」。' }
      }
      if (section === 'files') return { text: archive.files.map((f) => f.name + '（' + f.content.length + ' 字）').join('\n') }
      if (section === 'timeline') {
        const items = archive.timeline ? parseTimeline(archive.timeline.content) : []
        return { text: items.slice(-12).reverse().map((i) => i.year + '-' + i.month + '-' + i.day + '｜' + i.ageMonths + ' 月｜' + i.text + (i.source ? '（' + i.source + '）' : '')).join('\n') || '时间线还是空的。' }
      }
      if (section === 'growth') {
        const rows = archive.growth ? parseGrowth(archive.growth.content) : []
        return { text: rows.length ? rows.map((r) => r.date + '｜' + r.ageMonths + ' 月｜' + r.height + ' cm｜' + r.weight + ' kg｜头围 ' + (r.head || '-') + '｜' + r.source).join('\n') : '还没有生长数据。' }
      }
      if (section === 'todos') {
        const t = archive.todos ? parseTodos(archive.todos.content) : { open: 0, sections: [] }
        const lines = []
        for (const s of t.sections) for (const it of s.items) if (!it.done) lines.push('- ' + it.text + '（' + s.title + '）')
        return { text: '未完成 ' + t.open + ' 项：\n' + lines.slice(0, 20).join('\n') }
      }
      if (section === 'guide') {
        const o = overview(cfg(), a.childId)
        if (!o.ok) return { text: '读不了档案：' + o.error }
        const g = o.stageGuide
        return { text: g.items.length ? '【' + g.label + '】\n' + g.items.map((x) => '- ' + x.title + '：' + x.body).join('\n') + '\n' + g.disclaimer : '自由模式：3 岁后由用户决定记什么。' }
      }
      if (section === 'personality') {
        const o = overview(cfg(), a.childId)
        if (!o.ok) return { text: '读不了档案：' + o.error }
        return { text: o.personality.length ? o.personality.map((r) => r.date + '｜' + r.dimension + '｜' + r.observation + (r.context ? '（' + r.context + '）' : '') + '｜' + (r.confidence || '中')).join('\n') : '人格与偏好还是空的。' }
      }
      if (section === 'assess') {
        const a2 = buildAssess(summary.months)
        return { text: '【' + a2.checkpoint + ' 月龄自评】\n' + a2.items.map((x, i) => (i + 1) + '. ' + x).join('\n') + '\n' + a2.rule }
      }
      const o = overview(cfg(), a.childId)
      if (!o.ok) return { text: '读不了档案：' + o.error }
      const lines = [
        '【孩子】' + o.child.name + '｜' + o.child.ageText + '｜' + o.child.stage.label,
        '【档案】' + (o.profile || '（还没有一句话画像）'),
        '【人格/偏好】' + (o.personality && o.personality.length ? o.personality.slice(-4).map((r) => r.dimension + '：' + r.observation + '（' + (r.confidence || '中') + '）').join('；') : '还没有记录'),
        '【阶段】' + (o.stageGuide && o.stageGuide.items.length ? o.stageGuide.label + '：' + o.stageGuide.items.slice(0, 2).map((x) => x.title).join(' / ') : '自由模式'),
        '【生长】' + (o.growth ? o.growth.date + '｜' + o.growth.ageMonths + ' 月｜' + o.growth.height + ' cm｜' + o.growth.weight + ' kg' : '还没有数据'),
        '【待补】未完成 ' + o.todos.open + ' / ' + o.todos.total + ' 项',
        '【最近】' + (o.timeline.length ? o.timeline.slice(0, 3).map((i) => i.text).join('；') : '还没有记录'),
        '【评估】' + o.assess.checkpoint + ' 月龄自评 ' + o.assess.items.length + ' 项（筛查，不是诊断）',
      ]
      return { text: lines.join('\n') }
    },
  })), 'child-raise.profile')

  ctx.effect(() => ctx.tools.register(defineTool({
    name: 'child_record',
    description: '记一笔：写进孩子的工作区（时间线/日常记录/生长表/疫苗表/人格偏好/孕检报告等）。任何 DSH 会话（不限于问问面板）里用户提到孩子的事实/偏好/里程碑/吃睡/健康时都可用它归集；写入前会做隐私扫描；命中就不写，提示用户改。只写一个孩子。',
    parameters: {
      childId: { type: 'string', description: '哪个孩子；不传用第一个' },
      text: { type: 'string', required: true, description: '一句话：第一次自己穿鞋 / 今天说了个新词 / 麻腮风第 2 剂' },
      category: { type: 'string', enum: ['milk', 'poop', 'pee', 'water', 'food', 'formula', 'supplement', 'vaccine', 'vaccinePlan', 'pregnancyBasic', 'hospitalAssessment', 'milestone', 'checkup', 'specialSupplement', 'medication', 'growth', 'personality', 'assessment', 'pregnancyReport', 'pregnancyMed', 'pregnancyMeal', 'behavior', 'sleep', 'health', 'family', 'other', 'expense', 'milkDetail', 'supplementDetail', 'sleepLog', 'todoAdd'], description: '类别；personality=人格/偏好，assessment=自评，pregnancyReport=孕检报告，pregnancyMed=孕期用药/补剂，pregnancyMeal=孕期饮食' },
      date: { type: 'string', description: 'YYYY-MM-DD，默认今天' },
      height: { type: 'number', description: '身高 cm（体检/生长）' },
      weight: { type: 'number', description: '体重 kg' },
      head: { type: 'number', description: '头围 cm；只建议随体检（category=checkup）一起记，不要求家长平时量' },
      dose: { type: 'string', description: '疫苗第几剂' },
      count: { type: 'number', description: '次数（日常记录用：拉了 2 次）' },
      time: { type: 'string', description: '时间点（可选，09:00 或 09:00,15:00）；用户愿意写就带' },
      note: { type: 'string', description: '细节备注（如便便性状）；用户说了才填，没说不推断、不默认' },
      ingredients: { type: 'string', description: '辅食食材与份量（有才填）' },
      nutrition: { type: 'string', description: '营养估算（参考，标来源）' },
      brand: { type: 'string', description: '奶粉品牌/段数' },
      water: { type: 'string', description: '冲调量（几勺+多少水）' },
      intake: { type: 'string', description: '实际喝的量' },
      label: { type: 'string', description: '标签营养（每100ml）' },
      estimate: { type: 'string', description: '估算摄入（参考）' },
      product: { type: 'string', description: '补剂/奶粉产品名' },
      frequency: { type: 'string', description: '频率（每天/隔天…）' },
      start: { type: 'string', description: '开始日期' },
      stop: { type: 'string', description: '停用/结束日期' },
      reason: { type: 'string', description: '医嘱/原因（用药）' },
      item: { type: 'string', description: '体检项目 / 花费项目' },
      amount: { type: 'number', description: '金额（元）/ 奶量 ml（milkDetail 用）' },
      milkType: { type: 'string', description: '奶类：母乳/奶粉/水奶/牛奶/混合/其他' },
      foodType: { type: 'string', description: '食物类型：餐食/零食/饮料/水果（小月龄也叫辅食，按餐食存）' },
      quantity: { type: 'string', description: '份量，如 50g / 1个 / 200ml' },
      unit: { type: 'string', description: '单位：粒/ml/滴/片' },
      ingredients: { type: 'string', description: '补剂成分含量：如 维生素D 400IU、DHA 100mg' },
      sleepType: { type: 'string', description: '睡眠类型：夜间/午睡' },
      sleepStart: { type: 'string', description: '入睡时间 HH:MM' },
      sleepEnd: { type: 'string', description: '醒来时间 HH:MM' },
      duration: { type: 'number', description: '睡眠时长（分钟）' },
      nightWakes: { type: 'number', description: '夜醒次数' },
      dueDate: { type: 'string', description: '待办日期 YYYY-MM-DD' },
      dueTime: { type: 'string', description: '待办时间 HH:MM' },
      expenseCategory: { type: 'string', description: '花费类别：奶粉/尿布/辅食/零食/饮料/水果/医疗/教育/衣物/孕期/其他' },
      product: { type: 'string', description: '具体商品名/品牌段数；用户提到时填，方便查市场价' },
      payer: { type: 'string', description: '支付人（可不填）' },
      result: { type: 'string', description: '体检结果' },
      advice: { type: 'string', description: '医生建议' },
      dimension: { type: 'string', description: '人格/偏好维度：气质/喜欢/不喜欢/安抚/社交/饮食/睡眠/语言/敏感点/变化' },
      context: { type: 'string', description: '人格/偏好的场景或依据，如“在陌生小区”' },
      confidence: { type: 'string', description: '置信度：高/中/低；一次事件用低' },
      scale: { type: 'string', description: '评估量表/月龄，如 24 月龄自评' },
      months: { type: 'number', description: '评估月龄 / 接种时月龄（疫苗记录用）' },
      nextStep: { type: 'string', description: '下一步（用户/医生说的，不要自己下结论）' },
      report: { type: 'string', description: '孕检报告名称，如 NT / 大排畸 / 糖耐' },
      findings: { type: 'string', description: '报告关键指标/结论，只抄用户或报告原文，不解读' },
      week: { type: 'number', description: '孕周' },
      meal: { type: 'string', description: '孕期餐次，如早餐/午餐/加餐' },
      official: { type: 'string', description: '疫苗计划：官方疫苗名，如百白破' },
      officialDose: { type: 'string', description: '疫苗计划：官方第几针' },
      actual: { type: 'string', description: '疫苗计划：实际疫苗名，如五联' },
      actualDose: { type: 'string', description: '疫苗计划：实际第几针' },
      preWeight: { type: 'number', description: '孕期：孕前体重 kg' },
      institution: { type: 'string', description: '医院/儿保机构（公开机构名可以）' },
      assessmentTool: { type: 'string', description: '医院评估工具/项目，如 Gesell / 儿保发育评估' },
      todo: { type: 'string', description: '顺手勾掉一条待补（文字包含即可）' },
      source: { type: 'string', description: '来源：迁移导入 / 家长口述 / 医院报告；迁移时必须填' },
      confirm: { type: 'boolean', description: '报告/体检/医院评估先预览，用户确认后再传 true 写入' },
      needsConfirm: { type: 'boolean', description: '模型判断这条需要用户确认时传 true：不直接写，放进看板「待确认」，用户点确认再写' },
    },
    output: textOut(),
    execute: async (args) => {
      const a = args || {}
      let kind = 'record'
      if (a.height !== undefined || a.weight !== undefined || a.head !== undefined) kind = 'growth'
      else if (a.category === 'vaccine') kind = 'vaccine'
      else if (a.category === 'milestone') kind = 'milestone'
      else if (a.category === 'personality') kind = 'personality'
      else if (a.category === 'assessment') kind = 'assessment'
      else if (a.category === 'expense') kind = 'expense'
      else if (a.category === 'milkDetail') kind = 'milkDetail'
      else if (a.category === 'supplementDetail') kind = 'supplementDetail'
      else if (a.category === 'sleepLog') kind = 'sleepLog'
      else if (a.category === 'todoAdd') kind = 'todoAdd'
      else if (a.category === 'pregnancyReport') kind = 'pregnancyReport'
      else if (a.category === 'pregnancyMed') kind = 'pregnancyMed'
      else if (a.category === 'pregnancyMeal') kind = 'pregnancyMeal'
      else if (a.category === 'vaccinePlan') kind = 'vaccinePlan'
      else if (a.category === 'pregnancyBasic') kind = 'pregnancyBasic'
      else if (a.category === 'hospitalAssessment') kind = 'hospitalAssessment'
      else if (a.todo) kind = 'todo'
      const payload = {
        text: a.text || (a.count ? a.count + ' 次' : '') || a.todo || '',
        source: a.source,
        category: a.category || 'other',
        date: a.date,
        height: a.height, weight: a.weight, head: a.head,
        dose: a.dose,
        count: a.count,
        time: a.time,
        note: a.note,
        ingredients: a.ingredients,
        sleepType: a.sleepType,
        sleepStart: a.sleepStart,
        sleepEnd: a.sleepEnd,
        duration: a.duration,
        nightWakes: a.nightWakes,
        dueDate: a.dueDate,
        dueTime: a.dueTime,
        nutrition: a.nutrition,
        brand: a.brand,
        water: a.water,
        intake: a.intake,
        label: a.label,
        estimate: a.estimate,
        product: a.product,
        frequency: a.frequency,
        start: a.start,
        stop: a.stop,
        reason: a.reason,
        item: a.item,
        amount: a.amount,
        milkType: a.milkType,
        foodType: a.foodType,
        quantity: a.quantity,
        unit: a.unit,
        ingredients: a.ingredients,
        sleepType: a.sleepType,
        sleepStart: a.sleepStart,
        sleepEnd: a.sleepEnd,
        duration: a.duration,
        nightWakes: a.nightWakes,
        dueDate: a.dueDate,
        dueTime: a.dueTime,
        expenseCategory: a.expenseCategory,
        product: a.product,
        payer: a.payer,
        result: a.result,
        advice: a.advice,
        dimension: a.dimension,
        context: a.context,
        confidence: a.confidence,
        observation: a.text,
        scale: a.scale,
        months: a.months,
        next: a.nextStep,
        report: a.report,
        findings: a.findings,
        week: a.week,
        meal: a.meal,
        official: a.official,
        officialDose: a.officialDose,
        actual: a.actual,
        actualDose: a.actualDose,
        preWeight: a.preWeight,
        institution: a.institution,
        tool: a.assessmentTool,
      }
      if (a.needsConfirm === true && a.confirm !== true) {
        const summary = a.text || [a.item, a.result, a.advice, a.findings].filter(Boolean).join(' / ') || kind
        const p = await addPending(cfg(), a.childId, { kind, payload, summary: String(summary).slice(0, 300) })
        return { text: p.ok ? '这条先没有直接写，已放进看板「待确认」；让用户点确认或取消。' : '放入待确认失败：' + p.error }
      }
      if (['checkup', 'pregnancyReport', 'hospitalAssessment'].includes(kind) && a.confirm !== true) {
        const fields = []
        if (a.date) fields.push('日期：' + a.date)
        if (a.item) fields.push('项目：' + a.item)
        if (a.result) fields.push('结果：' + a.result)
        if (a.advice) fields.push('医生建议：' + a.advice)
        if (a.height !== undefined || a.weight !== undefined || a.head !== undefined) fields.push('身高/体重/头围：' + [a.height, a.weight, a.head].filter((x) => x !== undefined).join(' / '))
        if (a.report) fields.push('报告：' + a.report)
        if (a.findings) fields.push('结论：' + a.findings)
        if (a.institution) fields.push('机构：' + a.institution)
        if (a.text) fields.push('原文摘要：' + a.text)
        return { text: '【待确认，还没写入】\n' + fields.join('\n') + '\n\n请先给用户看这份摘要；用户确认后再调用 child_record，传 confirm: true。姓名/证件/电话/地址/就诊号不要放进字段。' }
      }
      const r = await write(cfg(), a.childId, kind, payload)
      if (!r.ok) return { text: (r.blocked ? '没有写入：' : '写入失败：') + r.error + (r.hits ? '\n命中：' + r.hits.map((h) => h.type).join('、') : '') }
      return { text: r.receipt + '\n' + (r.committed === 'ok' ? '已提交 git' : r.committed === 'no-changes' ? '没有新改动' : r.committed === 'off' ? '自动提交已关' : '提交：' + r.committed) }
    },
  })), 'child-raise.record')


  ctx.effect(() => ctx.tools.register(defineTool({
    name: 'child_onboard',
    description: '第一次使用：从聊天里创建孩子档案（小孩/孕期/备孕）。用户自然说出小名、阶段、生日或预产期后调用；创建成功会写配置并建工作区。一次只建一个。',
    parameters: {
      name: { type: 'string', required: true, description: '小名' },
      stage: { type: 'string', enum: ['preconception', 'pregnancy', 'newborn', 'toddler', 'preschool', 'school'], description: '阶段；不传按幼儿' },
      birthDate: { type: 'string', description: '生日 YYYY-MM-DD；备孕/孕期可不填' },
      stageDetail: { type: 'string', description: '具体阶段：孕早期/孕中期/孕晚期，0–3月、1–2岁等' },
      dueDate: { type: 'string', description: '预产期 YYYY-MM-DD；孕期填' },
      sex: { type: 'string', description: '女/男，可不填' },
      userName: { type: 'string', description: '使用者昵称' },
      userRole: { type: 'string', description: '角色：妈妈/爸爸/外婆/外公/奶奶/爷爷/其他' },
      motherName: { type: 'string', description: '孕期妈妈昵称（如适用）' },
      workspace: { type: 'string', description: '档案目录，不传用默认工作区' },
      pregnancyId: { type: 'string', description: '关联的孕期档案 id（双胞胎/出生后填）' },
      country: { type: 'string', description: '国家/地区，如 中国、美国、日本' },
      city: { type: 'string', description: '城市，如 上海、东京' },
    },
    output: textOut(),
    execute: async (args) => {
      const a = args || {}
      const r = await createArchive(ctx, cfg(), a)
      if (!r.ok) return { text: r.error }
      return { text: '档案建好了：' + r.child.name + '（' + (r.child.kind === 'pregnancy' ? '孕期' : '孩子') + '）。子目录：' + r.workspace.root + '。接下来可以直接记第一笔。' }
    },
  })), 'child-raise.onboard')

  ctx.effect(() => ctx.tools.register(defineTool({
    name: 'child_pregnancy_edd',
    description: '孕期预产期更新：医院/医生给的预产期优先；也可用末次月经或早期超声估算。更新后所有孕周提醒按新日期重排。',
    parameters: {
      childId: { type: 'string', required: true, description: '孕期档案 id' },
      dueDate: { type: 'string', description: '预产期 YYYY-MM-DD；医院值或最终值' },
      source: { type: 'string', enum: ['hospital', 'manual', 'ultrasound', 'lmp'], description: '来源' },
      hospital: { type: 'string', description: '医院/产检机构' },
      lmp: { type: 'string', description: '末次月经 YYYY-MM-DD' },
      ultrasoundDate: { type: 'string', description: '早期超声日期 YYYY-MM-DD' },
      ultrasoundGaDays: { type: 'number', description: '超声时孕周总天数（如 7周2天=51）' },
      nextCheckup: { type: 'string', description: '下次产检 YYYY-MM-DD' },
    },
    output: textOut(),
    execute: async (args) => {
      const a = args || {}
      const conf = cfg()
      const child = (conf.children || []).find((c) => c.id === String(a.childId || ''))
      if (!child) return { text: '没有这个孕期档案。' }
      const source = String(a.source || 'hospital')
      const lmp = String(a.lmp || '').trim()
      const scan = String(a.ultrasoundDate || '').trim()
      const ga = Number(a.ultrasoundGaDays || 0)
      const dueDate = computeEdd({ source, dueDate: String(a.dueDate || '').trim(), lmp, ultrasoundDate: scan, ultrasoundGaDays: ga })
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return { text: '请给有效的预产期日期（YYYY-MM-DD）。' }
      const configEditor = ctx && typeof ctx.get === 'function' ? ctx.get('configEditor') : undefined
      const entry = configEditor && typeof configEditor.entries === 'function'
        ? configEditor.entries().find((e) => (e.options && e.options.name === 'dsh-tomatronic-child-raise') || String(e.id || '').includes('child-raise'))
        : undefined
      if (!configEditor || typeof configEditor.edit !== 'function' || !entry) return { text: '当前 profile 不能改预产期。' }
      try {
        await configEditor.edit(entry, (current) => ({
          ...current,
          children: (current.children || []).map((c) => c.id === child.id ? {
            ...c,
            dueDate,
            dueDateSource: source,
            dueDateHospital: String(a.hospital || ''),
            dueDateUpdatedAt: new Date().toISOString().slice(0, 10),
            lmp,
            ultrasoundDate: scan,
            ultrasoundGaDays: ga,
            nextCheckup: String(a.nextCheckup || ''),
          } : c),
        }))
        return { text: '预产期已更新为 ' + dueDate + '（来源：' + (source === 'hospital' ? '医院' : source === 'ultrasound' ? '早期超声' : source === 'lmp' ? '末次月经' : '手动') + '）。孕周和提醒会按新日期重排。' }
      } catch (e) { return { text: '更新失败：' + String(e && e.message ? e.message : e) } }
    },
  })), 'child-raise.pregnancy-edd')

  ctx.effect(() => ctx.tools.register(defineTool({
    name: 'child_birth',
    description: '宝宝出生：从孕期档案建一个或多个孩子档案。单胎填一个名字，双胞胎填两个，孕期数据只保留一份。',
    parameters: {
      pregnancyId: { type: 'string', required: true, description: '孕期档案 id' },
      birthDate: { type: 'string', required: true, description: '出生日期 YYYY-MM-DD' },
      names: { type: 'string', required: true, description: '宝宝小名，多个用逗号分隔' },
      sexes: { type: 'string', description: '性别，多个用逗号分隔；可不填' },
    },
    output: textOut(),
    execute: async (args) => {
      const a = args || {}
      const conf = cfg()
      const pregnancy = (conf.children || []).find((c) => c.id === String(a.pregnancyId || ''))
      if (!pregnancy || pregnancy.kind !== 'pregnancy') return { text: '没有这个孕期档案。' }
      const birthDate = String(a.birthDate || '').trim()
      if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return { text: '请给出生日期（YYYY-MM-DD）。' }
      const names = String(a.names || '').split(/[,，、]/).map((x) => x.trim()).filter(Boolean)
      const sexes = String(a.sexes || '').split(/[,，、]/).map((x) => x.trim())
      const made = makeBirthChildren(conf, pregnancy.id, birthDate, names.map((name, i) => ({ name, sex: sexes[i] || '' })))
      if (!made.ok) return { text: made.error + '。' }
      const created = made.created
      const nextChildren = made.nextChildren
      const configEditor = ctx && typeof ctx.get === 'function' ? ctx.get('configEditor') : undefined
      const entry = configEditor && typeof configEditor.entries === 'function'
        ? configEditor.entries().find((e) => (e.options && e.options.name === 'dsh-tomatronic-child-raise') || String(e.id || '').includes('child-raise'))
        : undefined
      if (!configEditor || typeof configEditor.edit !== 'function' || !entry) return { text: '当前 profile 不能写档案。' }
      try {
        await configEditor.edit(entry, (current) => ({ ...current, children: nextChildren }))
        for (const child of created) await ensureWorkspace({ ...conf, workspace: child.workspace }, child)
        return { text: '出生档案已建好：' + created.map((c) => c.name).join('、') + '。孕期档案已标记为已出生，数据没有复制。' }
      } catch (e) { return { text: '出生建档案失败：' + String(e && e.message ? e.message : e) } }
    },
  })), 'child-raise.birth')

  ctx.effect(() => ctx.tools.register(defineTool({
    name: 'child_checkup',
    description: '按月龄给：家长自评表、预警征象、下一个筛查点。筛查不是诊断。',
    parameters: { childId: { type: 'string', description: '哪个孩子' }, ageMonths: { type: 'number', description: '月龄，不传用档案算' } },
    output: textOut(),
    execute: async (args) => {
      const a = args || {}
      const loaded = load(cfg(), a.childId)
      const months = a.ageMonths !== undefined ? a.ageMonths : loaded.ok ? loaded.summary.months : undefined
      return { text: buildCheckup(months) }
    },
  })), 'child-raise.checkup')

  ctx.effect(() => ctx.tools.register(defineTool({
    name: 'child_assess',
    description: '返回当前月龄对应的国家自评表条目和预警征象；只做筛查，不诊断、不打分。',
    parameters: { childId: { type: 'string', description: '哪个孩子' }, ageMonths: { type: 'number', description: '月龄' } },
    output: textOut(),
    execute: async (args) => {
      const a = args || {}
      const loaded = load(cfg(), a.childId)
      const months = a.ageMonths !== undefined ? a.ageMonths : loaded.ok ? loaded.summary.months : undefined
      const r = buildAssess(months)
      return { text: '【' + r.checkpoint + ' 月龄自评】\n' + r.items.map((x, i) => (i + 1) + '. ' + x).join('\n') + (r.warning.length ? '\n【预警征象】\n' + r.warning.map((x) => '- ' + x).join('\n') : '') + '\n' + r.rule }
    },
  })), 'child-raise.assess')
}
