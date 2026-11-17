/**
 * 阶段参照：每个阶段常见的家长问题 / 事件 / 可以怎么做。
 * 这是家长教育性参考，不是诊断；涉及健康处置都以儿保/医生为准。
 */
export const STAGE_GUIDE_SOURCE = {
  title: '常见育儿问题整理（家长教育性参考）',
  note: '不替代儿保/医生；出现预警征象或拿不准，直接问专业人员。',
}

const G = (key, label, items) => ({ key, label, items })

export const STAGE_GUIDES = {
  preconception: G('preconception', '备孕', [
    { title: '周期怎么记', body: '记开始日、结束日、经量就够；周期偶尔不准很常见，连续异常问妇科。' },
    { title: '孕前检查', body: '按医生建议做孕前检查；结果只归档，不自己解读。' },
    { title: '叶酸/疫苗', body: '叶酸和疫苗按医生/说明书；不自行加量或补打。' },
    { title: '情绪/睡眠', body: '备孕压力很常见；先把睡眠和情绪照顾好，必要时找专业支持。' },
  ]),
  pregnancy_early: G('pregnancy_early', '孕早期（0–13 周）', [
    { title: '孕吐/没胃口', body: '少量多餐、清淡、避免油烟；吐到吃不下/尿少/明显消瘦要就医。' },
    { title: '困倦/情绪波动', body: '允许自己慢一点；把产检、建档和要问医生的问题记下来，别靠记忆。' },
    { title: '用药/叶酸', body: '只按医生/说明书；不自行加量或换药，把正在吃的都告诉产检医生。' },
    { title: 'NT/早期筛查', body: '按产检医生安排的时间做；结果只记录，不自己解读。' },
  ]),
  pregnancy_mid: G('pregnancy_mid', '孕中期（14–27 周）', [
    { title: '胎动什么时候有', body: '初产妇常更晚；按医生教的方法观察，突然明显减少要联系产检。' },
    { title: '体重增长', body: '按孕前 BMI 看总增重参考；短时间涨太快/水肿明显，问产科。' },
    { title: '腰背/耻骨不适', body: '调整姿势、托腹带/孕妇枕可试；疼痛影响走路要问医生。' },
    { title: '大排畸/糖耐', body: '按预约时间；报告摘要归档，异常值由医生解释。' },
  ]),
  pregnancy_late: G('pregnancy_late', '孕晚期（28–40 周）', [
    { title: '睡不好/翻身难', body: '侧卧、枕头支撑；严重失眠或心慌气短要问产科。' },
    { title: '水肿/血压', body: '每天同一时间量血压；突然头痛、眼花、水肿加重，立即就医。' },
    { title: '待产包/入院路线', body: '和家里人过一遍证件、路线、联系方式；不用一次买齐。' },
    { title: '胎动/宫缩', body: '胎动明显减少、破水、规律宫缩/出血 → 立即联系医院。' },
  ]),
  newborn: G('newborn', '新生儿（0–1 月龄）', [
    { title: '黄疸', body: '按儿保测；黄到手脚心、精神差、吃奶差 → 就医。' },
    { title: '喂养', body: '按需喂，观察尿量/体重；妈妈的用药和补剂问医生。' },
    { title: '睡眠', body: '仰睡、硬床、同房不同床；不用枕头，不盖过口鼻。' },
    { title: '脐带/皮肤', body: '保持干燥清洁；红肿渗液、发热 → 就医。' },
  ]),
  infant_2_3: G('infant_2_3', '2–3 月龄', [
    { title: '肠绞痛/傍晚哭', body: '飞机抱、排气、安抚；持续尖叫/呕吐/血便 → 就医。' },
    { title: '趴卧练习', body: '醒着、有人看着时短时间趴；不愿趴不强迫。' },
    { title: '追视/回应', body: '面对面说话、慢速移动玩具；不比较谁先会。' },
    { title: '疫苗/儿保', body: '按程序；发热等反应按接种门诊说明处理。' },
  ]),
  infant_4_6: G('infant_4_6', '4–6 月龄', [
    { title: '要不要加辅食', body: '看发育信号（能靠坐、对食物感兴趣、挺舌反射减弱），具体开始时间问儿保。' },
    { title: '出牙/流口水', body: '牙胶、清洁牙龈；发热/腹泻明显要就医，不都归因于出牙。' },
    { title: '睡眠倒退', body: '固定睡前程序、白天充分活动；不突然加很多新训练。' },
    { title: '翻身/安全', body: '换尿布、床上都要防坠落；会翻身后不再离人。' },
  ]),
  infant_7_9: G('infant_7_9', '7–9 月龄', [
    { title: '爬/扶站', body: '清空地面危险物、包桌角；不急着用学步车。' },
    { title: '分离焦虑', body: '短分离+明确再见+按时回来；不偷偷走。' },
    { title: '辅食质地', body: '从泥糊过渡到软烂小块；呛咳风险食物要处理。' },
    { title: '认生/陌生人', body: '给熟悉时间，不强迫抱；家长先示范。' },
  ]),
  infant_10_12: G('infant_10_12', '10–12 月龄', [
    { title: '走路早晚', body: '有的孩子 10 个月走、有的 15 个月；多爬多扶站，不硬拉走。' },
    { title: '语言', body: '多描述正在做的事、读绘本；不靠屏幕教说话。' },
    { title: '自主进食', body: '允许手抓、弄脏；切成安全大小，全程看着。' },
    { title: '断奶/奶量', body: '按孩子和家庭节奏；具体奶量问儿保。' },
  ]),
  toddler_13_24: G('toddler_13_24', '1–2 岁', [
    { title: '发脾气/打滚', body: '先保证安全，接住情绪，少讲道理；事后复盘，不羞辱。' },
    { title: '挑食/扔食物', body: '固定餐椅和餐点、重复暴露；不追喂、不用屏幕换吃饭。' },
    { title: '如厕信号', body: '能表达尿布湿、能坐稳再开始；不比较、不惩罚。' },
    { title: '语言爆发', body: '多回应、扩展句子；2 岁还不会说词/听不懂指令，问儿保。' },
  ]),
  toddler_25_36: G('toddler_25_36', '2–3 岁', [
    { title: '规则/说不', body: '给有限选择、提前预告、保持一致；不打不吼。' },
    { title: '分享/轮流', body: '这个年龄还在学，示范+短轮换，不强迫“大方”。' },
    { title: '睡前拉锯', body: '固定顺序、关灯、减少刺激；夜醒先观察再介入。' },
    { title: '入园准备', body: '练分离、自己吃饭/穿鞋、表达需求；按园所要求准备。' },
  ]),
}

export function buildStageGuide(stageKey, months, week) {
  let key
  if (stageKey === 'preconception') {
    key = 'preconception'
  } else if (stageKey === 'pregnancy') {
    const w = Number(week)
    key = w < 14 ? 'pregnancy_early' : w < 28 ? 'pregnancy_mid' : 'pregnancy_late'
  } else {
    const m = Number(months)
    key = m <= 1 ? 'newborn' : m <= 3 ? 'infant_2_3' : m <= 6 ? 'infant_4_6' : m <= 9 ? 'infant_7_9' : m <= 12 ? 'infant_10_12' : m <= 24 ? 'toddler_13_24' : m <= 36 ? 'toddler_25_36' : undefined
  }
  const g = key ? STAGE_GUIDES[key] : undefined
  return g ? { ...g, source: STAGE_GUIDE_SOURCE, disclaimer: '家长教育性参考，不是诊断；具体问儿保/医生。' } : { key: 'free', label: '自由模式', items: [], source: STAGE_GUIDE_SOURCE, disclaimer: '3 岁后由你决定记什么。' }
}
