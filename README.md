# dsh-niulai · 牛来原野

给 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的暗色皮肤：一片黄昏原野，一头低模橙牛站在你的对话底下。

![牛来原野](preview/dark.webp)

底色是带草绿倾向的暖黑 `#171911`（不是中性灰，这是它和内置暗色最直观的差别——内置那套偏蓝），主按钮换成牛的身体橙 `#ff7a14`，分隔线与滚动条走草绿到稻草的过渡。**只做暗色。**

## 安装

**不发布到 npm**，从 GitHub 装：

```sh
dsh plugin --profile web add -w github:keman-ai/dsh-niulai
```

**`-w` 不能省**。profile 目录自带 `pnpm-workspace.yaml`，pnpm 会认为它是 workspace 根，不带这个标志直接报 `ERR_PNPM_ADDING_TO_ROOT`。

重启一次 dsh，**装上即生效**。

想改回「装上只注册、由自己去选」的行为，在 profile 的 `cordis.patch.yml` 里关掉自动应用：

```yaml
- id: niulai
  config:
    autoApply: false
```

之所以默认自动应用：harness 的第三方主题 id **不进内置 settings schema**（见 ui-theme 的 README），选择只在进程内活着、不写进 `$DSH_HOME/settings.yaml`。不自动应用的话，每次启动 dsh 都得回「设置 → 外观」重选一遍——装了皮肤却看不到皮肤。切走随时可以，本插件只在装载那一刻切一次，不会把选择抢回来。

仓库里带着构建产物（`lib/`），也没有 `prepare` 脚本，所以从 git 源安装时 pnpm 不需要执行任何构建脚本，你不必为它授权 `allowBuilds`。

### 卸载

```sh
dsh plugin --profile web remove -w dsh-niulai
```

主题注销时偏好会自动退回默认，界面不会卡在一套已经不存在的配色上。

## 它改了什么

| 层 | 内容 | 改版后会不会碎 |
|---|---|---|
| **配色** | 约 80 个 `--dsw-alias-*` / `--dsw-specific-*` 语义 token | 不会。token 是语义契约，harness 改版不改含义 |
| **背景** | 半透明牛图铺在最底层，上下双重渐变压暗 | 不会。只挂在自有的 `body[data-dsh-niulai]` 上 |

**刻意没做**的是钩住具体部件（把牛头像塞进 assistant 消息旁、改标题栏品牌那类）。那需要 `[class*='sidebarCol']` 这种模糊匹配 harness 内部 CSS module 哈希类名，观感更足，但宿主一改版就碎。牛来把赌注下在语义层，换取升级不出事。

背景**只在牛来主题激活时出现**：切回内置暗色时元素移除、body 属性摘掉。配色已经不是原野色了还铺着牛，那是纯粹的视觉污染。

## 配色速查

设计稿的 25 个变量是全部色源，代码里在 `src/client/tokens.ts` 的 `NIULAI_PALETTE`，改配色改那里。

| | |
|---|---|
| 主橙 / 深橙 | `#ff7a14` / `#e95e0a` |
| 口鼻米黄 | `#f0d28a` |
| 草绿 / 苔绿 / 稻草 | `#737746` / `#4f5f32` / `#b49a54` |
| 底 / 侧栏 / 三级容器 | `#171911` / `#1c1f16` / `#20231a` `#25291e` `#2b3022` |
| 正文 / 次级 / 三级 | `#f3efe4` / `#b7b6a5` / `#858777` |
| 成功 / 警告 / 危险 / 信息 | `#91b65b` / `#d9b45e` / `#db735b` / `#7f9fbf` |

映射不是逐条抄色号，是按语义对位：设计稿的 `--surface/-2/-3` 是三级容器，harness 的 `bg-layer-1/2/3` 也是三级容器。设计稿没给的（遮罩、骨架屏、工具条按钮）从已有色阶推导，规则写在 `tokens.ts` 各段注释里。

## 开发

```sh
pnpm install
pnpm check     # 类型检查
pnpm build     # → lib/index.js（host 半）+ lib/client.js（浏览器半）
```

| 文件 | 职责 |
|---|---|
| `src/index.ts` | host 半，Loader 的挂载点 |
| `src/client/index.ts` | 注册主题、挂背景层，两者都走 `ctx.effect` 可完整回收 |
| `src/client/tokens.ts` | 25 个设计变量 → 80 个语义 token 的映射 |
| `src/client/niulai.module.css` | 背景层样式 |
| `src/client/cow-art.generated.ts` | 牛图内联（由原图经 `cwebp` 生成，无手写内容） |

**`lib/` 是故意提交进仓库的**：这个包不发 npm，所有人都从 git 源安装，带上产物就不必赌对方机器的构建工具链。改完代码要把 `pnpm build` 的产物一并提交。

牛图两份都从设计稿那张 1011×702 原图生成：

```sh
cwebp -crop 300 55 470 470 -resize 256 256 -q 84 原图.png -o cow-avatar.webp   # 6KB
cwebp -q 76 原图.png -o cow-cover.webp                                          # 32KB
```

`types/dsh.d.ts` 自带用到的那部分 harness API 声明，照 `0.1.0-rc.7` 抄写——npm 上的 `@deepseek-ai/dsh-client-*` 依赖链不完整装不下来。宿主行为与声明对不上时，先回那个文件核对。

## 相关

- [dsh.a2hmarket.ai](https://dsh.a2hmarket.ai) —— DSH 皮肤集市
- [dsh-skin-market](https://github.com/keman-ai/dsh-skin-market) —— 在 dsh 设置里逛集市、一键装皮肤

## 许可

[MIT](LICENSE) © 2026 Science Roam Limited
