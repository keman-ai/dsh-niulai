/**
 * 牛来原野皮肤 · 浏览器半。
 *
 * 做两件事，稳定性差一个数量级，所以分开写：
 *
 * 1. **注册主题** —— 把配色交给 `ctx.theme`，presenter 负责刷成 body 上的 inline 变量。
 *    这层只依赖语义 token，harness 改版不会动 token 的含义，能长期活着。
 * 2. **挂背景层** —— 往 body 打一个自有属性、插一个背景 div。只用自己的属性和自己的
 *    元素，不钩 harness 的类名或结构，所以同样不怕改版。
 *
 * 两件事都走 `ctx.effect`，dispose 时属性摘掉、元素移除、主题注销，界面回到原样。
 */

import type { Context } from '@deepseek-ai/cordis'
import { NIULAI_COW_COVER } from './cow-art.generated.ts'
import { NIULAI_TOKENS } from './tokens.ts'
import styles from './niulai.module.css'

export { NIULAI_PALETTE, NIULAI_TOKENS } from './tokens.ts'
export { NIULAI_COW_AVATAR, NIULAI_COW_COVER } from './cow-art.generated.ts'

/** 主题 id，也是 `setTheme` 的参数。 */
export const THEME_ID = 'niulai'

/** body 标记：装饰 CSS 的唯一挂点，同时便于用户自写覆盖规则。 */
export const BODY_ATTRIBUTE = 'data-dsh-niulai'

/** 背景图变量名：CSS 里读它，值在这里注入，图片资源不进样式表。 */
const COVER_VARIABLE = '--niulai-cow-cover'

/** 主题服务；`inject` 保证它先就绪。 */
export const inject = ['theme']

/** 浏览器半的配置，与 host 半同名字段。 */
export interface Config {
  /**
   * 装上就切到牛来，默认开。
   *
   * 为什么需要这个开关：harness 的第三方主题 id **不进内置 settings schema**
   * （见 ui-theme README），选择只在进程内活着，不写进 `$DSH_HOME/settings.yaml`。
   * 也就是说不自动应用的话，用户每次启动 dsh 都得回「设置 → 外观」重选一遍 ——
   * 装了皮肤却看不到皮肤，是这套机制下的默认结果。
   *
   * 关掉它就回到「装上只是可选，手动去选」的行为。
   */
  autoApply?: boolean
}

export function apply(ctx: Context, config: Config = {}): void {
  ctx.effect(
    () => ctx.theme.register({ id: THEME_ID, colorScheme: 'dark', tokens: NIULAI_TOKENS }),
    'niulai: theme registration',
  )

  if (config.autoApply !== false && ctx.theme.getTheme().active.id !== THEME_ID) {
    // 只在装载这一刻切一次，之后不再干预：用户随时可以在外观里切走，
    // 本插件不会把选择抢回来（没有监听去纠正它）。
    ctx.theme.setTheme(THEME_ID)
  }

  ctx.effect(() => mountStage(ctx), 'niulai: field backdrop')
}

/**
 * 装上原野背景，并在主题切换时跟着开关。
 *
 * 背景**只在牛来主题激活时出现**：用户切回内置暗色而背景还铺着牛，会是纯粹的
 * 视觉污染 —— 那时的配色已经不是原野色了。所以这里订阅 `theme/change`，
 * 按当前激活的主题 id 决定挂不挂。
 *
 * @param ctx - 插件上下文。
 * @returns disposer：移除元素、摘掉属性、退订。
 */
function mountStage(ctx: Context): () => void {
  const body = document.body
  const stage = document.createElement('div')
  stage.className = styles.stage ?? 'niulai-stage'
  stage.style.setProperty(COVER_VARIABLE, `url("${NIULAI_COW_COVER}")`)
  // 纯装饰，读屏软件不该念它。
  stage.setAttribute('aria-hidden', 'true')

  let attached = false
  const sync = (): void => {
    const active = ctx.theme.getTheme().active.id === THEME_ID
    if (active === attached) {
      return
    }
    if (active) {
      body.setAttribute(BODY_ATTRIBUTE, '')
      body.prepend(stage)
    } else {
      stage.remove()
      body.removeAttribute(BODY_ATTRIBUTE)
    }
    attached = active
  }

  sync()
  const off = ctx.on('theme/change', sync)

  return () => {
    off()
    stage.remove()
    body.removeAttribute(BODY_ATTRIBUTE)
  }
}
