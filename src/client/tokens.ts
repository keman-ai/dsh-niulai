/**
 * 牛来原野的配色：设计稿的 25 个变量 → harness 的 `--dsw-alias-*` / `--dsw-specific-*` 语义层。
 *
 * 这一层是皮肤的地基，也是**唯一不依赖 harness DOM 结构**的部分：presenter 把这些值
 * 作为 inline 变量刷到 body 上，界面的底色、层次、描边、文字、状态色随之整体换掉。
 * harness 改版会动 class 名和布局，但不会动语义 token 的含义，所以这层能长期活着。
 *
 * 映射不是逐条抄色号，而是**按语义对位**：设计稿的 `--surface/-2/-3` 是三级容器，
 * harness 的 `bg-layer-1/2/3` 也是三级容器，对上即可。设计稿没给的（遮罩、骨架屏、
 * 滚动条、工具条按钮）从已有色阶推导，规则写在各段注释里。
 *
 * 底色刻意保留原野的暖绿倾向（`#171911` 不是中性灰），这是牛来区别于内置暗色主题的
 * 第一眼观感；harness 内置暗色是偏蓝的 `neutral-bluish` 系。
 */

/** 设计稿 `:root` 的原始色，改配色从这里改，下面全部由它派生。 */
export const NIULAI_PALETTE = {
  /** 主橙：牛的身体色，用作品牌色与主按钮。 */
  orange: '#ff7a14',
  /** 深橙：主橙的按下 / 悬停态。 */
  orangeDeep: '#e95e0a',
  /** 口鼻米黄：高亮描边与次级强调。 */
  muzzle: '#f0d28a',
  /** 草绿 / 苔绿 / 稻草：原野三色，用于分隔线与低饱和装饰。 */
  grass: '#737746',
  moss: '#4f5f32',
  straw: '#b49a54',
  /** 天色：设计稿里最亮的中性色。 */
  sky: '#e8e1da',

  bg: '#171911',
  bg2: '#1c1f16',
  surface: '#20231a',
  surface2: '#25291e',
  surface3: '#2b3022',
  line: '#373c2a',

  text: '#f3efe4',
  text2: '#b7b6a5',
  text3: '#858777',

  good: '#91b65b',
  warn: '#d9b45e',
  danger: '#db735b',
  blue: '#7f9fbf',
} as const

const p = NIULAI_PALETTE

/**
 * 交给 `ctx.theme.register()` 的 token 表。
 *
 * 只写**要改的**：没列出的 token 继承 harness 内置暗色基座。这是有意的——
 * 覆盖集不完整是允许的（README 明说没有完整性校验），列全反而会把将来新增的
 * 内置 token 挡在外面。
 */
export const NIULAI_TOKENS: Record<string, string> = {
  // ── 容器三级层次 ──
  // 设计稿的 bg → surface → surface-2/3 是逐级抬升，与 harness 的 base → layer-1/2/3 同构。
  '--dsw-alias-bg-base': p.bg,
  '--dsw-alias-bg-layer-1': p.surface,
  '--dsw-alias-bg-layer-2': p.surface2,
  '--dsw-alias-bg-layer-3': p.surface3,
  '--dsw-alias-bg-module-platform': p.surface2,
  '--dsw-alias-bg-overlay': p.surface3,
  '--dsw-alias-bg-multi-select': p.surface2,

  // 遮罩设计稿没给。内置用纯黑透明，这里换成带绿的深色，
  // 让弹窗压暗时底下的原野色不被洗成灰。
  '--dsw-alias-bg-mask-1': 'rgba(10, 12, 7, 0.56)',
  '--dsw-alias-bg-mask-2': 'rgba(10, 12, 7, 0.24)',
  '--dsw-alias-bg-mask-3': 'rgba(10, 12, 7, 0.52)',
  '--dsw-alias-bg-mask-photo': 'rgba(8, 10, 6, 0.9)',
  '--dsw-alias-bg-mask-drop': 'rgba(43, 48, 34, 0.72)',
  '--dsw-alias-bg-skeleton': 'rgba(243, 239, 228, 0.07)',

  // ── 描边 ──
  // 设计稿只有 --line(#373c2a) 与 --line-soft(白 6.5%) 两级，harness 要四级：
  // l1 最弱用 line-soft，l2 用实色 line，l3/l4 往草绿方向提亮，保持同一色相。
  '--dsw-alias-border-l1': 'rgba(243, 239, 228, 0.065)',
  '--dsw-alias-border-l2': p.line,
  '--dsw-alias-border-l2-darkmode-thin': 'rgba(243, 239, 228, 0.08)',
  '--dsw-alias-border-l3': p.grass,
  '--dsw-alias-border-l4': p.straw,
  '--dsw-alias-border-inverted': 'rgba(243, 239, 228, 0.06)',
  '--dsw-alias-border-inverted2': 'rgba(243, 239, 228, 0.1)',

  // ── 文字 ──
  '--dsw-alias-label-primary': p.text,
  '--dsw-alias-label-primary-bluish': p.text,
  '--dsw-alias-label-primary-dimmed': p.text2,
  '--dsw-alias-label-secondary': p.text2,
  '--dsw-alias-label-tertiary': p.text3,
  '--dsw-alias-label-caption': p.text3,
  '--dsw-alias-label-dimmed': p.grass,
  // 落在主色块上的文字（橙底黑字）。用 bg 而不是纯黑，保持暖调统一。
  '--dsw-alias-label-primary-foreground': p.bg,
  '--dsw-alias-label-primary-inverted': p.surface3,

  // ── 品牌与主按钮 ──
  // 🔴 内置暗色的 brand-primary 是近白色，主按钮因此是白底黑字。牛来把它换成主橙，
  // 于是「发送」这类主按钮变成橙色 —— 这是皮肤最显眼的一处，也是牛的身体色落点。
  '--dsw-alias-brand-primary': p.orange,
  '--dsw-alias-brand-text': p.orange,
  '--dsw-alias-brand-primary-invert': p.bg,
  '--dsw-alias-brand-primary-new-colorprimary-new-color': p.orange,
  '--dsw-alias-button-primary-fill': p.orange,
  '--dsw-alias-button-primary-hover': p.muzzle,
  '--dsw-alias-button-primary-dimmed': p.moss,
  '--dsw-alias-button-contrast-fill': p.text,
  '--dsw-alias-button-elevated-fill': p.surface3,
  '--dsw-alias-button-floating-fill': p.surface2,
  '--dsw-alias-button-floating-hover': p.surface3,
  '--dsw-alias-button-ghost-active-fill': p.surface3,
  '--dsw-alias-button-ghost-active-hover': p.grass,
  '--dsw-alias-button-ghost-active-border': p.grass,
  '--dsw-alias-button-info-fill': p.orangeDeep,
  '--dsw-alias-button-info-hover': p.orange,
  '--dsw-alias-button-tool-bar-fill': 'rgba(115, 119, 70, 0.5)',
  '--dsw-alias-button-tool-bar-hover': 'rgba(115, 119, 70, 0.66)',
  '--dsw-alias-button-tool-bar-fill-invisible': 'rgba(32, 35, 26, 0.4)',

  // ── 交互态 ──
  // hover 用暖白低透明度，落在任何一级容器上都能看出来又不抢眼。
  '--dsw-alias-interactive-bg-hover': 'rgba(243, 239, 228, 0.07)',
  '--dsw-alias-interactive-bg-active': 'rgba(243, 239, 228, 0.13)',
  '--dsw-alias-interactive-bg-hover-solid': p.surface3,
  '--dsw-alias-interactive-bg-hover-accent': 'rgba(255, 122, 20, 0.22)',
  '--dsw-alias-interactive-bg-hover-danger': 'rgba(219, 115, 91, 0.18)',

  // ── 状态色 ──
  // 设计稿的四个状态色直接对位；tertiary（浅底）按同色相压暗到容器层级。
  '--dsw-alias-state-success-primary': p.good,
  '--dsw-alias-state-success-secondary': p.good,
  '--dsw-alias-state-success-tertiary': '#2b3a1f',
  '--dsw-alias-state-warn-primary': p.warn,
  '--dsw-alias-state-warn-secondary': p.warn,
  '--dsw-alias-state-warn-label': p.straw,
  '--dsw-alias-state-warn-tertiary': '#3a3220',
  '--dsw-alias-state-error-primary': p.danger,
  '--dsw-alias-state-error-secondary': p.danger,
  // business 是 harness 的「信息 / 品牌蓝」语义，设计稿给了 --blue 正好对位。
  '--dsw-alias-state-business-primary': p.blue,
  '--dsw-alias-state-business-tertiary': '#26302f',

  // ── Markdown 与代码 ──
  // 代码块比正文容器更沉，压到 bg-2，读长代码时不刺眼。
  '--dsw-alias-markdown-code-block': p.bg2,
  '--dsw-alias-markdown-code-block-banner': p.surface2,
  '--dsw-alias-markdown-inline-code': p.surface2,
  '--dsw-alias-markdown-code-segment-selected': p.surface3,
  '--dsw-alias-markdown-code-segment-unselected': p.bg2,
  '--dsw-alias-markdown-citation': p.surface3,
  '--dsw-alias-markdown-placeholder': p.surface2,
  '--dsw-alias-markdown-tag': p.surface2,

  // ── 滚动条 ──
  // 用草绿系而不是中性灰：滚动条是长期可见的元素，灰色会把整片暖调拉回中性。
  '--dsw-alias-scrollbar-bg-l1': p.line,
  '--dsw-alias-scrollbar-bg-l2': p.grass,
  '--dsw-alias-scrollbar-hover-l1': p.grass,
  '--dsw-alias-scrollbar-hover-l2': p.straw,

  // ── 浮层 ──
  '--dsw-alias-toast-bg': p.surface3,
  '--dsw-alias-tooltip-bg': p.surface3,

  // ── specific 层：harness 给具体部件留的口子 ──
  // 侧栏比主区更沉一档（设计稿的 --bg-2），让对话区显得往前浮。
  '--dsw-specific-sidebar-fill': p.bg2,
  '--dsw-specific-sidebar-nav-item-hover': p.surface,
  '--dsw-specific-sidebar-nav-item-active': p.surface3,
  '--dsw-specific-sidebar-nav-item-active-accent': p.moss,
  '--dsw-specific-bubble': p.surface2,
  '--dsw-specific-bubble-highlight': p.surface3,
  '--dsw-specific-input-major': p.surface2,
  '--dsw-specific-login-input': p.bg2,
  '--dsw-specific-menu': p.surface3,
  '--dsw-specific-selector': p.surface3,
  '--dsw-specific-tip': p.surface3,
}
