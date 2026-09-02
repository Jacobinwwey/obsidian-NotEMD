---
date: 2026-08-16
last_updated: 2026-09-02
status: current-contract
canonical_for: diagram-capability-catalog
---

# 图形能力目录

本文档是当前可执行目录的人类可读视图。运行时真值来源是 `src/diagram/diagramTypeCatalog.ts`、`src/diagram/examples/diagramExampleCatalog.ts`、`src/rendering/renderTargetCatalog.ts` 和 `src/diagram/diagramCapabilityManifest.ts`。这些定义变化时，必须同步核对本文档。

目录保持三个独立轴：语义类型、渲染 target 和导出格式。目录行是可执行的用户选择；渲染 target 描述 artifact 边界；`SVG`、`PNG`、`PDF` 是图片导出格式。源扩展名与 Vault 扩展名有意与图片导出分开列出。

## 已发布语义类型

下面 33 行是完整的可执行目录。`bar-chart`、`line-chart`、`scatter-plot` 等 variant 是独立且稳定的选择，但共享有界 Vega-Lite renderer。

| 类型 ID | 语义意图 | 渲染 target | 示例 fixture | 输出契约 |
|---|---|---|---|---|
| `mermaid-mindmap` | 概念层级 | Mermaid | `mermaid-mindmap-basics` | `.md`、SVG、PNG、PDF |
| `drawnix-knowledge-map` | 文件名根知识树与跨分支关系 | Drawnix | `drawnix-knowledge-map-architecture` | `.drawnix`、SVG、PNG、PDF |
| `flowchart` | 控制流程与决策路径 | Mermaid | `flowchart-release` | `.md`、SVG、PNG、PDF |
| `sequence` | 有序参与者交互 | Mermaid | `sequence-request` | `.md`、SVG、PNG、PDF |
| `state` | 状态转换生命周期 | Mermaid | `state-lifecycle` | `.md`、SVG、PNG、PDF |
| `class` | 类型关系与所有权 | Mermaid | `class-domain` | `.md`、SVG、PNG、PDF |
| `entity-relationship` | 实体基数与属性 | Mermaid | `entity-relationship-schema` | `.md`、SVG、PNG、PDF |
| `canvas-map` | 空间分组概念 | JSON Canvas | `canvas-map-domains` | `.canvas`、SVG、PNG、PDF |
| `data-chart` | 共享坐标轴上的度量比较 | Vega-Lite | `data-chart-trend` | `.json` / Vault `.md`、SVG、PNG、PDF |
| `radar-chart` | 多轴画像比较 | Vega-Lite | `radar-capability-profile` | `.json` / Vault `.md`、SVG、PNG、PDF；HTML 表格 fallback |
| `org-chart` | 带责任归属的组织层级 | Mermaid | `org-chart-support-ownership` | `.md`、SVG、PNG、PDF；HTML 表格 fallback |
| `timeline` | 按时间排序的里程碑 | Mermaid | `timeline-roadmap` | `.md`、SVG、PNG、PDF |
| `swimlane` | 跨团队职责流转 | Mermaid | `swimlane-release` | `.md`、SVG、PNG、PDF |
| `quadrant` | 双轴优先级矩阵 | Mermaid | `quadrant-priorities` | `.md`、SVG、PNG、PDF |
| `circuit` | 电气元件与网络 | Circuitikz | `circuit-cmos-inverter` | `.tex`、SVG、PNG、PDF* |
| `bar-chart` | 离散类别比较（`variant: bar`） | Vega-Lite | `bar-chart-adoption` | `.json` / Vault `.md`、SVG、PNG、PDF |
| `line-chart` | 有序坐标轴上的连续趋势（`variant: line`） | Vega-Lite | `line-chart-render-time` | `.json` / Vault `.md`、SVG、PNG、PDF |
| `scatter-plot` | 成对数值之间的相关性（`variant: scatter`） | Vega-Lite | `scatter-plot-quality` | `.json` / Vault `.md`、SVG、PNG、PDF |
| `architecture` | 按边界分组并由拓扑连接的组件 | Editable HTML/SVG | `architecture-platform` | `.html`、SVG、PNG、PDF |
| `current-state` | 带交接与瓶颈的遗留现状 | Editable HTML/SVG | `current-state-legacy-pipeline` | `.html`、SVG、PNG、PDF |
| `integration-topology` | 通过协议连接到平台核心的来源与消费者 | Editable HTML/SVG | `integration-topology-platform` | `.html`、SVG、PNG、PDF |
| `data-flow` | 按角色划分、经过多个阶段的数据流 | Editable HTML/SVG | `data-flow-platform` | `.html`、SVG、PNG、PDF |
| `access-matrix` | 角色到组件的权限矩阵 | Editable HTML/SVG | `access-matrix-platform` | `.html`、SVG、PNG、PDF |
| `gantt` | 执行时间线上的任务与里程碑 | Editable HTML/SVG | `gantt-release-plan` | `.html`、SVG、PNG、PDF |
| `layer-stack` | 带焦点层的有序抽象层 | Editable HTML/SVG | `layer-stack-platform` | `.html`、SVG、PNG、PDF |
| `venn` | 两个或三个显式集合的重叠 | Editable HTML/SVG | `venn-platform` | `.html`、SVG、PNG、PDF |
| `ranked-funnel` | 排名层级或转化流失 | Editable HTML/SVG | `ranked-funnel-release` | `.html`、SVG、PNG、PDF |
| `loop` | 向中心 hub 写入持久状态的强化循环 | Editable HTML/SVG | `loop-operating-model` | `.html`、SVG、PNG、PDF |
| `nested` | 通过嵌套边界表达范围与包含关系 | Editable HTML/SVG | `nested-scope` | `.html`、SVG、PNG、PDF |
| `tree` | 父子层级关系 | Editable HTML/SVG | `tree-ownership` | `.html`、SVG、PNG、PDF |
| `process` | 带交接的多角色分阶段流程 | Editable HTML/SVG | `process-release` | `.html`、SVG、PNG、PDF |
| `medallion` | 数据质量层级与晋级路径 | Editable HTML/SVG | `medallion-data-quality` | `.html`、SVG、PNG、PDF |
| `high-level` | 跨栈层的端到端平台总览 | Editable HTML/SVG | `high-level-platform` | `.html`、SVG、PNG、PDF |

`*` Circuitikz 的 PDF/PNG 必须经过固定原生编译器门禁。源 artifact 与图片导出是独立能力。

## 渲染目标

| Target | 产物边界 | 预览 | 导出格式 | 外部门禁 |
|---|---|---|---|---|
| `mermaid` | Mermaid fence source（`.md`） | iframe | SVG、PNG、PDF | 无 |
| `json-canvas` | JSON Canvas（`.canvas`） | iframe | SVG、PNG、PDF | 无 |
| `vega-lite` | Vega-Lite JSON（`.json`，Vault 为 `.md`） | sandboxed iframe | SVG、PNG、PDF | 无 |
| `html` | 通用 HTML fallback | iframe | source | 无 |
| `editable-html-svg` | 自包含 HTML + 语义 inline SVG（`.html`） | SVG companion | SVG、PNG、PDF | 无 |
| `drawio` | Draw.io XML（`.drawio`）及 review companion | SVG companion | SVG、PNG、PDF | diagrams.net 打开/导入 |
| `drawnix` | 文件名根 `.drawnix` 树及 SVG companion | SVG companion | SVG、PNG、PDF | Drawnix 打开/导入 |
| `circuitikz` | 已校验 `.tex` 及 review companion | SVG companion/source | SVG、PNG、PDF | 原生 TeX 编译 |

## 仅参考/计划类型

当前有且只有以下 5 个参考 grammar 保持在选择器和生产 gallery 之外：

- `diagram-design:flowchart`
- `diagram-design:sequence`
- `diagram-design:state-machine`
- `diagram-design:er-data-model`
- `diagram-design:pyramid-funnel`

它们继续保留在 `referenceOnlyLayouts` 中用于路线图统计，不会发布截图、data URL、选择器行或 preview API。升级必须同时具备 typed input contract、生产 renderer、fixture、target/export 矩阵、无障碍证据、文档行和自动化门禁。可执行的 `flowchart`、`sequence`、`state` 与 `ranked-funnel` 是独立契约，不会自动把这些精确参考 grammar 视为已升级。

## 预览与 Gallery 契约

设置页和生成工作台使用 `src/ui/diagramTypePreviewPanel.ts`。类型选择器只暴露可执行目录条目；选择后，单个固定尺寸面板通过 `renderDiagramExampleThumbnail()` 渲染生产 fixture。文档 gallery 复用同一份生产 fixture 目录并生成：

- `docs/assets/diagrams/<fixture-id>.svg`
- `docs/assets/diagrams/<fixture-id>.png`
- 带版本的 capability manifest
- 链接到同一 fixture ID 的双语矩阵行

生成器会对缺失预览或过期资产失败，并保持 fixture 文件名稳定；禁止在文档脚本中复制 fixture 数据。`docs/diagram-examples/` 是独立的真实 Vault 证据集，包含双语输入、provider/model 元数据、生成 artifact、哈希和显式的 `passed`/`failed` 状态；`passed` 只表示插件已加载并实际运行，不等于静态 fixture 证明。

## Consumer 门禁

单元测试只能证明 Notemd 产物契约，不能证明外部互操作：

- 在 diagrams.net 打开 Draw.io XML；
- 运行 `npm run diagram:consumer:drawnix`，通过公开 Plait API 消费生产 fixture；环境具备真实 Drawnix 应用时，再打开/导入同一个 `.drawnix` JSON；
- 用固定编译器编译 Circuitikz TeX。

当前 Plait consumer 门禁通过。Draw.io 应用导入和完整 Drawnix 应用往返仍属于外部证据，serializer 或 public API 测试不代表这些声明。
