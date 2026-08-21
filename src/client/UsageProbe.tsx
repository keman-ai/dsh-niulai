/**
 * 用量采集器：挂在 `conversation.composer.dock` 上、什么都不画的一个 slot 条目。
 *
 * 它存在的唯一理由是拿到 slot 注入的 `useProjection`，把 harness 已经算好的三个投影
 * 递给侧边栏（见 usage-store）。选 `composer.dock` 是因为它是 `{ kind: 'list' }`，
 * 第三方可以追加而不会顶掉官方的 StatsLine（那条也在这个 slot 上，order 0）；
 * 而且它的生存期正好和对话页一致 —— 新会话的 hero 页不渲染这个 dock，侧栏那时也不出现。
 *
 * 渲染 null 是刻意的：这个 slot 的位置在输入框下方，我们不想在那儿多出任何东西，
 * 设计稿把用量放在右侧栏。
 */

import { useEffect } from 'react'
import { clearUsage, publishUsage } from './usage-store.ts'

/**
 * harness 的投影读取口，由 slot 在渲染时注入。
 *
 * 这里按用到的三个 key 手写最小声明，不从 `@deepseek-ai/dsh-client-ui-slots` 引类型：
 * 那个包和它的依赖链装不下来（见 types/dsh.d.ts 的说明），而运行期本来就是 external。
 * 字段名与 harness 的 `token-meter` / `session-stats` 一致，对不上时以 harness 源码为准。
 */
export interface UseProjection {
  (key: 'contextPressure'): ContextPressure | undefined
  (key: 'tokenUsage'): TokenUsage | undefined
  (key: 'sessionStats'): SessionStats | undefined
}

/** packages/llm/token-meter/src/projection.ts */
interface ContextPressure {
  /** 最近一次请求的提示词大小，供应商上报。 */
  pressureTokens?: number
  /** 下一次请求的预估大小：上面那个加上此后界面增删的重新计价，压缩后会立刻反映。 */
  projectedTokens?: number
  contextWindow?: number
}

/** packages/llm/token-meter/src/usage-projection.ts —— 三个桶互不重叠。 */
interface TokenUsage {
  uncachedInputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
}

/** packages/client/ui-conversation/.../StatsLine.tsx 的 WindowStats 同名字段。 */
interface SessionStats {
  turns: number
  steps: number
  llmMs: number
  toolMs: number
}

export interface UsageProbeProps {
  useProjection: UseProjection
}

export function NiulaiUsageProbe({ useProjection }: UsageProbeProps) {
  const pressure = useProjection('contextPressure')
  const usage = useProjection('tokenUsage')
  const stats = useProjection('sessionStats')

  // 用 projectedTokens 而不是 pressureTokens：压缩不上报用量，只有前者会立刻回落，
  // 否则界面会在压缩后继续显示旧的高占用（harness 自己的 ContextMeter 同样取它）。
  const usedTokens = pressure?.projectedTokens ?? pressure?.pressureTokens
  const billedInput = usage === undefined
    ? undefined
    : usage.uncachedInputTokens + usage.cacheReadTokens + usage.cacheWriteTokens

  useEffect(() => {
    publishUsage({
      usedTokens,
      contextWindow: pressure?.contextWindow,
      inputTokens: billedInput,
      outputTokens: usage?.outputTokens,
      cacheHitPercent: usage === undefined || billedInput === undefined || billedInput === 0
        ? undefined
        : Math.round(usage.cacheReadTokens / billedInput * 100),
      llmMs: stats?.llmMs,
      toolMs: stats?.toolMs,
      turns: stats?.turns,
      steps: stats?.steps,
    })
  }, [usedTokens, pressure?.contextWindow, billedInput, usage, stats])

  // 换会话时这个条目会重新挂载，卸载时清掉，免得侧栏留着上一次会话的数字。
  useEffect(() => clearUsage, [])

  return null
}
