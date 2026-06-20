---
date: 2026-06-20
last_updated: 2026-06-20
topic: slidev-layout-quality-and-canvas-roadmap
canonical: true
status: progress-audit-and-next-plan
---

# Slidev 布局质量与画布规划路线

## 1. 为什么需要这份文档

当前 Slidev export 已经跨过“按钮是否真的能导出”的阶段，但还没有跨过“导出的演示是否稳定达到演示质量”的阶段。

这两件事不能混为一谈：

1. `standalone`、完整 skill references、本地 Slidev fork、UI 等价 verifier、full-deck Playwright audit 已经落地；
2. 真实 `architecture.zh-CN.md` 导出仍出现低 `zoom`、图表空间利用率差、表格贴边等质量问题；
3. `ref/infinite-canvas` 提供了有价值的几何建模参考，但它不能被误解成“把无限画布嵌进 Slidev 就能解决问题”。

本文件把当前进度、现有代码边界、先前方案要求、`ref/infinite-canvas` 可借鉴点与下一阶段实现路线落盘，避免后续会话再次退回“CLI 能 build 就算导出成功”或“缩进去就算可读”的弱判断。

## 2. 当前基线

当前代码基线：

1. 分支：`main`
2. 远端：`origin/main`
3. 当前头部：`71c77ed fix(slidev-export): refine sidebar workflow`
4. 真实源文件：`docs/architecture.zh-CN.md`
5. 当前真实导出检查产物：`docs/export/_slidev-sources/` 与 `docs/export/architecture.zh-CN-slides/`

当前已落地事实：

1. `prepareSlidevExportSource()` 会在非 Slidev 笔记导出前生成真正的 Slidev deck；
2. source preparation 会加载完整 Slidev skill 目录，包括 `references/*.md`；
3. Jacob 本机优先使用 `/home/jacob/slidev/packages/slidev/bin/slidev.mjs`；
4. `convergeSlidevDeckLayout()` 已进入产品导出路径与维护者 verifier；
5. HTML native standalone 有严格 gate；
6. Playwright 默认审计完整 prepared deck；
7. patcher 已支持 measured zoom、部分局部 `<Transform>`、Mermaid/table/code/simple slide/slot layout 结构化拆分；
8. 当前生成产物可被 Git 看到，用于本地视觉检查，但不应提交进 `main`。

当前未完成事实：

1. 现有 gate 仍偏“硬正确性”：不裁切、能打开、能 standalone；
2. 现有 gate 尚未充分衡量演示质量：有效字号、空间利用率、质量边距、图表语义拆分质量；
3. 现有 pre-generation 阶段缺少确定性的布局规划 IR，LLM 仍可能把过密图表塞进一页；
4. `ref/infinite-canvas` 的思想尚未转化成 NoteMD 自有的 clean-room geometry planner。

## 3. 先前要求与当前代码逐项对比

| 要求 | 当前代码/文档状态 | 结论 | 下一步 |
|---|---|---|---|
| UI 中两个 Slidev export 按钮必须跑真实工作流 | `exportSlidesCommand()` 是命令面板和侧栏入口共同拥有的完整操作；侧栏支持一次性导出和大纲模式 | 已落地 | 后续 UI 改动继续以 `sidebarDomButtonClicks` 与真实 verifier 锁住 |
| 非大纲模式也要嵌入 Slidev skill 流程 | source preparation 会加载完整 skill references，不再只读 `SKILL.md` | 已落地 | skill reference 数继续作为 verifier 报告字段 |
| 必须使用本地 Slidev fork | CLI 解析优先使用 `$HOME/slidev/packages/slidev/bin/slidev.mjs` | 已落地 | verifier 中继续检查 fork 路径 |
| standalone 文件必须真实可打开 | strict native gate 检查 `actualMode = standalone`、`requiresLocalServer = false`、`loaderGaps = []` | 已落地 | 新 standalone 验收应继续走带日期 evidence package |
| 不能提交测试生成文件 | `docs/export/` 产物可见但默认不提交 | 部分依赖操作者纪律 | 本批次收口必须归档/清理生成产物，保证 commit 不夹带测试输出 |
| zoom 参数应由检测结果决定 | 当前 overflow patch 已用 measured fit scale 派生 `zoom` 或局部 transform scale | 部分落地 | quality gate 还不能只用 overflow scale，需要 effective font 与 margin 约束 |
| 完整支持 Slidev skill references | skill root 与 reference count 已进入 verifier | 已落地 | 可考虑上游 skill PR，但只放通用 guardrails |
| 参考无限画布优化图/表/画布可见范围 | 文档已明确 clean-room 参考方向，但代码尚未有 layout planning IR | 未落地到核心实现 | 下一阶段新增 `SlideGeometry` / `SlideLayoutPlan`，不要复制 AGPL 代码 |

## 4. 现有架构推进进度

### 4.1 已稳定的所有者边界

当前已有四个关键边界是正确的：

1. `prepareSlidevExportSource()` 拥有 deck 准备、skill 加载、已有 deck working-copy 隔离和 support-entry mirror；
2. `convergeSlidevDeckLayout()` 拥有 HTML build、Playwright audit、patch/rebuild retry；
3. `slidevLayoutAudit.ts` 拥有 rendered measurement 到 patch decision 的转换；
4. `exportSlidevHtmlWithOutcome()` 拥有 native standalone 与 fallback 的结构化结果。

这条边界不应被推翻。下一阶段应该在这些边界前面补布局规划层，在这些边界内部增强质量指标，而不是把责任退回 prompt。

### 4.2 当前 hard gate 的价值

当前 hard gate 已经能防：

1. 输出目录 stale chunk 污染；
2. 缺失 local fork；
3. 缺失 Slidev skill references；
4. 生成 deck frontmatter/theme 明显错误；
5. standalone bundle loader binding 误判；
6. slide root 可见范围裁切；
7. table/code/slot zone 的 scroll overflow。

这些都是 P0 正确性门，不能为了速度退回抽样或 CLI-only smoke。

### 4.3 当前 hard gate 的漏洞

当前 hard gate 不能充分证明：

1. Mermaid SVG 内文字字号足够演示阅读；
2. table cell 字号、行高和底部边距足够；
3. code token 在投影或共享屏幕里可读；
4. 图表是否只占左半边而右侧大面积空白；
5. 图表是否应该被拆成 overview + details，而不是整页 `zoom: 0.285`；
6. slide 是否“未裁切但贴边”，导致视觉质量差。

这不是实现细节，而是验收定义缺失。

## 5. `architecture.zh-CN` 真实输出暴露的问题

当前生成 deck 中有明确低 zoom 证据：

1. 系统架构页：`zoom: 0.285`
2. LLM 调用管道页：`zoom: 0.384`
3. 图表渲染平台页：`zoom: 0.40`

这些值没有让 Playwright hard gate 失败，因为它们仍高于当前产品路径的 `minReadableScale: 0.24`。但从实际截图看：

1. slide 03 没有裁切，但图表集中在左半区，文字接近不可读；
2. slide 05 没有裁切，但 sequence diagram 文字密度和线条跨度已经过高；
3. slide 10 表格没有 overflow，但底部空间接近贴边，只是 hard gate 没有把它判为质量问题。

因此，当前 `overflowCount = 0` 与 `unreadableCount = 0` 只能说明“没有硬裁切”，不能说明“演示质量合格”。

## 6. `ref/infinite-canvas` 的可借鉴点

`ref/infinite-canvas` 的直接实现不能复制进 NoteMD：它是 AGPL-3.0，NoteMD 是 MIT。可借鉴的是 clean-room 设计思想：

1. 节点是带 `position`、`width`、`height`、`metadata` 的可测量对象；
2. viewport 是 `{ x, y, k }`，所有显示都可用 camera transform 解释；
3. minimap 会先计算所有节点 union bounds，再推导 scale 和 offset；
4. 连线坐标由节点几何推导，而不是写死；
5. 图片/节点尺寸会先经过比例约束，再进入画布。

转译到 Slidev export 后，应该变成：

1. `SlideBlockGeometry`：每个 heading、paragraph、Mermaid、table、code、image 都有 estimated/intrinsic size；
2. `SlideViewportFit`：对固定 Slidev safe rect 计算 fit scale、margin、content-area ratio；
3. `SlideLayoutPlan`：在生成 deck 前决定一页能放什么，何时预拆分；
4. `SemanticSplitPlan`：对 Mermaid/table/code 做确定性拆分预算；
5. rendered audit 仍作为最终事实门。

不建议做：

1. 把 infinite-canvas UI 嵌进 Slidev export；
2. 把 Slidev deck 变成一个巨大可缩放画布；
3. 复制 AGPL 代码；
4. 用 canvas screenshot 代替 Slidev 原生语义；
5. 用更低 zoom 掩盖语义拆分缺失。

## 7. Next-level 方案

### Stage 1：增强 rendered quality measurement

目标：把当前 hard gate 扩展成 hard gate + quality gate。

新增 measurement 字段：

```text
layoutAudit[].effectiveMinFontPx
layoutAudit[].svgTextMinFontPx
layoutAudit[].tableBodyMinFontPx
layoutAudit[].codeMinFontPx
layoutAudit[].qualityMargins
layoutAudit[].contentAreaRatio
layoutAudit[].lowContentUtilization
layoutAuditSummary.lowEffectiveFontCount
layoutAuditSummary.qualityMarginWarningCount
layoutAuditSummary.lowContentUtilizationCount
```

判定原则：

1. hard overflow 继续 fail closed；
2. low effective font 进入 fail 或 warning，按内容类型区分；
3. bottom/right margin 低于质量阈值进入 warning；
4. content area ratio 过低且有低 zoom 时，优先拆分/重布局，而不是继续缩小。

### Stage 2：新增 clean-room layout planning IR

目标：在 LLM 生成 deck 前做几何预算。

建议类型：

```ts
type SlideBlockKind = 'heading' | 'text' | 'mermaid' | 'table' | 'code' | 'image';

interface SlideBlockGeometry {
  id: string;
  kind: SlideBlockKind;
  intrinsicWidth: number;
  intrinsicHeight: number;
  minReadableFontPx: number;
  splitAxes: Array<'semantic' | 'rows' | 'columns' | 'time' | 'graph-cluster'>;
}

interface SlideViewportFit {
  scale: number;
  margins: { left: number; top: number; right: number; bottom: number };
  hardPass: boolean;
  qualityPass: boolean;
  reason: string;
}

interface SlideLayoutPlan {
  slides: PlannedSlide[];
  preSplitCount: number;
  warnings: string[];
}
```

命名注意：

1. 不要叫 `LayoutManager`、`CanvasHelper`、`GeometryUtils`；
2. 用 `SlideGeometry`、`SlideViewportFit`、`SlideLayoutPlan` 这类能说明职责的名字；
3. 不用 bool/enum 参数让同一函数一会儿做 hard gate、一会儿做 quality gate；拆成独立操作。

### Stage 3：Mermaid 语义拆分器

目标：把大图从“缩小到能塞进一页”改为“生成 overview + details”。

拆分策略：

1. `flowchart/graph`：按 subgraph、拓扑层、弱连通分量、边密度拆；
2. `sequenceDiagram`：按 participant 数、message window、alt/loop 区块拆；
3. `mindmap`：按一级分支拆；
4. 图太复杂时生成 overview slide，再生成每个 cluster 的 detail slide；
5. 每个 detail slide 保留上下文入口，不生成孤立片段。

### Stage 4：Table / code quality splitter

目标：避免“没溢出但不可读”的大表和代码块。

表格策略：

1. wide table：优先列拆分；
2. tall table：优先行拆分；
3. dense table：转 record-list 或 summary + appendix；
4. cell 文本过长：先改写为 key-value cards，而不是继续缩小 table。

代码策略：

1. 超长 code fence 按语义段落拆；
2. 宽代码优先解释/摘录关键片段；
3. 代码字号低于阈值时不要继续 shrink。

### Stage 5：验收 fixture 扩展

新增 fixtures：

1. 大型 flowchart；
2. 长 sequenceDiagram；
3. 宽表；
4. 长表；
5. dense mixed table/code；
6. component-heavy slot layout；
7. `architecture.zh-CN.md` 继续作为真实回归源。

通过标准：

1. standalone strict gate 继续通过；
2. hard overflow 为零；
3. low effective font 为零，或只存在明确记录的 warning；
4. quality margin warning 不超过约定阈值；
5. `preSplitCount` 与 `postPatchCount` 可解释；
6. 不出现低于质量阈值的 `zoom` 作为最终主要修复手段。

## 8. 与上游 Slidev skill PR 的关系

值得上游的内容：

1. 长文档转 deck 应使用完整 references；
2. 大 Mermaid/table/code 应优先拆分和 overview/detail，而不是只 zoom；
3. 导出后应用真实浏览器检查；
4. standalone 与 fallback 应区分记录；
5. 输出目录应在 rebuild 前清理。

不应上游的内容：

1. `/home/jacob/slidev` 本地 fork 路径；
2. NoteMD vault-relative 输出路径；
3. `architecture.zh-CN.md` fixture；
4. NoteMD 的 Playwright audit 内部字段；
5. NoteMD 的 generated artifact policy。

更合理的上游 PR 时机：Stage 1/2 在 NoteMD 中稳定后，只抽通用 prompt guardrails 和 browser-check 建议，不把 NoteMD 的实现细节带上去。

## 9. 后续推进顺序

建议下一批实现顺序：

1. 先做 Stage 1 measurement，修正 `minReadableScale` 口径，并增加 effective-font / quality-margin 报告；
2. 再做 Stage 2 layout planning IR，先只支持 Markdown block、Mermaid、table、code；
3. 再把 Stage 3 Mermaid splitter 接入 source preparation prompt 前置约束；
4. 再把 Stage 4 table/code 质量拆分补齐；
5. 最后扩 fixtures 和 verifier JSON，形成稳定回归门。

不要先做：

1. 大规模 UI 画布编辑器；
2. 截图式 canvas export；
3. 更低的默认 zoom；
4. 只靠 LLM 手写拆分规则；
5. 复制 `ref/infinite-canvas` 实现代码。

## 10. 收口要求

本路线任何代码切片至少应验证：

```bash
npm test -- --runInBand src/tests/slidevLayoutAudit.test.ts src/tests/slidevSourcePreparer.test.ts src/tests/slideExportComprehensive.test.ts src/tests/sidebarDomButtonClicks.test.ts
npm run build
npm run verify:slidev-export -- --format html --html-mode standalone --require-native-standalone --source architecture.zh-CN.md --json
git diff --check
```

本路线任何文档切片至少应验证：

```bash
git diff --check
git status --short --branch
```

生成的 `docs/export/` 产物处理规则：

1. 可以用于本地视觉审查；
2. 不提交进 `main`；
3. 如果需要保留证据，归档到 `/home/jacob/slidev-export-review/<date>/...`；
4. 最终提交前工作区必须回到 clean，不留下未跟踪生成目录。

## 11. Bottom Line

当前项目不缺“能导出”的证明，缺的是“可读且专业”的质量门。

最佳路线不是替换现有 render-feedback pipeline，而是在它前面加 deterministic layout planning，在它内部加 effective-font / quality-margin measurement，在它后面保留 strict standalone 和 full-deck browser audit。

`ref/infinite-canvas` 的价值是几何思想，不是代码依赖，也不是 UI 替换方案。
