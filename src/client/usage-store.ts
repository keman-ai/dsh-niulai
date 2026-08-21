/**
 * 用量数据的中转站。
 *
 * 为什么需要中转：真正的用量（上下文占用、token 计数、耗时）来自 harness 的
 * **投影**，而 `useProjection` 是 slot 渲染时注入进 props 的 hook —— 只有挂在
 * slot 上的组件才拿得到它。侧边栏是本插件自建的 fixed 节点、走自己的 React root，
 * 不在任何 slot 里，因此读不到。
 *
 * 于是拆成两半：一个零渲染的采集器挂进 `conversation.composer.dock`（list slot，
 * 第三方可追加），把 hook 读到的值写进这里；侧边栏订阅这里。数据仍旧全部来自
 * harness 的官方投影，没有解析 DOM，也没有改 harness 一行代码。
 *
 * 🔴 之前我判断过「用量拿不到、要自己写一整套事件投影」，那是错的：token-meter 与
 * session-stats 是 harness 自带的单元，投影已经算好了，缺的只是把值递出 slot。
 */

/** 一次读数。字段全部可能缺席 —— 供应商没报用量前投影就是空的。 */
export interface UsageSnapshot {
  /** 当前上下文占用的 token 数（下一次请求的预估提示词大小）。 */
  usedTokens?: number | undefined
  /** 该路由的上下文窗口容量。 */
  contextWindow?: number | undefined
  /** 计费口径的输入 token（未命中缓存 + 缓存读 + 缓存写）。 */
  inputTokens?: number | undefined
  /** 输出 token。 */
  outputTokens?: number | undefined
  /** 缓存命中率，0–100 的整数；没有计费输入时缺席。 */
  cacheHitPercent?: number | undefined
  /** 模型请求墙钟总和（毫秒）。 */
  llmMs?: number | undefined
  /** 工具执行墙钟总和（毫秒）。 */
  toolMs?: number | undefined
  /** 轮数与步数。 */
  turns?: number | undefined
  steps?: number | undefined
}

let current: UsageSnapshot = {}
const listeners = new Set<() => void>()

/** 采集器每次读到新值时调用。值没变就不通知，避免侧栏跟着流式输出空转。 */
export function publishUsage(next: UsageSnapshot): void {
  if (sameUsage(current, next)) {
    return
  }
  current = next
  for (const listener of listeners) {
    listener()
  }
}

/** 供 `useSyncExternalStore` 用：返回稳定引用，值没变时引用也不变。 */
export function getUsage(): UsageSnapshot {
  return current
}

export function subscribeUsage(listener: () => void): () => void {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

/** 采集器卸载（切走会话、皮肤停用）时清空，免得侧栏挂着上一次会话的数字。 */
export function clearUsage(): void {
  publishUsage({})
}

function sameUsage(a: UsageSnapshot, b: UsageSnapshot): boolean {
  const keys: (keyof UsageSnapshot)[] = [
    'usedTokens', 'contextWindow', 'inputTokens', 'outputTokens',
    'cacheHitPercent', 'llmMs', 'toolMs', 'turns', 'steps',
  ]
  return keys.every(key => a[key] === b[key])
}
