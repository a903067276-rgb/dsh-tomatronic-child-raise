/**
 * dsh-tomatronic-child-raise — Host 半
 *
 * 定位：agent 是大脑，插件是流程 + 数据格式 + 看板。
 * - 配置：孩子列表 / 工作区 / 地区 / 模式（profile patch，热生效）
 * - 工具：child_profile / child_record / child_checkup / child_assess
 * - 技能：child-raise（读/记/判断/边界）
 * - HTTP：/api/dsh-tomatronic-child-raise/*（看板/表单，和工具共用 store）
 * - 工作区：docs/ 标准 markdown + git；表单和聊天写同一套文件
 */
import { realpathSync } from 'node:fs'
import { Config, resolveConfig } from './core/config.js'
import { registerTools } from './server/tools.js'
import { registerSkill } from './server/skill.js'
import { apiHandler } from './server/api.js'

export const name = 'dsh-tomatronic-child-raise'
export const inject = ['tools', 'skills']
export { Config }

export function apply(ctx, rawConfig) {
  const cfg = () => resolveConfig(rawConfig)

  registerTools(ctx, cfg)
  registerSkill(ctx, cfg)

  // 给所有会话一小段“问问工具可用”的提示；完整规则仍由 skill 提供。
  // 不按会话注入单个孩子的隐私数据，只注入工具名和当前开关。
  ctx.inject(['systemPrompt'], (promptCtx) => {
    const sp = promptCtx.systemPrompt ?? (typeof promptCtx.get === 'function' ? promptCtx.get('systemPrompt') : undefined)
    if (!sp || typeof sp.context !== 'function') return
    ctx.effect(() => sp.context({
      name: 'child-raise.capture',
      order: 620,
      text: () => {
        const c = cfg()
        const mask = (v) => { const t = String(v || ''); return t.length <= 1 ? '＊' : t[0] + '＊' }
        const privateMode = c.privacyMode === true
        const names = (c.children || []).map((x) => privateMode ? mask(x.name) : x.name).filter(Boolean)
        const capture = c.crossChatCapture === true
        const paths = privateMode ? [] : [...new Set([c.workspace, ...(c.children || []).map((x) => x.workspace)].filter(Boolean))].map((p) => {
          try { return realpathSync(p) } catch { return p }
        })
        const userText = [c.userRole, privateMode ? mask(c.userName) : c.userName, c.motherName ? '孕妈/妈妈昵称 ' + (privateMode ? mask(c.motherName) : c.motherName) : ''].filter(Boolean).join(' · ')
        return [
          '【问问 · 育儿插件】', userText ? '使用者：' + userText + '。' : '',
          '可用工具：child_onboard（第一次建档案）、child_profile（读档案）、child_record（记一笔）、child_pregnancy_edd（孕期预产期）、child_birth（出生建孩子档案）、child_checkup、child_assess。',
          names.length ? '孩子：' + names.join('、') + '。' : '',
          paths.length ? '育儿工作区：' + paths.join('、') + '。如果当前工作目录是这些路径之一，或会话标题是「<孩子> · 育儿」，这就是问问的孩子会话。' : '', privateMode ? '隐私模式：不注入真实姓名/绝对路径；需要定位孩子时用 childId。' : '', 
          c.privacyMode ? '隐私模式已开：回复里不要复述真名，用“孩子/小名首字+＊”。' : '',
          capture ? '跨对话归集已开：普通会话里明确的孩子事实也可直接归集。' : '跨对话归集关闭：普通会话不要主动归集；但上面识别的孩子会话可以直接记录。',
          '用户自然提到孩子的里程碑、吃睡、偏好、疫苗/体检、具体身高体重头围、医院单子、育儿花费/商品名时，先判断是否属于育儿会话/是否用户明确要求；育儿会话里的明确事实直接记录，不确定/敏感/报告类用 child_record 的 needsConfirm 放进看板「待确认」，不贴诊断标签。商品名但没价格时先 web_search 查市场价并注明来源/日期，不编价格。医院单子只提取医学数据，跳过姓名/证件/电话/地址/就诊号。',
        ].filter(Boolean).join(' ')
      },
    }), 'child-raise.prompt')
  })

  // 看板/表单的 HTTP RPC；headless 宿主没有 webServer 时跳过，其余功能照常。
  ctx.inject(['webServer'], (serverCtx) => {
    const webServer = serverCtx.webServer ?? (typeof serverCtx.get === 'function' ? serverCtx.get('webServer') : undefined)
    if (webServer === undefined || typeof webServer.register !== 'function') return
    ctx.effect(() => webServer.register({
      kind: 'prefix',
      path: '/api/dsh-tomatronic-child-raise',
      handler: apiHandler(cfg, ctx),
    }), 'child-raise.webServer')
  })

  try {
    ctx.logger?.info?.('[child-raise] loaded; children=' + cfg().children.length)
  } catch { /* ignore */ }
}
