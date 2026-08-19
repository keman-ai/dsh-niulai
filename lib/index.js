//#region src/index.ts
/** 插件名（loader 行的 name）。 */
const name = "niulai";
/** 主题 id，与浏览器半一致；宿主侧脚本可以引它来判断皮肤是否在用。 */
const THEME_ID = "niulai";
function apply(ctx, config = {}) {
	const mode = config.autoApply === false ? "需在「设置 → 外观」里手动选" : "已自动应用";
	ctx.logger.info("[niulai] 牛来原野已挂载（%s）", mode);
}

//#endregion
export { THEME_ID, apply, name };