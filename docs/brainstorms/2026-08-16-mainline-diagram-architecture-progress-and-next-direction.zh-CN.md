---
date: 2026-08-16
last_updated: 2026-08-17
topic: mainline-diagram-architecture-progress-and-next-direction
status: active
canonical_for:
  - current-diagram-progress
  - diagram-architecture-audit
supersedes: ./2026-05-28-mainline-progress-audit-and-next-level-direction.zh-CN.md
superseded_by: null
implementation_record: src/tests/mermaidNormalizationConvergence.test.ts
---

# 主线图形架构：当前进度审计与后续方向

这是图形平台当前以证据为准的进度记录，也是当前状态的发现入口；更早审计保留为历史材料。

## 总体判断

平台已经跨过关键架构门槛：生成采用 spec-first，渲染器由 registry 管理，target descriptor 同时服务预览和落盘，生成选择器与文档 gallery 都使用生产 renderer fixture。

下一步必须先收敛再扩展。若在契约、Mermaid 和外部 consumer 门禁未闭合前继续增加视觉类型，只会扩大兼容性债务。`ref/diagram-design` 是 taxonomy 与 UX 参考，不是待完成的功能清单。

## 已交付真值矩阵

| 领域 | 当前状态 | 证据 |
|---|---|---|
| 语义域 | 10 个可执行语义图形类型 | `src/diagram/diagramTypeCatalog.ts`、`src/diagram/examples/diagramExampleCatalog.ts` |
| 渲染目标 | 8 个 registry target；target 身份与导出格式分离 | `src/rendering/rendererRegistry.ts`、`src/rendering/renderTargetCatalog.ts` |
| 导出格式 | target 按能力提供 SVG/PNG/PDF；editable HTML/SVG 携带 `previewSvg` | target catalog 与 renderer 集成测试 |
| 可发现性 | 设置页显示确定性缩略图，并提供“使用此类型”动作 | `docs/assets/diagrams/manifest.json`、`diagramExamplePreview.test.ts` |
| 静态 gallery | 10 组生产 fixture 生成的 SVG/PNG；过期资源会让检查失败 | `scripts/generate-diagram-gallery.js`、`npm run diagram:gallery:check` |
| Drawnix | 文件名根原生树、`.drawnix`、SVG companion、Markdown wrapper | Drawnix implementation record 与导出测试 |
| Circuitikz | 受限原生模板与 CLI 编译路径；真实 TeX consumer 仍是独立门禁 | `src/diagram/adapters/circuitikz`、`scripts/export-circuitikz.js` |
| Operation 契约 | schema 形状准入、maintainer 输入校验、运行时结果校验、help/schema 字段派生均已可执行 | `src/operations/contractSchemas.ts`、`src/operations/maintainerCliContractMetadata.json`、bridge 测试 |
| Mermaid | diagram 级 normalize、35 个 stage 的 legacy registry、family 门控、共享 scanner、canonical fence 所有权和验证 runtime 初始化均已收敛 | `src/diagram/adapters/mermaid/normalize.ts`、`src/mermaidProcessor.ts`、`src/diagram/adapters/mermaid/runtime.ts` |
| Public CLI 边界 | `local-knowledge.inspect` 仍是 maintainer-only，不是 public CLI 扩张 | `src/maintainerCliBridge.ts`、capability/public-surface 测试 |

## 本轮实现增量（2026-08-17）

1. 将 maintainer CLI 输入 schema 提取为 JSON 事实源，由 TypeScript 校验器和 Node help 脚本共同读取。required/optional 字段只保留一份；summary 和 example 继续作为人工可读覆盖项。
2. 增加 `assertOperationResult()`。maintainer bridge 返回的非 null 结果会按 registry schema 校验；未知字段继续放行以保持向前兼容，`null` 保留原有取消/无结果语义。
3. 将 Mermaid normalize 移入无运行时依赖的 diagram 层模块，统一处理 BOM/CRLF、带 fence/无 fence、反引号/波浪线 fence、family 检测、ER 实体与基数修复、行尾空白。
4. 保留 `mermaidDefinitionShared.ts` 作为兼容 re-export，preview/render-host 改为直接依赖中性模块。
5. 加固 markdown 修复扫描器：识别两种 fence 并保护 ER 花括号。
6. 将 legacy 修复链暴露为 35 个稳定 stage ID，执行顺序不变。带 flowchart 偏置的 stage 仅对 `flowchart`/`unknown` 执行；sequence 与 ER 内容 fail closed，并增加整链幂等回归契约。
7. 增加共享 `extractMermaidBlocks`/`mapMermaidBlocks` scanner，以及 `openMermaidFence`/`closeMermaidFence`/`fenceMermaidDefinition`，收回验证、修复和 renderer 路径中的重复 fence 输出所有权。
8. 增加 `ensureMermaidInitialized()` 管理插件验证 runtime：按 `mermaid.initialize` 函数身份一次化；预览 webview 保留独立的主题专属 `deps.initialize()` 生命周期。

## 与 `diagram-design` 的对比

| 轴 | 参考项目 | Notemd 当前真值 | 工程决策 |
|---|---|---|---|
| 语义选择 | pattern 页面映射到 visual layout | `DiagramIntent` 路由到 typed catalog | 保留 intent-first |
| 视觉 taxonomy | 27 种布局语法 | 10 个可执行语义类型 | 只通过证据门禁增量准入 |
| 产物/导出 | 自包含 HTML/SVG/PNG 示例 | 8 个 target，导出能力独立声明 | target 与 export 正交 |
| 预览 | 示例 HTML 资产 | 设置页和 docs 使用生产 renderer fixture 缩略图 | 两者使用同一 fixture |
| 治理 | type references 与 complexity budget | versioned capability/target manifest 加测试 | manifest 与测试共同构成契约 |

参考 taxonomy 还包含 architecture、current-state、timeline、swimlane、quadrant、radar、loop、nested、tree、org chart、layers、Venn、pyramid、bar、line、Gantt、scatter、medallion、process、data flow 以及 security/integration matrix。除非实现、预览、导出和 consumer 门禁证据齐全，这些都只能标为 `reference-only/planned`。OAuth sequence、动画、imports、vertical orientation 等是 workflow 或变体，不应伪装成新的语义类型。

## 风险与权衡

- **Mermaid legacy 链：** `mermaidProcessor.ts` 仍是大型且偏 flowchart 的修复面，但现在已固化为 35 个稳定 stage、family 门控和幂等测试。这是受控债务，不应因此把更多 diagram family 接入该链。
- **Mermaid 全局状态：** 插件验证侧已按 `initialize` 函数身份收敛为模块级初始化。预览 webview 有意保留主题专属初始化，因为它们属于独立 runtime；合并两个生命周期会引入主题回归。
- **外部互操作：** Draw.io、Drawnix、Circuitikz 必须使用真实 consumer 证据，不能用 mock 或 serializer snapshot 冒充。工具缺失必须显式记录。
- **向前兼容：** 未知契约字段有意放行；必填字段和已知字段类型在边界严格校验，不能为了“兼容”而整体放松。
- **缓存：** response cache 只是优化，不能成为 artifact 身份或正确性的权威来源。

## 外部 Consumer 门禁状态

| Consumer | 当前证据 | 状态 |
|---|---|---|
| Draw.io | 工作区未发现 diagrams.net/Draw.io 可执行程序 | 未宣称互操作；需补 manual/CI gate |
| Drawnix | 有原生树 fixture 与 serializer 测试；无独立 Drawnix 应用门禁 | 未宣称互操作；仅 fixture 证据 |
| Circuitikz | `pdflatex` 已编译全部 6 个 golden fixture；每个都生成非空 PDF，0 error、0 warning | 本地 consumer gate 通过；CI 仍需记录工具/版本 |

## 向前推进计划

1. **Mermaid Phase 2：已完成。** legacy 链已成为 35 个有序 stage，具备稳定 ID、flowchart/unknown family 门控和幂等覆盖。没有 parser 证据，不扩大安全 family 集合。
2. **Mermaid Phase 3：已完成。** 共享 scanner、canonical fence 格式和插件验证 runtime 初始化已收敛；预览 webview 的主题初始化继续作为独立 runtime 契约。
3. **Consumer 证据：** 在工具可用时执行 Draw.io/Drawnix/Circuitikz 真实门禁；不可用时记录 blocker，不声称兼容。
4. **Drawnix 收敛：** 抽取共享 measurement/layout primitive；确认无调用点后再删除 dead cross-root router 和废弃 coverage alias。
5. **Circuitikz 收敛：** 参数化重复模板，决定未接线 repair-loop 是接入还是删除，并同步路线图。
6. **参考候选准入：** timeline、swimlane、quadrant 等候选必须先满足完整证据清单；radar 在真实 Vega-Lite adapter 出现前保持阻塞。

## 验收门禁

- `npm run diagram:gallery:check`
- `npm run docs:build`
- `npm run build`
- `npm test -- --runInBand`
- `npm run audit:render-host`
- `npm run lint`（当前被仓库基线阻断；不能误标为本功能失败）
- `git diff --check`
- 外部 consumer 记录必须包含工具/版本/输入/输出，不能由 unit mock 替代。

## 验证快照

本轮新鲜证据：全量 Jest 通过（257 suites、2,236 tests passed、1 skipped）；TypeScript/esbuild build 通过；VitePress docs build 通过；gallery check 通过（10 条目）；render-host audit 通过；Circuitikz smoke 通过（6/6 PDF，0 error/0 warning）；`git diff --check` 通过。已知仓库 lint 基线仍为 231 errors、1,329 warnings；完整 lint 仍因既有债务非零退出，但新增 contract/catalog/gallery 文件在该基线内没有新增 error。
