# Slidev 导出工作流验证

语言: [English](./slidev-export-workflow.md) | **简体中文**

此文档面向维护者。它定义 NoteMD 的 Slidev export UI 路径应如何验证。

## 为什么需要这条工作流

直接运行 `slidev build` 只能证明本地 Slidev CLI 能构建某个 deck，不能证明 NoteMD 的导出按钮真的工作。

NoteMD 的验证必须把以下步骤串起来看：

1. 当前 Markdown 笔记会在导出前转换成真正的 Slidev deck。
2. 能发现完整 Slidev skill 目录，包括 `references/*.md`，而不是只读 `SKILL.md`。
3. 本地 Slidev fork 存在时会被优先使用。
4. 现有 Slidev deck 也会先复制到 prepared working file，再进入验证链，避免 patch/retry 直接改写源笔记。
5. 每次 HTML build 前会重建输出目录，避免旧 chunk 残留。
6. 生成 deck 的 guardrails 会规范 theme、逐页 frontmatter，并且只在页面本身没有声明 `zoom` 时才为大 Mermaid 图补缺省 zoom。
7. HTML 导出会先尝试 native standalone；如果生成的 standalone bundle 缺少 slide loader binding，则自动回退到 server-script 兼容 HTML。
8. 最终 HTML 输出会经过真实浏览器打开，并默认审计整个 deck。
9. 生成的检查产物对 Git 可见，不会被 `.gitignore` 意外隐藏。

## 维护者命令

用 docs vault 和 architecture 真实文件跑完整链路：

```bash
npm run verify:slidev-export
```

默认源文件是：

```text
docs/architecture.zh-CN.md
```

命令会写出与 UI 相同类型的产物：

```text
docs/export/_slidev-sources/architecture.zh-CN.slidev.md
docs/export/architecture.zh-CN-slides/index-standalone.html
或在 standalone 回退时写出 docs/export/architecture.zh-CN-slides/index.html
docs/export/architecture.zh-CN-slides/slide-*-workflow.png
```

如果只需要机器可读的轻量结果：

```bash
npm run verify:slidev-export -- --no-screenshots --json
```

测试其他 vault-relative 源文件：

```bash
npm run verify:slidev-export -- --source path/to/source.md
```

如果本机已有真实 Obsidian 桌面会话，也应补一层真实命令路径 smoke：

```bash
obsidian open path=architecture.zh-CN.md vault=/home/jacob/obsidian-NotEMD/docs
obsidian command id=notemd:export-slides vault=/home/jacob/obsidian-NotEMD/docs
```

在 2026-06-18 的 Jacob docs vault 上，这条命令已经执行成功。它是宿主命令级 smoke，不是 DOM 点击自动化。

## 通过标准

只有最终 JSON 同时满足以下条件时，才把这次导出视为通过：

1. `ok: true`
2. `environment.capabilities.html: true`
3. 安装本地 fork 时，`environment.slidev.version` 应显示本地 fork 路径
4. `slideSource.skillRootPath` 指向已解析的 Slidev skill 目录
5. `slideSource.skillReferenceCount` 大于零
6. `deck.theme` 等于配置主题，通常是 `default`
7. `deck.containsKnownStaleText: false`
8. `deck.containsMissingTheme: false`
9. 所有 `playwright[].failed` 都是 `false`
10. `ignoredOutputs: []`
11. `layoutAuditSummary.overflowCount: 0`
12. `layoutAuditSummary.unreadableCount: 0`

任一条件失败，都应先修 NoteMD 工作流，再相信导出文件。

## 渲染后可见范围质量门

当前工作流已经能证明 UI 等价导出路径可以生成 deck，并且默认会把整个准备后的 deck 放进真实浏览器审计。这是必要条件，因为密集架构笔记即使 build 成功，Mermaid 图、表格、代码块或长文本仍可能被固定 16:9 画布裁掉。

当前实现已经把 render-feedback gate 落到了共享工作流上；只要 Playwright 可用，维护者 verifier 与真实产品导出命令都会走这条链路：

1. 测量前等待 `document.fonts.ready`、图片 decode 和 Mermaid 渲染完成；
2. 对每个被审计页检查 DOM bbox 是否超出实际可见 slide root、是否存在 scroll overflow、Mermaid 容器是否溢出、表格自然宽度是否溢出、代码块是否溢出；
3. 将问题归类为 `overflow`、`unreadable-scale`、`stale-output` 或 `render-error`；
4. 基于渲染证据对 prepared working deck 做有界 patch/retry，当前最多 6 轮；
5. 如果多轮重试后内容仍被真实可见 slide root 裁掉，应 fail closed 并输出审计报告。

`ref/infinite-canvas` 只能作为 clean-room 设计参考。真正值得借鉴的不是把无限画布嵌进 Slidev export，而是先把 slide 元素建模成可测量的 world rect，计算 union bounds，再为固定 Slidev safe rect 推导 fit camera；一旦 fit 会破坏可读性，就拆分内容。不要把 AGPL-3.0 实现代码复制进 MIT 项目。

计划中的报告结构应补充类似字段：

```text
layoutAudit[].slide
layoutAudit[].findings[]
layoutAudit[].safeRect
layoutAudit[].contentBounds
layoutAudit[].recommendedPatch
layoutAuditSummary.overflowCount
layoutAuditSummary.unreadableCount
layoutAuditSummary.retryCount
```

截至 2026-06-18 的当前真值：

1. 默认 HTML 验证在未传 `--sample-slides` 时会审计整个准备后的 deck；
2. patcher 的 `zoom` 来自真实 overflow 测量，而不是固定导出常数；
3. patcher 已会在不宜继续缩小时，升级为结构化拆分，当前支持的内容类型包括 Mermaid `flowchart` / `graph` / `mindmap` / `sequenceDiagram`、Markdown table、病态宽表的 record-list fallback、非 Mermaid fenced code block、简单的标题 + 段落/列表页、generic slot-marked layout（含显式 `::default::`），以及可结构拆分的第一张 deck headmatter 页面；
4. 大 Mermaid guardrail 不会再覆盖页面里已经显式声明的 `zoom`；
5. 现有 Slidev deck 也会走 prepared working copy 验证链，而不是直接改动源文件；
6. 共享的 `convergeSlidevDeckLayout()` 现在已经进入 `exportSlidesCommand()` 与维护者 verifier，因此 HTML/PDF/PNG/MP4 都会复用同一个收敛后的 prepared deck；
7. HTML exporter 现在会拒绝已知坏掉的 native standalone bundle，并回退到 `index.html + start-server.* + README.md`；
8. 真实 `docs/architecture.zh-CN.md` workflow 现在已经收敛到 `ok: true`、`28` 个审计页、`overflow` 与 `unreadable-scale` 都为零，`retryCount = 4`；
9. 同一真实源文件的 `PDF` 与 `PNG` 验证也返回 `ok: true`，而且现在导出自同一个收敛后的 deck，而不是 raw prepared source。

当前限制：

1. 超出当前支持集的 richer custom/component-heavy Slidev layout 仍保持保守/manual-review 路径；
2. standalone 导出的正确性目前仍依赖 native bundle 的 sanity detection + server-script fallback，而不是自身已经具备完全可靠的 standalone bundling 策略；
3. full-deck Playwright 验证故意比代表性抽样更慢，后续优化方向应是提高 patch 收敛能力，而不是退回弱审计；
4. `obsidian command id=notemd:export-slides` 目前仍只能算 dispatch-level smoke，因为 Obsidian CLI 没有暴露导出完成握手信号。

## 输出策略

`docs/export/` 下的生成文件是维护者检查产物。它们对本地视觉审查有价值，但除非发布或文档任务明确要求，不应提交这些临时生成结果。

提交 Slidev 导出相关改动前检查：

```bash
git status --short docs/export
git check-ignore -v docs/export/_slidev-sources/architecture.zh-CN.slidev.md docs/export/architecture.zh-CN-slides/index-standalone.html
```

维护者本地期望状态：

1. 生成文件可以显示为 untracked；
2. `git check-ignore` 对当前验证产物不应输出任何内容；
3. 最终 commit 应包含源码、工作流或文档改动，不应夹带临时生成测试输出。

## UI 契约

命令面板导出动作与侧栏导出动作都必须进入 `exportSlidesCommand()`。

该方法应保持以下顺序：

1. 探测环境；
2. 准备 Slidev export source；
3. 按所选格式导出已准备的 source；
4. 报告具体输出路径。

设置页必须暴露默认导出格式（`HTML`、`PDF`、`PNG`、`MP4`），当选择 HTML 时还应暴露 HTML mode。任何隐藏格式选择的 UI 改动都应视为导出工作流回归。

## 什么时候运行

以下改动都应运行 `npm run verify:slidev-export`：

1. `src/main.ts` 的导出命令接线；
2. `src/ui/NotemdSidebarView.ts` 或 Slidev export 控件；
3. `src/ui/NotemdSettingTab.ts` 的 Slidev 设置；
4. `src/slideExport/*`；
5. 本地 Slidev fork 解析；
6. Slidev skill 加载或 prompt 准备；
7. 输出目录清理、打包或浏览器打开行为。

代码改动还应同时运行：

```bash
npm test -- --runInBand src/tests/slidevLayoutAudit.test.ts src/tests/slidevSourcePreparer.test.ts src/tests/slideExportComprehensive.test.ts src/tests/sidebarDomButtonClicks.test.ts
npm run build
git diff --check
```

## Slidev skill PR 评估

只有那些对 NoteMD 之外也成立的通用指导，才值得提到共享 Slidev skill。

适合上游 skill PR 的内容：

1. 将长篇技术文档转换成 Slidev deck 时，应使用完整 skill references，而不是只依赖顶层 `SKILL.md`；
2. 除非项目明确声明已安装自定义主题，否则优先使用内置或调用方配置的主题；
3. 逐页 frontmatter 必须在正文前闭合；
4. 大 Mermaid 图、表格和密集代码块应使用 `zoom` 或 `Transform`；
5. 验证导出结果时应 build 并在浏览器里检查渲染页，而不只是检查 Markdown 已生成；
6. 当旧资产可能影响浏览器输出时，重建前应清理或重建输出目录。

这些应留在 NoteMD 本地，不应上游：

1. `/home/jacob/slidev/packages/slidev/bin/slidev.mjs` fork 探测；
2. NoteMD 的 vault-relative 输出路径；
3. `architecture.zh-CN.md` 这个具体 smoke fixture；
4. `快速定位` 这类 NoteMD 专属旧内容检查。

建议：等当前 NoteMD 工作流稳定后，可以给上游 Slidev skill 准备一个小 PR，范围只放通用 deck-conversion/export guardrails，不包含 NoteMD 的路径和 vault 行为。
