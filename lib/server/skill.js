/**
 * 技能注册：把「问问」的口径带进任何会话。
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))

export function registerSkill(ctx, cfg) {
  if (typeof ctx.skills?.register !== 'function') return
  let body
  try {
    body = readFileSync(join(HERE, 'skill', 'child-raise.md'), 'utf8')
  } catch {
    body = '# 问问\n\n读 child_profile，记 child_record，查 child_checkup/child_assess。'
  }
  if (cfg().devMode) {
    body += `

## 开发测试模式（当前开启）

- 当前档案开了开发测试模式：允许把时间线/记录写到过去或未来，用于验收；正常模式会拒绝未来日期（待办除外）。
- 写测试数据前说一句“这是测试数据”，尽量在测试工作区；不要写真实隐私。
- 用户让你造样例/补未来数据时可以照做；但不伪造医疗结论、疫苗事实或医生建议。
- 用户要求验证正常模式边界时，先关开发模式再试。
`
  }
  body += cfg().crossChatCapture
    ? `

## 跨会话归集开关（当前开启）

- 任何 DSH 会话里提到孩子的事，都可以归集到同一工作区；入口/会话标题不改变数据归属。
- 先 \`child_profile\` 确认孩子；多孩子或指代不明先问记给谁。
- 明确、低风险的事实（里程碑、吃睡、偏好、新词、疫苗/体检日期）→ 直接 \`child_record\`，回执一句“已归到问问：…”。
- 敏感/医疗/家庭冲突/情绪事件 → 先接住再问是否记；只记去隐私摘要。
- 同一件事不重复；用户说不用记就停；不要每句都记。
- 从问问面板进入的孩子会话照旧直接记。
`
    : `

## 跨会话归集开关（当前关闭）

- 默认关闭：**不要在普通会话主动调用 \`child_record\` 归集孩子的事**。
- 只有用户明确说“记进问问/记进孩子档案”，或者从「问问」面板进入的孩子会话，才记录。
- 用户明确要求时仍可正常用 \`child_profile\`/\`child_record\`；不要因为开关关闭而拒绝。
- 开关可在设置页「问问」里打开；打开前不要假设已开。
`
  const names = cfg().children.map((c) => c.name).filter(Boolean)
  const description = '育儿搭档「问问」：读/记孩子成长档案、人格与偏好观察、跨会话归集、按月龄对照发育、发育评估、体检与政策清单。'
    + (names.length ? '用户聊到 ' + names.join('、') + ' 或' : '用户聊到')
    + '育儿、发育、疫苗、睡眠、吃饭、如厕、发脾气时使用。'
  ctx.effect(() => ctx.skills.register({
    name: 'child-raise',
    description,
    source: 'bundled',
    content: body,
    resourceBase: { kind: 'directory', path: join(HERE, 'skill') },
  }), 'child-raise.skill')
}
