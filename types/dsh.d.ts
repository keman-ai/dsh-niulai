/**
 * 用到的那部分 DeepSeek Harness API 声明，照 `0.1.0-rc.7` 的源码抄写，每处标了出处。
 *
 * 为什么自带而不是依赖 npm 包：npm 上的 `@deepseek-ai/dsh-client-*` 依赖链不完整，
 * 装不下来。这些模块运行时全是 external —— 主题服务由跑着本插件的 harness 提供，
 * 插件只通过 `ctx.theme` 拿它，不 import 它的实现。
 *
 * 宿主行为与这里的声明对不上时，先回 harness 源码核对，别改代码去迁就声明。
 */

declare module '@deepseek-ai/cordis' {
  /** cordis Logger 门面是 `Record<'error'|'info'|'warn'|'debug', LoggerMethod>`，这里按用到的列。 */
  export interface Logger {
    info(message: unknown, ...args: readonly unknown[]): void
    warn(message: unknown, ...args: readonly unknown[]): void
    error(message: unknown, ...args: readonly unknown[]): void
    debug(message: unknown, ...args: readonly unknown[]): void
  }

  /** 释放一次注册。 */
  export type Disposer = () => void

  // ── packages/client/ui-theme/src/client/index.ts ──

  /** 主题 token 字典：以变量名为键的 `--dsw-alias-*` 覆盖。 */
  export type ThemeTokens = Record<string, string>

  /** 一个可选主题：id、明暗基座、以及 alias 层覆盖。 */
  export interface ThemeDefinition {
    /** 主题 id（`setTheme` 的参数）。`system` 是偏好不是 id，注册会抛。 */
    id: string
    /**
     * 建立在哪套基座调色板上。presenter 据此切 `body[data-ds-dark-theme]`，
     * **不看 id**。
     */
    colorScheme: 'light' | 'dark'
    /** alias 层覆盖，作为 inline CSS 变量盖在基座之上。 */
    tokens: ThemeTokens
  }

  /** 每次变更发布的不可变主题状态。 */
  export interface ThemeSnapshot {
    /** 持久化的偏好，可能是 `system`。 */
    preference: string
    /** 解析后的当前主题（`system` 经 prefers-color-scheme 解析），覆盖层已折叠进 tokens。 */
    active: ThemeDefinition
    /** 已注册主题，按注册顺序。 */
    themes: readonly ThemeDefinition[]
    /** 单调递增的变更计数。 */
    revision: number
  }

  /** 主题服务，客户端插件通过 `ctx.theme` 取用（`ctx.provide('theme', …)`）。 */
  export interface ThemeService {
    /**
     * 注册一个主题。id 重复会抛。
     * @returns disposer；注销当前生效的主题会把偏好重置回默认，
     *   界面不会停留在一个已注销主题的 token 上。
     */
    register(definition: ThemeDefinition): Disposer
    /** 当前主题状态。 */
    getTheme(): ThemeSnapshot
    /** 切到某个已注册主题；未知 id 会抛。 */
    setTheme(id: string): void
  }

  /** 视图 tab 注册项（`conversation.view` 是 list slot，第三方可追加）。 */
  export interface ViewSlotRegistration {
    name: 'conversation.view'
    /** 视图 id，也是激活时 `only:` 匹配的值。 */
    id: string
    /** 排序，数字越大越靠后；官方的 trajectory 用 10。 */
    order?: number
    /** tab 上显示的名字，thunk 形式以便跟随语言切换。 */
    label: () => string
  }

  /** slot 服务，只列本插件用到的。 */
  export interface SlotsService {
    /** 在目标 slot 就绪时执行注册；返回 disposer。 */
    inject(name: string, register: () => Disposer): Disposer
    /**
     * 注册一个 slot 条目。
     * 🔴 `single` 型 slot 重复注册会抛错，只有 `list` 型允许多个占用者
     * （`conversation.view` 正是 list）。
     */
    register(registration: ViewSlotRegistration, component: unknown): Disposer
  }

  /** 插件 apply 收到的上下文（本插件用到的成员）。 */
  export interface Context {
    logger: Logger
    /** `inject: ['slots']` 之后可用。 */
    slots: SlotsService
    /** `inject: ['theme']` 声明之后才可用。 */
    theme: ThemeService
    /** 注册即副作用：返回的 disposer 绑定在当前 fiber 上。 */
    effect(callback: () => Disposer | void, label?: string): Disposer
    /**
     * 订阅事件。主题变更事件是 `theme/change`，在注册表或激活主题变化时触发。
     * @returns 退订函数。
     */
    on(event: 'theme/change', listener: (snapshot?: ThemeSnapshot) => void): Disposer
  }
}
