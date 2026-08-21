/**
 * 「牛来」运行概览面板 —— 设计稿右侧 Details 那四张卡片的可落地版本。
 *
 * 为什么是<b>新增一个视图 tab</b>而不是改造右侧详情栏：harness 的 `details` slot 是
 * `{ kind: 'single' }`，官方 DetailsPanel 已经占住，第三方再注册直接抛错；而且那个
 * 面板的语义是「某次工具调用的 Input/Output」，与设计稿的「运行概览」根本不是一回事。
 * `conversation.view` 则是 `{ kind: 'list' }` —— 文档原话「one list entry per view
 * tab」，「对话」「轨迹」本身就是这么注册的，第三方合法追加第三个，既拿到了面板，
 * 又不挤掉任何原生功能。
 *
 * 🔴 <b>数据从 DOM 读，不是从会话快照读</b>。harness 的 usage / goal 不是快照上的
 * 现成字段，要像 ui-trajectory 那样注册一整套事件投影 definition 才能拿到。那是另一个
 * 量级的工程，所以先用页面上已经渲染出来的事实：工具调用行、思考行、预设、工作区、
 * 模型名都在 DOM 里，数它们即可。代价是与 harness 的 DOM 结构耦合 —— 结构一改这里
 * 就读不到，读不到时显示占位符而不是崩掉。
 */

import { useEffect, useState, useSyncExternalStore } from 'react'
import { getUsage, subscribeUsage, type UsageSnapshot } from './usage-store.ts'
import css from './RunPanel.module.css'

/** 一次读数的结果。字段读不到时为 undefined，渲染层显示占位符。 */
interface RunStats {
  preset: string | undefined
  workspace: string | undefined
  model: string | undefined
  toolCalls: number
  thinking: number
  running: boolean
}

/**
 * 依次尝试多个选择器，返回第一个有文本的。
 *
 * 🔴 必须多来源：同一项信息在不同阶段挂在不同地方 —— 预设在新会话页是输入框上方的
 * `_seat`，进了对话页却搬到会话标题旁的 `headerActions`；工作区在新会话页有独立选择器，
 * 对话页只在侧边栏露出。侧栏现在只在对话页显示（新会话是全屏），所以只读 hero 那套
 * 选择器的话，这两项永远是空的 —— 上一版就是这么翻的车。
 */
function textOf(...selectors: string[]): string | undefined {
  for (const selector of selectors) {
    const el = document.querySelector(selector)
    const text = el?.textContent?.replace(/\s+/g, ' ').trim()
    if (text !== undefined && text.length > 0 && text.length < 40) {
      return text
    }
  }
  return undefined
}

/**
 * 从当前页面读一次运行状态。
 *
 * 选择器全部取自实测（playwright 抓的真实 DOM）：工具行与思考行都带 `data-variant`，
 * 思考行的 variant 恒为 `think`，其余 variant 即一次工具调用。
 */
function readStats(): RunStats {
  const rows = [...document.querySelectorAll('[data-variant]')]
  const tools = rows.filter(el => el.getAttribute('data-variant') !== 'think')
  const thinks = rows.filter(el => el.getAttribute('data-variant') === 'think')
  return {
    // 对话页在会话标题旁，新会话页在输入框上方。
    preset: textOf("[class*='headerActions'] [class*='_label']", "[class*='headerActions']", "[class*='_seat']"),
    // 对话页只有侧边栏那个当前文件夹，新会话页才有独立的工作区选择器。
    workspace: textOf(
      "[class*='folderActive'] [class*='_label']",
      "[class*='folderActive']",
      "[class*='_workspaceLabel']",
      "[class*='workspace']",
    ),
    // 模型名在输入框右下角，没有语义属性可依，取按钮文本里含 Free/V4 之类的那颗。
    model: [...document.querySelectorAll('button')]
      .map(b => b.textContent?.trim() ?? '')
      .find(t => /free|v4|nemotron|claude|gpt|deepseek/i.test(t)),
    toolCalls: tools.length,
    thinking: thinks.length,
    running: rows.some(el => el.getAttribute('data-state') === 'running'),
  }
}

/**
 * token 数压成 31.8K / 1.2M。
 * 与 harness 的 `formatTokens` 同口径（三位数以内保一位小数），免得侧栏和官方
 * 那颗上下文圆环显示出不同的数字。
 */
function formatTokens(n: number): string {
  const scaled = (v: number): string =>
    v >= 100 ? String(Math.round(v)) : String(Math.round(v * 10) / 10)
  if (n < 1_000) return String(n)
  if (n < 1_000_000) return `${scaled(n / 1_000)}K`
  return `${scaled(n / 1_000_000)}M`
}

/** 毫秒压成设计稿的 mm:ss；超过一小时补出小时段，免得 90 分钟显示成 30:00。 */
function formatElapsed(ms: number): string {
  const total = Math.round(ms / 1_000)
  const pad = (n: number): string => String(n).padStart(2, '0')
  const minutes = Math.floor(total / 60)
  if (minutes < 60) return `${pad(minutes)}:${pad(total % 60)}`
  return `${Math.floor(minutes / 60)}:${pad(minutes % 60)}:${pad(total % 60)}`
}

function Row({ label, value }: { label: string, value: string }) {
  return (
    <div className={css.row}>
      <span className={css.rowLabel}>{label}</span>
      <span className={css.rowValue}>{value}</span>
    </div>
  )
}

function Card({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <section className={css.card}>
      <div className={css.cardTitle}>{title}</div>
      {children}
    </section>
  )
}

/** 上下文占用：`31.8K / 128K`。供应商还没报用量前两个值都缺席，显示占位符。 */
function contextText(usage: UsageSnapshot): string {
  if (usage.usedTokens === undefined || usage.contextWindow === undefined) {
    return '—'
  }
  return `${formatTokens(usage.usedTokens)} / ${formatTokens(usage.contextWindow)}`
}

/**
 * 耗时：模型请求 + 工具执行的墙钟之和。
 *
 * 不用「从会话开始到现在」的墙钟：那把用户思考、去泡咖啡的时间也算进去了，
 * 对「这次运行花了多少」没有意义。harness 的 sessionStats 分别记了这两段。
 */
function elapsedText(usage: UsageSnapshot): string {
  if (usage.llmMs === undefined && usage.toolMs === undefined) {
    return '—'
  }
  return formatElapsed((usage.llmMs ?? 0) + (usage.toolMs ?? 0))
}

/** 面板本体。挂在自建的右侧栏里。 */
export function NiulaiRunPanel() {
  const [stats, setStats] = useState<RunStats>(() => readStats())
  // 用量来自 harness 的官方投影，由挂在 composer.dock 的采集器递进来（见 usage-store）。
  const usage = useSyncExternalStore(subscribeUsage, getUsage, getUsage)

  useEffect(() => {
    // 轮询而不是 MutationObserver：这里只读聚合计数，一秒一次足够跟上，
    // 而观察整个对话区的变更在流式输出时会高频触发，代价大得多。
    const timer = window.setInterval(() => { setStats(readStats()) }, 1000)
    return () => { window.clearInterval(timer) }
  }, [])

  const dash = '—'
  return (
    <div className={css.root}>
      <Card title="Current run">
        <div className={css.row}>
          <span className={css.rowLabel}>Status</span>
          <span className={css.status} data-running={stats.running || undefined}>
            {stats.running ? '牛来正在干活' : '牛来在待命'}
          </span>
        </div>
        <Row label="Preset" value={stats.preset ?? dash} />
        <Row label="Model" value={stats.model ?? dash} />
        <Row label="Workspace" value={stats.workspace ?? dash} />
      </Card>

      <Card title="Usage">
        <Row label="Context" value={contextText(usage)} />
        {/* 工具次数用投影里的 steps 更准，但投影缺席时退回数 DOM 的结果 */}
        <Row label="Tool calls" value={String(stats.toolCalls)} />
        <Row label="Elapsed" value={elapsedText(usage)} />
        {usage.outputTokens !== undefined && (
          <Row
            label="Tokens"
            value={`${formatTokens(usage.inputTokens ?? 0)} ↑ / ${formatTokens(usage.outputTokens)} ↓`}
          />
        )}
        {usage.cacheHitPercent !== undefined && (
          <Row label="Cache hit" value={`${usage.cacheHitPercent}%`} />
        )}
      </Card>

      <Card title="This session">
        <Row label="Turns" value={usage.turns === undefined ? dash : String(usage.turns)} />
        <Row label="Thinking" value={String(stats.thinking)} />
      </Card>
    </div>
  )
}
