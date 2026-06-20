# Slidev 导出方案总结

本文记录 NoteMD 当前 Slidev 导出的真实架构与验收标准。

## 当前导出模型

NoteMD 不再把直接运行 `slidev build` 视为 UI 导出按钮已经可用的充分证据。维护中的导出流程是：

1. 如果当前笔记不是 Slidev deck，先准备为可导出的 Slidev source deck。
2. 如果当前文件已经是 Slidev deck，先复制到隔离的 prepared workspace，再进行审计和导出，避免修改源文件。
3. 加载完整 Slidev skill 目录，包括 `SKILL.md` 与 `references/*.md`。
4. Deck 生成后应用展示 guardrails，避免大 Mermaid、表格、代码块或密集文本直接挤进单页。
5. 本地 Slidev fork 存在时优先使用本地 fork。
6. 每次构建前重建输出目录，避免旧 chunk 或旧 deck 污染结果。
7. HTML 默认尝试原生 standalone；当 sanity check 发现 loader binding 缺失时，才进入 server-script 兼容 fallback。
8. Playwright 默认审计完整 deck，而不是只抽样几页。
9. 产品导出路径和维护者 verifier 共享 `convergeSlidevDeckLayout()` 渲染收敛循环。

维护者工作流见：

```text
docs/maintainer/slidev-export-workflow.md
docs/maintainer/slidev-export-workflow.zh-CN.md
```

严格 standalone 验收记录见：

```text
docs/maintainer/slidev-standalone-acceptance-2026-06-18.md
docs/maintainer/slidev-standalone-acceptance-2026-06-18.zh-CN.md
```

## HTML 模式

### Standalone HTML

Standalone 是默认的本地检查与分享路径。预期输出：

```text
docs/export/<source-basename>-slides/index-standalone.html
```

该文件应能直接从文件系统打开。若验收声明是“原生 standalone 已通过”，必须使用严格门禁：

```bash
node scripts/verify-slidev-export-workflow.cjs --json --format html --html-mode standalone --require-native-standalone --source architecture.zh-CN.md
```

严格通过条件包括：

1. `htmlExport.actualMode = "standalone"`
2. `htmlExport.requiresLocalServer = false`
3. `htmlExport.standaloneAttempt.accepted = true`
4. `htmlExport.standaloneAttempt.loaderGaps = []`
5. `standaloneGate.required = true`
6. `standaloneGate.passed = true`

### Server-Script HTML

Server-script 是兼容路径，用于普通 Slidev SPA 或 native standalone sanity check 失败后的 fallback。预期输出：

```text
docs/export/<source-basename>-slides/index.html
docs/export/<source-basename>-slides/start-server.sh
docs/export/<source-basename>-slides/start-server.bat
docs/export/<source-basename>-slides/README.md
```

该模式需要通过本地 HTTP 服务查看。

## 当前侧边栏交互

导出 UI 现在遵循渐进披露：

1. 默认只暴露“一次性导出”主动作。
2. “导出前先输出大纲”开关默认关闭。
3. 打开开关后，主动作切换为两个有顺序的按钮：“先输出大纲”和“基于大纲继续导出”。
4. 大纲文件写入 `export/_slidev-outlines/<source>.outline.md`。
5. 基于大纲继续导出时，流程会读取保存的大纲，并把完整 Slidev skill references 和源笔记一起交给 deck 生成阶段。
6. 导出格式选择保留在 UI 中，直接写回 `slideExportDefaultFormat`。

这不是只换按钮。两步模式对应真实的 outline artifact 与后续 deck generation 路径；默认一次性导出仍走原先的 source preparation、layout convergence 和最终格式导出。

## 环境检测体验

“检测演示导出环境”应是非阻塞操作：

- 结果显示在侧边栏导出区内联面板中。
- 任务状态显示在底部进度区。
- 详细过程写入日志输出。
- 涉及 LLM 的步骤继续进入 API 活动区。
- 缺失工具必须给出命令和官网链接。

当前检查项：

```text
Node.js
Slidev CLI
Playwright Chromium
ffmpeg
```

典型安装提示：

```bash
node --version
corepack enable
pnpm add -D @slidev/cli
npx playwright install chromium
sudo apt install ffmpeg
```

## 本地 Fork 解析

Slidev 命令解析优先级：

1. `NOTEMD_SLIDEV_BIN`
2. `SLIDEV_CLI_PATH`
3. `$HOME/slidev/packages/slidev/bin/slidev.mjs`
4. `npx -y @slidev/cli`

在 Jacob 的工作站上，维护者验证报告应显示本地 fork 路径。

## 真实验证命令

默认真实源文件：

```text
docs/architecture.zh-CN.md
```

推荐命令：

```bash
npm run verify:slidev-export
```

关键通过条件：

1. `ok: true`
2. `slideSource.skillReferenceCount > 0`
3. `ignoredOutputs: []`
4. 无旧 deck 文本污染
5. 无缺失主题标记
6. Playwright 样本无失败
7. `layoutAuditSummary.overflowCount = 0`
8. `layoutAuditSummary.unreadableCount = 0`

## 当前渲染收敛模型

渲染反馈循环由三部分组成：

1. `prepareSlidevExportSource()` 加载完整 skill，并在 prompt 中要求拆分密集内容。
2. `convergeSlidevDeckLayout()` 构建 HTML、打开浏览器、测量真实 `slidev-page` 与易溢出元素。
3. patcher 根据渲染证据应用 slide `zoom`、局部 `<Transform>`、结构化拆分或内容级重写。

支持的结构化 patch 范围包括：

- Mermaid `flowchart` / `graph` / `mindmap`
- Mermaid `sequenceDiagram`
- 简单标题、段落、列表 slide
- Markdown 表格拆行、拆列与 record-list fallback
- 非 Mermaid 代码块分块
- slot-marked layout 与部分 component-heavy slot zone

当前仍存在的边界：

1. 更复杂的自定义 Vue layout 仍可能需要保守 zoom 或人工复查。
2. Standalone 正确性依赖 post-build sanity detection；fallback 通过不能当作 native standalone 通过。
3. 全 deck Playwright 审计更正确但更慢，后续应优化收敛效率，而不是削弱审计范围。
4. Obsidian CLI 可以派发 `notemd:export-slides`，但缺少导出完成握手，所以宿主命令烟测弱于 verifier。

## Next-level 布局质量路线

当前验收已经能证明“不裁切、能 standalone、真实 UI 等价路径可运行”，但还不能充分证明“演示质量合格”。真实 `architecture.zh-CN.md` 导出中仍有 `zoom: 0.285`、`0.384`、`0.40` 这类低缩放页；它们通过了 hard overflow gate，但视觉上仍可能过小、过空或贴边。

下一阶段不应替换现有 render-feedback pipeline。正确方向是：

1. 保留 `convergeSlidevDeckLayout()` 作为最终事实门；
2. 在 source preparation 前增加 clean-room `SlideGeometry` / `SlideLayoutPlan`，借鉴 `ref/infinite-canvas` 的 world rect、union bounds 与 viewport fit 思想，但不复制 AGPL-3.0 实现代码；
3. 在 rendered audit 中新增 effective font、quality margin、content area ratio 与 low-utilization 指标；
4. 对 Mermaid/table/code 做预拆分和语义拆分，避免继续把大内容压到低 `zoom`；
5. 将 hard gate 与 quality gate 分开报告：hard overflow 失败仍 fail closed，quality warning 用于推动拆分、重布局或人工复查。

具体路线和进度对比见：

```text
docs/brainstorms/2026-06-20-slidev-layout-quality-and-canvas-roadmap.zh-CN.md
```

## 输出策略

`docs/export/` 下的验证产物用于本地检查。提交前应确认没有把一次性导出内容误加入 main：

```bash
git status --short docs/export
git check-ignore -v docs/export/_slidev-sources/architecture.zh-CN.slidev.md docs/export/architecture.zh-CN-slides/index-standalone.html
```

本地验证产物不应被 `.gitignore` 隐藏到无法检查，但也不应在没有明确要求时作为测试文件提交。
