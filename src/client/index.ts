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

import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import type { Context } from '@deepseek-ai/cordis'
import { NIULAI_COW_AVATAR, NIULAI_COW_COVER } from './cow-art.generated.ts'
import { NiulaiRunDock } from './RunDock.tsx'
import { NIULAI_TOKENS } from './tokens.ts'
import './niulai.module.css'

export { NIULAI_PALETTE, NIULAI_TOKENS } from './tokens.ts'
export { NIULAI_COW_AVATAR, NIULAI_COW_COVER } from './cow-art.generated.ts'

/** 主题 id，也是 `setTheme` 的参数。 */
export const THEME_ID = 'niulai'

/** body 标记：装饰 CSS 的唯一挂点，同时便于用户自写覆盖规则。 */
export const BODY_ATTRIBUTE = 'data-dsh-niulai'

/** 背景图变量名：CSS 里读它，值在这里注入，图片资源不进样式表。 */
const COVER_VARIABLE = '--niulai-cow-cover'

/** 小牛头变量名，给「正在干活」的状态标识用。 */
const AVATAR_VARIABLE = '--niulai-cow-avatar'

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
  // 注册与挂载放同一个 effect，保证顺序：mountStage 里会 setTheme，
  // 而 setTheme 一个未注册的 id 会直接抛错。
  /*
   * 「牛来」运行概览：一根自己的右侧边栏，常驻、可收起。
   *
   * 不挂进 harness 的右侧详情栏 —— 那个 `details` slot 是 `{ kind: 'single' }` 且已被
   * 官方 DetailsPanel 占住，第三方注册直接抛错；硬把 DOM 塞进它的容器又会跟「点工具行
   * 看详情」抢地盘。自己开一根 fixed 侧栏，两者互不干扰，可以同时用。
   *
   * 也不再占用 `conversation.view` 那个视图 tab：同一份内容出现在两处只会让人困惑。
   */
  ctx.effect(() => mountDock(), 'niulai: run overview dock')

  ctx.effect(() => {
    const unregister = ctx.theme.register({ id: THEME_ID, colorScheme: 'dark', tokens: NIULAI_TOKENS })
    const unmount = mountStage(ctx, config.autoApply !== false)
    return () => {
      unmount()
      unregister()
    }
  }, 'niulai: theme + backdrop')
}

/**
 * 打开 / 关闭装饰层，跟随当前激活的主题。
 *
 * 装饰**只在牛来主题激活时存在**：用户切回内置暗色而牛还铺着，配色已经不是原野色了，
 * 那就是纯粹的视觉污染。所以订阅 `theme/change`，按当前 active id 决定挂不挂。
 *
 * 这里只做两件事：往 body 打标记属性、把图片以 CSS 变量交给样式表。真正的绘制在
 * `niulai.module.css` 里，挂到 harness 的 `[data-phase='hero']`（新会话空屏）——
 * 设计稿规定牛只出现在那里。背景图必须画在内容容器自己身上才透得出来，插一个
 * body 底层元素会被容器的不透明底色盖死（第一版就是这么翻车的）。
 *
 * @param ctx - 插件上下文。
 * @returns disposer：摘属性、清变量、退订。
 */
function mountStage(ctx: Context, autoApply: boolean): () => void {
  const body = document.body

  let attached = false
  /**
   * 自动应用只做一次。
   *
   * 🔴 不能放在 apply() 里直接 setTheme：ui-theme 的 loopback 浏览器先用 `system`
   * 顶上，**再到后台去读 Host 的 `ui-theme.preference`**，读回来会把插件刚设的选择
   * 覆盖掉 —— 表现就是"装了皮肤但打开还是内置暗色"，而且毫无报错。所以改成跟着
   * `theme/change` 走：等偏好落定后的那一次通知里再切，切完置位，此后不再干预，
   * 用户随时可以在外观里切走，插件不会抢回来。
   */
  let autoApplied = false

  const sync = (): void => {
    const activeId = ctx.theme.getTheme().active.id
    // 一旦真的切成功过，就把主动权彻底交还用户：此后切走不再抢回来。
    if (activeId === THEME_ID) {
      autoApplied = true
    } else if (autoApply && !autoApplied) {
      // 🔴 必须「切到成功为止」而不是「只切一次」：ui-theme 先用 system 顶上、
      // 再到后台读 Host 的 ui-theme.preference，读回来会把插件刚设的值覆盖掉。
      // 只切一次的话，那一次十有八九落在覆盖之前，表现就是装了皮肤却还是内置暗色，
      // 而且毫无报错 —— 实测就是这么翻的车。
      try {
        ctx.theme.setTheme(THEME_ID)
      } catch (error) {
        ctx.logger.warn('[niulai] 自动应用失败，请到「设置 → 外观」手动选择', error)
      }
      return
    }
    const active = ctx.theme.getTheme().active.id === THEME_ID
    if (active === attached) {
      return
    }
    if (active) {
      body.style.setProperty(COVER_VARIABLE, `url("${NIULAI_COW_COVER}")`)
      body.style.setProperty(AVATAR_VARIABLE, `url("${NIULAI_COW_AVATAR}")`)
      body.setAttribute(BODY_ATTRIBUTE, '')
    } else {
      body.removeAttribute(BODY_ATTRIBUTE)
      body.style.removeProperty(COVER_VARIABLE)
      body.style.removeProperty(AVATAR_VARIABLE)
    }
    attached = active
  }

  sync()
  const off = ctx.on('theme/change', sync)

  return () => {
    off()
    body.removeAttribute(BODY_ATTRIBUTE)
    body.style.removeProperty(COVER_VARIABLE)
    body.style.removeProperty(AVATAR_VARIABLE)
  }
}
/**
 * 挂载右侧边栏。
 *
 * 自建宿主节点 + React root：面板不属于 harness 的任何 slot，生命周期完全由本插件
 * 负责，dispose 时卸载组件树并移走节点，界面回到原样。
 *
 * @returns disposer。
 */
function mountDock(): () => void {
  const host = document.createElement('div')
  host.setAttribute('data-niulai-dock', '')
  document.body.append(host)
  const root = createRoot(host)
  root.render(createElement(NiulaiRunDock))
  return () => {
    // 异步卸载：React 不允许在自己的渲染周期内同步 unmount。
    queueMicrotask(() => { root.unmount() })
    host.remove()
    document.body.removeAttribute('data-niulai-dock-open')
  }
}
