/**
 * 牛来原野皮肤 · host 半。
 *
 * 皮肤的全部行为都在浏览器里（注册主题、铺背景），host 这半只是 Loader 的挂载点：
 * `cordis.patch.yml` 把这个包插进树，Loader import 本文件，浏览器半再由
 * `package.json` 的 `dsh.client` 声明加载。留空插件比不留更明确 ——
 * 没有它，Loader 那一行就指向一个没有入口的包。
 *
 * @module dsh-niulai
 */

import type { Context } from '@deepseek-ai/cordis'

/** 插件名（loader 行的 name）。 */
export const name = 'niulai'

/** 主题 id，与浏览器半一致；宿主侧脚本可以引它来判断皮肤是否在用。 */
export const THEME_ID = 'niulai'

export function apply(ctx: Context): void {
  ctx.logger.info('[niulai] 牛来原野已挂载，在「设置 → 外观」里选「牛来原野」启用')
}
