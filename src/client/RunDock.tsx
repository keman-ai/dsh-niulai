/**
 * 牛来运行概览的<b>右侧边栏</b>形态：常驻、可收起。
 *
 * 为什么自己造一根侧栏而不是挂进 harness 的右侧详情栏：那个位置的 slot 是
 * `{ kind: 'single' }` 且已被官方 DetailsPanel 占住，第三方注册直接抛错。硬把 DOM
 * 塞进它的容器则会跟「点工具行看详情」抢地盘。所以这里开一根自己的：`position: fixed`
 * 贴右边，展开时通过 body 上的标记让主区让出等宽的空间，收起时只留一个把手。
 * 全程不碰官方那根侧栏，两者可以同时存在。
 *
 * 收起状态记在 localStorage，刷新后保持 —— 侧栏是长期可见的东西，每次刷新都弹回来
 * 会很烦人。
 */

import { useCallback, useEffect, useState } from 'react'
import { NiulaiRunPanel } from './RunPanel.tsx'
import css from './RunDock.module.css'

/** 展开状态的存储键。 */
const STORAGE_KEY = 'niulai.dock.open'

/** 展开时打在 body 上，供样式表把主区让出来。 */
const OPEN_ATTRIBUTE = 'data-niulai-dock-open'

function readOpen(): boolean {
  try {
    // 默认展开：面板存在的意义就是被看见；用户收起过才记住收起。
    return window.localStorage.getItem(STORAGE_KEY) !== 'false'
  } catch {
    // 隐私模式下 localStorage 会抛，此时按默认展开处理，不影响功能。
    return true
  }
}

export function NiulaiRunDock() {
  const [open, setOpen] = useState<boolean>(readOpen)

  useEffect(() => {
    const body = document.body
    if (open) {
      body.setAttribute(OPEN_ATTRIBUTE, '')
    } else {
      body.removeAttribute(OPEN_ATTRIBUTE)
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, String(open))
    } catch {
      // 存不下就只影响"刷新后是否记住"，当前这次开合照常。
    }
    return () => { body.removeAttribute(OPEN_ATTRIBUTE) }
  }, [open])

  const toggle = useCallback(() => { setOpen(value => !value) }, [])

  return (
    <aside className={css.dock} data-open={open || undefined} aria-label="牛来运行概览">
      <button
        type="button"
        className={css.handle}
        onClick={toggle}
        aria-expanded={open}
        title={open ? '收起牛来面板' : '展开牛来面板'}
      >
        {open ? '›' : '‹'}
      </button>
      {open && (
        <div className={css.body}>
          <div className={css.header}>牛来 · 运行概览</div>
          <NiulaiRunPanel />
        </div>
      )}
    </aside>
  )
}
