# 图形参考扩展实施计划

> **面向 agent worker：** REQUIRED SUB-SKILL：使用 `superpowers:subagent-driven-development`（推荐）或 `superpowers:executing-plans`，按任务逐项实施。步骤使用 checkbox（`- [ ]`）跟踪。

**目标：** 在不破坏现有 15 个类型、Mermaid legacy 文件、target 兼容性和生产 preview 证据链的前提下，加入受 `diagram-design` 启发的布局能力。

**架构：** 引入 variant-aware catalog、版本化 canonical payload 边界、有限 payload family 和 profile 驱动 prompt。native editable SVG adapter 负责几何，Vega-Lite 负责定量图，HTML 是可访问 fallback；reference-only 布局只有在所有证据门禁通过后才进入 runtime。

**技术栈：** TypeScript 5.9、Jest 29、esbuild、Mermaid 11、Vega-Lite 6、Playwright gallery 生成、VitePress 文档、Obsidian plugin runtime。

## 全局约束

- 保留现有 15 个可执行类型、legacy Mermaid 输出、Drawnix/Circuitikz 行为和旧 JSON 输入。
- `ref/diagram-design` 仅作开发期参考，不打包其截图、HTML、CDN 字体或 runtime API。
- 使用 `apply_patch` 编辑，仓库命令统一加 `rtk` 前缀。
- 语义 intent、目录 ID、layout profile、render target 和导出格式必须分轴。
- 在 parser/planner 边界一次性校验，renderer 内部依赖已建立的不变量。
- 每个 shipped 类型必须具备 fixture、生产 preview、gallery 资产、双语文档行和自动化测试。
- 未知 schema version fail closed；未知命名空间扩展字段可保留但 renderer 不解释。
- 没有真实 consumer 门禁不得声称 Draw.io、Drawnix 或 Circuitikz 兼容。

---

### 任务 1：增加 variant-aware catalog 身份

**文件：**
- 修改：`src/diagram/types.ts`
- 修改：`src/diagram/diagramTypeCatalog.ts`
- 修改：`src/diagram/diagramCapabilityManifest.ts`
- 测试：`src/tests/diagramTypeCatalog.test.ts`
- 测试：`src/tests/diagramCapabilityManifest.test.ts`

**接口：**
- 消费：现有 `DiagramIntent`、`DiagramCatalogTypeId` 和 `EXECUTABLE_DIAGRAM_TYPES`。
- 产出：`getDiagramType(id)`、`findDiagramType(intent, variant?)`、`findDefaultDiagramType(intent)` 以及安全的兼容查询 API。

- [ ] **步骤 1：写失败测试**，覆盖两个目录行共享 `dataChart`、显式 variant 查询、默认查询和 legacy 查询的歧义错误。
- [ ] **步骤 2：运行聚焦测试**：`rtk npm.cmd test -- --runInBand src/tests/diagramTypeCatalog.test.ts src/tests/diagramCapabilityManifest.test.ts`；预期因 intent 一对一假设失败。
- [ ] **步骤 3：在类型定义中增加 `variant?: string` 与 `payloadKind`**，把 intent map 改为 `Map<DiagramIntent, DiagramTypeDefinition[]>`，保持现有 ID 不变。
- [ ] **步骤 4：增加显式查询函数**，当一个 intent 有多个 variant 时让旧查询抛出 `AMBIGUOUS_DIAGRAM_INTENT`。
- [ ] **步骤 5：扩展 manifest 行**，增加 variant/layout/payload 元数据，并以 additive field policy 保留 `schemaVersion: 1` 读取兼容。
- [ ] **步骤 6：运行聚焦测试和 `rtk npm.cmd run build`**；预期现有目录数量不变且通过。
- [ ] **步骤 7：提交**：`git add src/diagram src/tests && git commit -m "refactor(diagrams): make catalog lookup variant aware"`。

### 任务 2：引入 canonical payload 与 legacy 归一化

**文件：**
- 新增：`src/diagram/payloads/types.ts`
- 新增：`src/diagram/payloads/legacyPayload.ts`
- 修改：`src/diagram/types.ts`
- 修改：`src/diagram/diagramSpecResponseParser.ts`
- 修改：`src/diagram/spec.ts`
- 测试：`src/tests/diagramSpecResponseParser.test.ts`
- 测试：`src/tests/diagramSpecValidation.test.ts`

**接口：**
- 消费：legacy `DiagramSpec` 字段和任务 1 的 payload kind。
- 产出：`VersionedDiagramSpec`、`DiagramPayload`、`normalizeLegacyDiagramSpec()` 与 payload family 校验。

- [ ] **步骤 1：增加失败归一化测试**，覆盖旧 `dataSeries`、`layoutHints.chartType`、timeline、swimlane、quadrant、radar、circuit。
- [ ] **步骤 2：运行测试**：`rtk npm.cmd test -- --runInBand src/tests/diagramSpecResponseParser.test.ts src/tests/diagramSpecValidation.test.ts`；预期 canonical payload 缺失。
- [ ] **步骤 3：在 `src/diagram/payloads/types.ts` 定义判别式 payload**；第一步只实现本路线需要的 `legacy`、`quantitative`、`topology`、`lane-grid`、`access-matrix`。
- [ ] **步骤 4：增加 `schemaVersion` 和可选 `payload`**，保留现有调用方所需的 legacy projection。
- [ ] **步骤 5：实现一个 parser 边界**，把旧字段映射为 canonical payload，归一化数值别名，保留 evidence，未知 schema version 直接拒绝。
- [ ] **步骤 6：让 `validateDiagramSpec()` 先校验 canonical payload**，再校验归一化后的 legacy projection；renderer 内不散落 null check。
- [ ] **步骤 7：运行聚焦测试、build 和全量 Jest**；现有 fixture 的 Mermaid artifact 必须字节稳定。
- [ ] **步骤 8：提交**：`git add src/diagram src/tests && git commit -m "feat(diagrams): add versioned canonical payload boundary"`。

### 任务 3：用 profile catalog 替换 prompt 条件分支

**文件：**
- 新增：`src/diagram/prompts/diagramPromptProfileCatalog.ts`
- 修改：`src/diagram/prompts/diagramSpecPrompt.ts`
- 修改：`src/diagram/planner.ts`
- 测试：`src/tests/diagramPrompt.test.ts`
- 测试：`src/tests/diagramPlanner.test.ts`

**接口：**
- 消费：catalog 的 `promptProfileId`、variant、target 和 presentation 默认值。
- 产出：`getDiagramPromptProfile(id)`、profile admission 和通用/profile 组合 prompt。

- [ ] **步骤 1：写失败测试**，断言每个 executable catalog 行拥有 profile，profile 声明 required fields/hard limits，prompt 含 source delimiter 且不要求输出 renderer 语法。
- [ ] **步骤 2：运行聚焦测试**：`rtk npm.cmd test -- --runInBand src/tests/diagramPrompt.test.ts src/tests/diagramPlanner.test.ts`；预期 profile 查询失败。
- [ ] **步骤 3：创建纯数据 profile catalog**，覆盖现有 15 类型及路线图 payload family；每个 profile 声明 version、payloadKind、字段、限制、语义规则、target 规则和非法示例。
- [ ] **步骤 4：重构 `buildDiagramSpecPrompt()`**，组合通用契约、选定 profile、target/presentation 规则，并保留 Circuitikz/Drawnix 安全约束。
- [ ] **步骤 5：增加 source-note delimiter 与反编造规则**，不改变现有语言行为。
- [ ] **步骤 6：运行聚焦测试并检查生成 prompt** 的 Mermaid/Drawnix/Circuitikz 回归文本，再执行 `rtk npm.cmd run build`。
- [ ] **步骤 7：提交**：`git add src/diagram src/tests && git commit -m "refactor(diagrams): drive generation prompts from profiles"`。

### 任务 4：增加 presentation 与 renderer admission 契约

**文件：**
- 新增：`src/diagram/presentation.ts`
- 新增：`src/rendering/renderTargetCatalog.ts`
- 修改：`src/rendering/rendererRegistry.ts`
- 修改：`src/rendering/types.ts`
- 修改：`src/diagram/diagramGenerationService.ts`
- 测试：`src/tests/renderTargetCatalog.test.ts`
- 测试：`src/tests/rendererRegistry.test.ts`

**接口：**
- 消费：canonical spec 与现有 renderer。
- 产出：`DiagramPresentation`、target descriptor、preview mode admission 和重复 renderer 所有权检查。

- [ ] **步骤 1：写失败矩阵测试**，覆盖 target descriptor、默认 presentation、缺 preview mode、重复 `(target, payloadKind)` 所有权和显式不兼容 target 拒绝。
- [ ] **步骤 2：运行聚焦测试**：`rtk npm.cmd test -- --runInBand src/tests/renderTargetCatalog.test.ts src/tests/rendererRegistry.test.ts`；预期 descriptor admission 失败。
- [ ] **步骤 3：增加所有现有 target descriptor**，不改公共 ID；包含 MIME、扩展名、preview kind、导出格式和 fallback policy。
- [ ] **步骤 4：增加 registry admission**，拒绝重复 target 所有权和宣称不支持 preview 的 renderer。
- [ ] **步骤 5：将 presentation 默认值接入 `RenderOptions`**，除非明确传入 presentation，不改变现有 artifact cache identity。
- [ ] **步骤 6：运行聚焦测试、`rtk npm.cmd run audit:render-host` 和 build**。
- [ ] **步骤 7：提交**：`git add src/diagram src/rendering src/tests && git commit -m "feat(rendering): admit targets and presentation contracts"`。

### 任务 5：交付 Batch 1A topology 类型

**文件：**
- 新增：`src/diagram/payloads/topology.ts`
- 新增：`src/diagram/adapters/editableSvg/topologyRenderer.ts`
- 修改：`src/diagram/diagramTypeCatalog.ts`
- 修改：`src/diagram/prompts/diagramPromptProfileCatalog.ts`
- 修改：`src/diagram/examples/diagramExampleCatalog.ts`
- 修改：`src/rendering/renderers/editableHtmlSvgRenderer.ts`
- 修改：`src/diagram/diagramCapabilityManifest.ts`
- 测试：`src/tests/topologyPayload.test.ts`
- 测试：`src/tests/topologyRenderer.test.ts`
- 测试：`src/tests/diagramExampleCatalog.test.ts`

**接口：**
- 消费：canonical `topology` payload 与 presentation。
- 产出：`architecture`、`current-state`、`integration-topology` 的确定性 SVG 与 HTML fallback。

- [ ] **步骤 1：写失败 payload 测试**，覆盖 zone、稳定 node ID、edge 引用、focal 上限和正交连接。
- [ ] **步骤 2：为三个 ID 增加生产 fixture**，使用 catalog-owned fixture 契约，不复制参考截图。
- [ ] **步骤 3：实现确定性 topology 几何**，包括 zone 布局、文本换行、正交连接、稳定 SVG ID、明暗 token。
- [ ] **步骤 4：注册 native renderer 与兼容 target**；不得添加 Mermaid、Drawio、Drawnix 或 Circuitikz 兼容声明。
- [ ] **步骤 5：增加 preview/gallery 测试**，更新双语 support matrix。
- [ ] **步骤 6：运行 `rtk npm.cmd run diagram:gallery`、`rtk npm.cmd run diagram:gallery:check`、build、全量 Jest、docs build 和 i18n audit。
- [ ] **步骤 7：追加双语进度记录**，记录三个 ID、target 声明、fixture hash 和 unavailable consumer。
- [ ] **步骤 8：提交**：`git add src docs scripts && git commit -m "feat(diagrams): add topology layout capabilities"`。

### 任务 6：交付 Batch 1B data-flow 与 access matrix

**文件：**
- 新增：`src/diagram/payloads/laneGrid.ts`
- 新增：`src/diagram/payloads/accessMatrix.ts`
- 新增：`src/diagram/adapters/editableSvg/laneGridRenderer.ts`
- 新增：`src/diagram/adapters/editableSvg/accessMatrixRenderer.ts`
- 修改：任务 5 的 catalog、prompt、fixture、manifest、preview 和 docs 文件。
- 测试：两个类型的 payload、renderer、preview 和 gallery 聚焦测试。

**接口：**
- 消费：`lane-grid` 与 `access-matrix` canonical payload。
- 产出：生产 SVG 与 HTML table fallback；不声明 Mermaid 兼容。

- [ ] **步骤 1：写失败测试**，覆盖 lane/step/cell 上限、空 cell 不生成、focal handoff 唯一、matrix role/component 上限、封闭 permission level、focal cell 唯一。
- [ ] **步骤 2：先实现 validator，再实现 renderer**，使 renderer 依赖稳定不变量。
- [ ] **步骤 3：实现固定几何**，吸收参考公式、data-type chip 和 permission cell category，但不接受模型传入任意 renderer 样式。
- [ ] **步骤 4：增加 fixture、生产 preview、gallery、双语 docs 和 manifest 行。
- [ ] **步骤 5：运行聚焦测试、gallery check、docs build、build、全量 Jest 和 `git diff --check`。**
- [ ] **步骤 6：更新双语进度并提交**：`feat(diagrams): add data-flow and access-matrix layouts`。

### 任务 7：交付 Batch 2 定量 variant 与 Gantt

**文件：**
- 新增：`src/diagram/payloads/quantitative.ts`
- 新增：`src/diagram/payloads/schedule.ts`
- 新增：`src/diagram/adapters/editableSvg/scheduleRenderer.ts`
- 修改：`src/diagram/adapters/vega/vegaLiteAdapter.ts`
- 修改：catalog、planner、parser、prompt、fixture、manifest、preview 和 docs。
- 测试：chart variant 迁移、Vega-Lite、schedule renderer 与 gallery 测试。

**接口：**
- 消费：`quantitative.chartType` 与 `schedule` payload。
- 产出：bar/line/scatter Vega-Lite artifact、Gantt native SVG 和 HTML table fallback。

- [ ] **步骤 1：写失败迁移测试**，证明旧 `data-chart` 与 `layoutHints.chartType` 仍可读取。
- [ ] **步骤 2：增加 chart 上限与真实数值校验**，缺数值时拒绝，不填充估计值。
- [ ] **步骤 3：将显式 chart variant 路由到现有 Vega-Lite adapter**，保留 `data-chart` auto/legacy。
- [ ] **步骤 4：实现确定性 Gantt 几何**，包含 phase、task bar、milestone，v1 不生成依赖箭头。
- [ ] **步骤 5：增加 fixture、preview、gallery、双语 docs 和 support matrix。
- [ ] **步骤 6：运行完整回归并提交**：`feat(diagrams): add quantitative variants and gantt`。

### 任务 8：交付 Batch 3 结构布局

**文件：**
- 新增：`src/diagram/payloads/orderedStack.ts`、`setOverlap.ts`、`rankedSegments.ts`、`cycle.ts`
- 新增：对应的确定性 editable SVG adapter。
- 修改：catalog、prompt、validator、fixture、manifest、preview 和双语 docs。
- 测试：每个 payload family 各有 validator/renderer/preview/gallery 套件。

**接口：**
- 消费：layer stack、Venn、pyramid/funnel、loop、nested、tree、process、medallion、high-level 的有限 payload family。
- 产出：只有通过 fixture 与几何门禁的类型才进入 shipped；其余继续 reference-only。

- [ ] **步骤 1：每批只准入 2–4 个 ID**，需要无界图算法的布局拒绝进入本批。
- [ ] **步骤 2：按 family 实现明确预算**：stack 4–6 层、Venn 2–3 集合、ranked segments 4–6 段、loop 5–8 station 加一个 hub。
- [ ] **步骤 3：loop 圆弧作为有文档的类型特例**；其他非同轴连接仍必须正交。
- [ ] **步骤 4：增加生产 fixture、preview/gallery 证据、双语 docs 和 progress entry。
- [ ] **步骤 5：运行全部门禁并按 family 独立提交**，失败 family 不阻塞已发布 family。

### 任务 9：最终文档、发布证据与 clean mainline

**文件：**
- 修改：`docs/brainstorms/2026-08-16-mainline-diagram-architecture-progress-and-next-direction.md`
- 修改：`docs/brainstorms/2026-08-16-mainline-diagram-architecture-progress-and-next-direction.zh-CN.md`
- 修改：`docs/diagram-gallery.md`
- 修改：`docs/diagram-gallery.zh-CN.md`
- 修改：`docs/architecture.md`
- 修改：`docs/architecture.zh-CN.md`

**接口：**
- 消费：gallery manifest、capability manifest、测试输出和外部 consumer 记录。
- 产出：双语进度真值、support matrix 和 clean 的 `main`。

- [ ] **步骤 1：每批完成后更新进度**，严格区分 shipped、partial、reference-only 与 unavailable consumer。
- [ ] **步骤 2：运行 `rtk npm.cmd run diagram:gallery:check`、`rtk npm.cmd run docs:build`、`rtk npm.cmd run build`、`rtk npm.cmd test -- --runInBand`、`rtk npm.cmd run audit:i18n-ui` 和 `rtk git diff --check`。
- [ ] **步骤 3：确认生成资产为最新，`main.js` 仍为 ignored/generated。
- [ ] **步骤 4：运行 `rtk proxy git status --porcelain=v1 -b`；预期只显示 `## main...origin/main`。
- [ ] **步骤 5：全部门禁通过后提交文档/发布证据，再推送 `origin/main`。

## 自检

- 计划覆盖 catalog variant、canonical payload、prompt profile、presentation、renderer、preview/gallery、所有阶段参考 family、双语 docs 和 clean mainline 证据。
- 没有使用“稍后实现”式占位；每个任务都列出文件、接口、测试、命令和预期结果。
- 旧 ID 和公共 target 保留；新 chart variant 不需要破坏性迁移。
- fallback 声明显式，不会在缺少证据时暗示 Mermaid/Drawio/Drawnix 互操作。
