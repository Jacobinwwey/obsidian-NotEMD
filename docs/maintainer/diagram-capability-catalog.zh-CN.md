---
date: 2026-08-16
last_updated: 2026-08-16
status: current-contract
canonical_for: diagram-capability-catalog
---

# 图形能力目录

本文档是当前可执行目录的人类可读视图。运行时真值是 `src/diagram/diagramTypeCatalog.ts` 与 `src/diagram/examples/diagramExampleCatalog.ts`；定义变化时必须重新生成或核对本文档。

target descriptor 是 artifact 机制的运行时权威。其 `exportFormats` 字段只包含图片导出（`SVG`、`PNG`、`PDF`）；源 artifact 由 `sourceExtension` 与 `vaultExtension` 单独描述。下表保持这些轴分离，避免把源文件误认为图片导出。

## 已发布语义类型

| 类型 ID | 用户意图 | 渲染目标 | 示例 fixture | 预览状态 | 导出 |
|---|---|---|---|---|---|
| `mermaid-mindmap` | 概念层级 | Mermaid | `mermaid-mindmap-basics` | 设置页预览动作 | source `.md`、SVG、PNG、PDF |
| `drawnix-knowledge-map` | 可编辑的文件名根知识树及跨分支关系 | Drawnix | `drawnix-knowledge-map-architecture` | SVG companion / Drawnix 产物 | `.drawnix`、SVG、PNG、PDF |
| `flowchart` | 控制流程与决策 | Mermaid | `flowchart-release` | 设置页预览动作 | source `.md`、SVG、PNG、PDF |
| `sequence` | 有序参与者交互 | Mermaid | `sequence-request` | 设置页预览动作 | source `.md`、SVG、PNG、PDF |
| `state` | 生命周期状态与转换 | Mermaid | `state-lifecycle` | 设置页预览动作 | source `.md`、SVG、PNG、PDF |
| `class` | 类型所有权与关联 | Mermaid | `class-domain` | 设置页预览动作 | source `.md`、SVG、PNG、PDF |
| `entity-relationship` | 实体、字段和基数 | Mermaid | `entity-relationship-schema` | 设置页预览动作 | source `.md`、SVG、PNG、PDF |
| `canvas-map` | 空间分组概念 | JSON Canvas | `canvas-map-domains` | iframe / Canvas 产物 | source `.canvas`、SVG、PNG、PDF |
| `data-chart` | 共享坐标轴上的度量比较 | Vega-Lite | `data-chart-trend` | sandbox iframe | source `.json` / Vault `.md`、SVG、PNG、PDF |
| `circuit` | 电气元件与网络 | Circuitikz | `circuit-cmos-inverter` | SVG companion / source | `.tex`、SVG、PNG、PDF* |

`*` Circuitikz 的 PDF/PNG 必须经过固定原生编译器门禁。源 artifact 与图片导出是独立能力；editable HTML/SVG 使用自包含 HTML 源 artifact，以及 descriptor 声明的 SVG/PNG/PDF 图片导出。

## 渲染目标

| Target | 产物边界 | 预览 | 导出格式 | 外部门禁 |
|---|---|---|---|---|
| `mermaid` | Mermaid fence source（`.md`） | iframe | SVG、PNG、PDF | 无 |
| `json-canvas` | JSON Canvas（`.canvas`） | iframe | SVG、PNG、PDF | 无 |
| `vega-lite` | Vega-Lite JSON（`.json`，Vault 为 `.md`） | sandbox iframe | SVG、PNG、PDF | 无 |
| `html` | 通用 HTML fallback | iframe | source | 无 |
| `editable-html-svg` | 自包含 HTML + 语义 inline SVG（`.html`） | SVG companion | SVG、PNG、PDF | 无 |
| `drawio` | Draw.io XML（`.drawio`）+ review companion | SVG companion | SVG、PNG、PDF | diagrams.net 打开/导入 |
| `drawnix` | 一个文件名根 `.drawnix` 树 + SVG companion | SVG companion | SVG、PNG、PDF | Drawnix 打开/导入 |
| `circuitikz` | 已校验 `.tex` + review companion | SVG companion/source | SVG、PNG、PDF | 原生 TeX 编译 |

## 参考/计划类型

以下名称来自 `ref/diagram-design`，当前不可在 Notemd 选择：architecture、IT current-state、timeline、swimlane、quadrant、radar/spider、loop/flywheel、nested、tree、org chart、layer stack、Venn、pyramid/funnel、bar、line、Gantt、scatter、high-level、process、medallion、data flow、DP integration 和 DP security matrix。它们必须经过向前架构计划中的候选准入清单。

## 预览与 gallery 契约

当前设置页 gallery 与文档生成式 gallery 均可执行并使用生产 renderer。生成式 gallery 将产出：

- `docs/assets/diagrams/<fixture-id>.svg`
- `docs/assets/diagrams/<fixture-id>.png`
- 带版本的 capability manifest
- 链接到同一 fixture ID 的双语矩阵行

生成器必须复用生产 fixture 目录，对缺失预览或过期资产失败，保持文件名稳定；禁止在文档脚本中复制 fixture 数据。

## Consumer 门禁

单元测试只能证明 Notemd 产物契约，不能证明外部互操作：

- 在 diagrams.net 打开 Draw.io XML；
- 在真实 Drawnix consumer 中打开/导入 JSON；
- 用固定编译器编译 Circuitikz TeX。
