---
date: 2026-08-14
topic: diagram-type-catalog-and-drawnix-delivery
status: approved
scope: architecture-and-documentation
related:
  - ../brainstorms/2026-08-14-drawnix-presentation-architecture-review.zh-CN.md
  - ../brainstorms/2026-07-22-drawnix-knowledge-map-quality-and-delivery-plan.zh-CN.md
  - ../architecture.zh-CN.md
---

# 图表类型目录与 Drawnix 交付设计

## 决策

引入只收录可执行能力的 `DiagramTypeCatalog`。它负责类型名称、语义模式、提示词配置、渲染器绑定、视觉角色词表和示例夹具绑定。一个类型只有同时具备生成、渲染、导出和测试链路后，才能进入目录与界面。

保留 `drawnixMindmap` 作为持久化兼容 intent。目录中的展示名称改为 **Drawnix 知识导图**。它是一级图表类型，拥有独立提示词、画布投影、演示投影和示例族；`drawnix` 仍是文件/渲染目标，不作为面向用户的类型名称。

当前全铺展画布是兼容基线。演示交付是独立操作，从同一语义图导出概览和细节切片。界面选择只负责分派操作，底层布局函数不接收 `mode` 开关。

## 范围与边界

本文定义产品模型与文档架构，不把尚未完成的运行时工作描述成已发功能。

当前已交付契约保持不变：

```text
DiagramSpec(intent: "drawnixMindmap")
  -> Drawnix 思维导图投影
  -> 可编辑 .drawnix
  -> 全铺展 SVG companion
```

已批准的目标契约为：

```text
DiagramSpec
  -> Drawnix 知识导图类型配置
  -> buildDrawnixKnowledgeMapBoardProjection()
  -> 可编辑 .drawnix

同一 DiagramSpec
  -> buildDrawnixKnowledgeMapPresentation()
  -> 概览 + 细节切片 + fidelity ledger
  -> renderDrawnixKnowledgeMapPresentationSvg()
  -> SVG / PNG / PDF
```

两条链路共享稳定 node ID、层级 ownership、关系端点、语义角色、evidence 引用和来源 provenance，但不共享像素坐标。Drawnix 上游 `withMind` 会在导入后放置原生子节点；静态交付则要针对确定的视区优化。

该设计不把 Drawnix 或 Plait 嵌入 Obsidian 生产 bundle，也不改变 Mermaid `mindmap` 的提示词、渲染器或回退行为。

## 目录模型

`DiagramTypeCatalog` 是注册表，不是新的推断分支。每个定义只承担一组完整职责：

| 字段 | 含义 |
|---|---|
| `id` | 用于设置、文档和示例的稳定目录标识。 |
| `family` | 知识、行为、结构、定量或工程。 |
| `semanticPattern` | 读者必须理解的承重关系。 |
| `intentBinding` | 当前 `DiagramIntent`，或明确标记的未来缺失能力。 |
| `promptProfile` | 结构化 `DiagramSpec` 输出的类型专属约束。 |
| `rendererBinding` | 具体渲染操作及其 artifact 契约。 |
| `visualRoles` | 稳定语义角色词表，不使用分支顺序配色。 |
| `exampleFixture` | Notemd 自有语义夹具及其生成示例产物。 |
| `availability` | `executable` 或 `reference-only`；只有前者能进入界面。 |

目录是 UI 标签、文档表格、提示词路由和示例图库元数据的真值来源。它不是通用 renderer options 对象；每个渲染器继续拥有独立操作和不变量。

## 可执行类型分类

| 分类 | 目录类型 | 当前绑定 | 参考设计线索 | 状态 |
|---|---|---|---|---|
| 知识 | Mermaid 思维导图 | `mindmap` -> Mermaid | Tree hierarchy | executable |
| 知识 | Drawnix 知识导图 | `drawnixMindmap` -> Drawnix | Tree + Architecture | executable |
| 行为 | 流程图 | `flowchart` -> Mermaid | Flowchart | executable |
| 行为 | 时序图 | `sequence` -> Mermaid | Sequence | executable |
| 行为 | 状态图 | `stateDiagram` -> Mermaid | State machine | executable |
| 结构 | 类图 | `classDiagram` -> Mermaid | 技术结构；不声称已有新模板 | executable |
| 结构 | 实体关系图 | `erDiagram` -> Mermaid | ER / data model | executable |
| 结构 | 空间概念图 | `canvasMap` -> JSON Canvas | 仅借鉴 Architecture / tree 线索 | executable |
| 定量 | 数据图 | `dataChart` -> Vega-Lite | Bar、Line、Scatter；Pie 与 Table 保持自身语法 | executable |
| 工程 | 电路图 | `circuit` -> Circuitikz | 电路专属模板目录 | executable |

Timeline、Swimlane、Architecture、Process、Gantt、Layer stack、Radar 等参考仓库布局属于 `reference-only`。它们可以出现在路线图与选型说明中，不能进入当前设置选择器或示例图库。

## Drawnix 交付选择

Drawnix 知识导图在界面中提供两个具名选项：

| 选项 | 操作 | 主输出 | 使用场景 |
|---|---|---|---|
| **全量画布** | `generateDrawnixKnowledgeMapBoard()` | 现有 `.drawnix` 和全铺展 SVG companion | 编辑、完整检查，以及把整片 forest 保留在一个 artifact 中。 |
| **演示交付** | `generateDrawnixKnowledgeMapPresentation()` | 同一 `.drawnix`、overview SVG、detail SVG 和交付 manifest | 文档、评审、打印和面向演示的讲解。 |

选择器是一次 host 层分派。它调用其中一个操作；`buildDrawnixKnowledgeMapBoardProjection()` 和 `buildDrawnixKnowledgeMapPresentation()` 是不同函数，拥有不同结果类型与测试。

用户偏好保存为 `drawnixKnowledgeMapDelivery: 'full-board' | 'presentation'`。它只决定路由，不作为布局参数。既有设置没有该字段时解析为 `full-board`。已有 `preferredDiagramIntent: 'drawnixMindmap'` 与 `preferredDiagramRenderTarget: 'drawnix'` 继续选择全量画布。

预览工具栏也会在存在语义重放记录时暴露另一个操作。它从已保存的语义数据重新构建另一个交付，不调用 LLM。旧 `.drawnix` 没有该记录时仍可作为全量画布读取；界面必须提示需要重新生成才能得到演示集，不能伪造缺失的语义。

## 持久化与命名

新的 Drawnix 导出保持当前 source-visual metadata 契约不变：

```text
metadata.notemd.sourceVisuals@1
```

并新增独立且向前兼容的重放记录：

```text
metadata.notemd.knowledgeMap@1
  - canonical DiagramSpec 子集
  - semantic-spec hash
  - catalog type id
  - delivery manifest 引用
```

现有验证器只要 v1 `sourceVisuals` 结构保持有效，就允许额外 namespaced metadata 字段。实现必须在 host 边界验证新增记录，并且对未知未来记录不做猜测性修改。

全量画布继续使用当前路径：

```text
<source>_diagram.drawnix
<source>_diagram.drawnix.svg
```

演示交付写入独立、由 manifest 所有的目录，避免覆盖全量画布或用户文件：

```text
<source>_diagram.presentation/
  manifest.json
  overview.svg
  detail-01-<cluster>.svg
  detail-02-<cluster>.svg
```

PNG 和 PDF 从这些 SVG panel 生成。清理操作只能删除同一 source artifact 的有效 Notemd manifest 中列出的文件。

## Drawnix 演示规划器

画布投影保留全部节点和关系。演示规划器消费同一语义 forest，并根据目标尺寸、受众、语言和最小可读字号组成的 delivery contract 输出静态交付。

root 放置采用图论信息。跨 root 关系数量、方向、标签重要度和 cluster 密度参与排序，再进行适配目标宽高比的打包。候选布局按加权关系长度、交叉数、纵横比和标签净空评分。评分只用于选择，不会因为图深、图宽或关系多而拒绝语义图。

完整 forest 在一个视区中无法满足交付契约时，规划器输出：

1. 保留 root 与关键 root 间关系的 overview。
2. 每个高密度 cluster 的 detail slice。
3. fidelity ledger，标出每个 node 和 relation 位于 overview 还是 detail，并记录所有摘要或聚类决策。

完整 `.drawnix` 始终是穷尽 artifact。演示切片不能静默丢失语义。

## 视觉角色与示例

参考项目提供设计词汇，不提供可直接复制的资产或固定节点预算。Notemd 自有示例采用其中有价值的部分：

- 先选择语义类型，再选择对应布局；
- 用稳定视觉角色替代任意分支颜色；
- 只对少量可解释的焦点元素使用强调；
- 目标布局允许时使用正交且可独立追踪的连线；
- 图例和交付说明放在内容区之外；
- 对标签净空、裁剪和视区可读性建立验证。

Drawnix 知识导图使用 `root`、`domain`、`subsystem`、`component`、`evidence`、`external` 和 `cross-relation` 等角色。prompt 产出带角色的语义输入与简短标签；换行、角色视觉、聚类、路由和颜色分配由确定性代码负责。

每个可执行目录项都拥有一个 Notemd 自有示例包：

```text
选型理由
-> canonical DiagramSpec fixture
-> 生成的源 artifact
-> 生成的 SVG 或 PNG 缩略图
-> 结构与视觉断言
-> 中文与英文标签用例
```

图库只渲染由 Notemd 生成的 artifact。`ref/diagram-design` 继续作为本地设计参考，它的 HTML 和截图不进入产品 bundle。

## 提示词设计

Drawnix 使用独立 prompt profile。它允许 multi-root forest，为每个 root 保留 source scope，用 `node.children` 表示层级，只为重要跨分支关系添加 relation role，并保持标签简短。它不输出 Drawnix JSON 或 CSS 决策。

当前强制 document root 的规则改为显式的 presentation overview 策略。source coverage 先保留输入层级；overview 需要 document root 时由 presentation planner 引入，不能覆盖 board 的语义真值。

Mermaid 思维导图继续使用现有 prompt profile。任何 Drawnix root 或 relation 规则都不能泄漏到这条路径。

## 兼容规则

1. 现有设置和全量画布产物保持原有行为与路径。
2. 缺少 replay record 不得阻止已有 `.drawnix` 的打开或导出。
3. 对 legacy artifact 请求演示交付时，返回可操作的“需要重新生成”提示，不能执行有损猜测式重建。
4. 新生成的演示交付也写出兼容的全量 `.drawnix`。
5. Mermaid `mindmap` 的命令、cache key、fallback traversal 和修复流程与 Drawnix 改动隔离。
6. 未知 catalog ID 和 metadata schema version 在新增边界 fail closed，同时继续读取合法 legacy export。

## 质量门

| 表面 | 必需证据 |
|---|---|
| Catalog | 每个 executable 项都有 prompt profile、renderer binding、example fixture 和本地化标签。reference-only 项不能进入选择器。 |
| Board | stable ID、层级 ownership、关系端点、原生 Drawnix 导入，以及完整语义保留。 |
| Presentation | 无裁剪标签、无节点/标签相交、连接可追踪、目标视区最小字号达标，并且 ledger 覆盖全部语义实体。 |
| Compatibility | legacy setting 选择全量画布；legacy artifact 保持可读；有 replay record 时切换不调用 LLM。 |
| Isolation | Mermaid `mindmap` 生成、渲染和 fallback 测试保持原样并独立通过。 |

真实导入证据只在测试依赖中固定 Drawnix/Plait consumer。SVG 结构检查与 consumer test 互补，互不替代。

## 拒绝的方案

- 将参考仓库的 9/12/24 节点预算应用到画布。这些是编辑式演示约束，不是语义有效性规则。
- 让 LLM 决定视觉颜色、坐标或 Drawnix 文件语法。它们属于确定性投影和渲染。
- 一个 renderer 接收 `full`/`presentation` 开关。两个 artifact 契约会被混在一起，测试失败也无法定位。
- 替换现有全铺展 SVG。这会破坏既有路径、审阅流程和向前兼容。
- 在 UI 中展示 reference-only 类型。这等于在没有实现时创建产品契约。

## 完成定义

该增量完成时，用户可以一次选择 **全量画布** 或 **演示交付**，获得相应的自有 artifact；存在 replay data 时可以不重新生成语义内容而在二者间切换；原有 Mermaid 思维导图行为保持不变。示例图库只介绍可执行类型，每张缩略图都由用户实际使用的同一渲染链路产生。

逐任务实施顺序见[图表类型目录与 Drawnix 交付实施计划](./2026-08-14-diagram-type-catalog-and-drawnix-delivery-implementation.zh-CN.md)。
