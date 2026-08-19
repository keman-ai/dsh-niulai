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

/** 配置在 cordis.yml 里给，Loader 会连同这一行一起传给浏览器半。 */
export interface Config {
  /**
   * 装上就切到牛来，默认开。关掉则只注册、不应用，等用户自己去「设置 → 外观」选。
   *
   * 默认开是因为 harness 的第三方主题 id 不进内置 settings schema，选择不持久化：
   * 不自动应用的话，每次启动 dsh 都得重选一遍。
   */
  autoApply?: boolean
}

export function apply(ctx: Context, config: Config = {}): void {
  const mode = config.autoApply === false ? '需在「设置 → 外观」里手动选' : '已自动应用'
  ctx.logger.info('[niulai] 牛来原野已挂载（%s）', mode)
}
