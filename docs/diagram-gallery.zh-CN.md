# 图形 Gallery

语言：[English](./diagram-gallery.md) | **简体中文**

本页是 Notemd 当前可执行图形类型的用户侧清单。页面使用与设置页和工作台类型选择器相同的可执行 fixture；提交的 [gallery manifest](./assets/diagrams/manifest.json) 记录每张图片的生产 target、预览 target 与 SVG 哈希。

## 范围与契约

- **已交付（Shipped）**表示语义类型已进入 `src/diagram/diagramTypeCatalog.ts`，拥有可执行 fixture，并由 capability manifest 覆盖。
- **默认 target** 是 planner 的正常渲染目标；**兼容 target** 是明确存在的 renderer 契约，不表示所有 target 具有相同的布局语义。
- 预览图来自生产 renderer，由 `npm run diagram:gallery` 生成；发布文档前或 CI 中运行 `npm run diagram:gallery:check`。
- [cathrynlavery/diagram-design](https://github.com/cathrynlavery/diagram-design) 只作为 taxonomy 与文档治理参考。其布局单独列出，不应被宣传为 Notemd 已交付功能。
- 工作台和设置页的类型选择器只列出 Notemd 可执行类型。用户选择某一类型后，单个预览面板通过 Notemd 生产 renderer 动态生成对应预览；不会加载或打包 `diagram-design` 原始截图。

## 已交付类型

| 类型 ID | 语义用途 | 默认 target | 兼容 target |
| --- | --- | --- | --- |
| `mermaid-mindmap` | 概念层级 | `mermaid` | `mermaid`、`editable-html-svg`、`drawio`、`html` |
| `drawnix-knowledge-map` | 文件名为根的知识地图 | `drawnix` | `drawnix` |
| `flowchart` | 控制流与决策路径 | `mermaid` | `mermaid`、`editable-html-svg`、`drawio`、`html` |
| `sequence` | 有序参与者交互 | `mermaid` | `mermaid`、`editable-html-svg`、`drawio`、`html` |
| `state` | 状态转换生命周期 | `mermaid` | `mermaid`、`editable-html-svg`、`drawio`、`html` |
| `class` | 类型关系与所有权 | `mermaid` | `mermaid`、`editable-html-svg`、`drawio`、`html` |
| `entity-relationship` | 实体基数与属性 | `mermaid` | `mermaid`、`editable-html-svg`、`drawio`、`html` |
| `canvas-map` | 空间分组概念 | `json-canvas` | `json-canvas` |
| `data-chart` | 共享坐标轴上的度量比较 | `vega-lite` | `vega-lite`、`html` |
| `radar-chart` | 多轴能力画像比较 | `vega-lite` | `vega-lite`、`html` |
| `org-chart` | 责任归属层级与汇报路径 | `mermaid` | `mermaid`、`html` |
| `timeline` | 按时间排序的里程碑 | `mermaid` | `mermaid` |
| `swimlane` | 跨团队职责流转 | `mermaid` | `mermaid` |
| `quadrant` | 双轴优先级矩阵 | `mermaid` | `mermaid` |
| `circuit` | 电气元件与网络 | `circuitikz` | `circuitikz` |

| `bar-chart` | 离散类别数值比较 | `vega-lite` | `vega-lite`、`html` |
| `line-chart` | 有序轴上的连续趋势 | `vega-lite` | `vega-lite`、`html` |
| `scatter-plot` | 相关性与成对数值分布 | `vega-lite` | `vega-lite`、`html` |
| `architecture` | 有界系统拓扑 | `editable-html-svg` | `editable-html-svg`、`html` |
| `current-state` | 旧 IT 景观与手工交接 | `editable-html-svg` | `editable-html-svg`、`html` |
| `integration-topology` | 源系统/平台/消费者集成面 | `editable-html-svg` | `editable-html-svg`、`html` |
| `data-flow` | 按角色分区的带类型数据管线 | `editable-html-svg` | `editable-html-svg`、`html` |
| `access-matrix` | 角色到组件的权限契约 | `editable-html-svg` | `editable-html-svg`、`html` |
| `gantt` | 任务与里程碑计划 | `editable-html-svg` | `editable-html-svg`、`html` |
| `layer-stack` | 有序抽象分层 | `editable-html-svg` | `editable-html-svg`、`html` |
| `venn` | 显式集合重叠 | `editable-html-svg` | `editable-html-svg`、`html` |
| `ranked-funnel` | 排名层级或转化漏斗 | `editable-html-svg` | `editable-html-svg`、`html` |
| `loop` | 带共享状态的强化闭环 | `editable-html-svg` | `editable-html-svg`、`html` |
| `nested` | 包含关系与范围边界 | `editable-html-svg` | `editable-html-svg`、`html` |
| `tree` | 父子层级关系 | `editable-html-svg` | `editable-html-svg`、`html` |
| `process` | 多角色分阶段流程 | `editable-html-svg` | `editable-html-svg`、`html` |
| `medallion` | 数据质量晋级分层 | `editable-html-svg` | `editable-html-svg`、`html` |
| `high-level` | 端到端平台概览 | `editable-html-svg` | `editable-html-svg`、`html` |

## 预览示例

### Mermaid mindmap

![研究主题](./assets/diagrams/mermaid-mindmap-basics.png)

### Drawnix 知识地图

![图形交付架构](./assets/diagrams/drawnix-knowledge-map-architecture.png)

### Flowchart

![发布决策](./assets/diagrams/flowchart-release.png)

### Sequence

![Artifact 请求](./assets/diagrams/sequence-request.png)

### State diagram

![Artifact 生命周期](./assets/diagrams/state-lifecycle.png)

### Class diagram

![图形域](./assets/diagrams/class-domain.png)

### Entity relationship

![Artifact schema](./assets/diagrams/entity-relationship-schema.png)

### JSON Canvas 地图

![图形域分组](./assets/diagrams/canvas-map-domains.png)

### Vega-Lite 数据图

![渲染趋势](./assets/diagrams/data-chart-trend.png)

### Vega-Lite 雷达图

![能力画像](./assets/diagrams/radar-capability-profile.png)

### 组织架构图

![支持责任归属](./assets/diagrams/org-chart-support-ownership.png)

### Timeline

![交付路线图](./assets/diagrams/timeline-roadmap.png)

### Swimlane

![发布交接](./assets/diagrams/swimlane-release.png)

### Quadrant

![优先级矩阵](./assets/diagrams/quadrant-priorities.png)

### Circuitikz 电路图

![CMOS 反相器](./assets/diagrams/circuit-cmos-inverter.png)

### Bar 图

![功能采用率](./assets/diagrams/bar-chart-adoption.png)

### Line 图

![渲染时间趋势](./assets/diagrams/line-chart-render-time.png)

### Scatter 图

![质量与延迟](./assets/diagrams/scatter-plot-quality.png)

### 系统架构

![平台架构](./assets/diagrams/architecture-platform.png)

### 当前状态

![旧系统当前状态](./assets/diagrams/current-state-legacy-pipeline.png)

### 集成拓扑

![集成拓扑](./assets/diagrams/integration-topology-platform.png)

### 数据流

![按角色分区的数据流](./assets/diagrams/data-flow-platform.png)

### 访问矩阵

![平台访问矩阵](./assets/diagrams/access-matrix-platform.png)

### 甘特计划

![发布计划](./assets/diagrams/gantt-release-plan.png)

### 分层栈

![平台分层](./assets/diagrams/layer-stack-platform.png)

### 集合重叠

![平台适配度](./assets/diagrams/venn-platform.png)

### 排名漏斗

![发布漏斗](./assets/diagrams/ranked-funnel-release.png)

### 运行闭环

![运行闭环](./assets/diagrams/loop-operating-model.png)

### 嵌套范围

![范围级联](./assets/diagrams/nested-scope.png)

### 树形层级

![责任树](./assets/diagrams/tree-ownership.png)

### 流程

![发布流程](./assets/diagrams/process-release.png)

### 数据质量分层

![数据质量层](./assets/diagrams/medallion-data-quality.png)

### 高层概览

![高层平台](./assets/diagrams/high-level-platform.png)

## 仅参考布局

以下 5 个 ID 仍来自 `ref/diagram-design`，仅用于开发期 taxonomy 对比和未来准入讨论。它们统一使用 `diagram-design:*` 命名空间，固定参考 revision `09df49d8d1a1c7fb2efdfcdc7a2a0713534350a6`，不会进入运行时 intent 选择器或插件 UI；参考仓库不会打包，原始截图也不会显示：

`flowchart`、`sequence`、`state-machine`、`er-data-model`、`pyramid-funnel`。

将某个布局升级为交付能力，必须同时具备语义输入契约、生产 renderer、fixture、target/export 矩阵、无障碍检查和确定性的 gallery 输出。仅仅“看起来像参考项目”不能证明已经支持。
