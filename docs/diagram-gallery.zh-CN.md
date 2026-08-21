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

## 仅参考布局

以下 22 个 ID 来自 `ref/diagram-design`，仅用于开发期 taxonomy 对比和未来准入讨论。它们统一使用 `diagram-design:*` 命名空间，固定参考 revision `09df49d8d1a1c7fb2efdfcdc7a2a0713534350a6`，不会进入运行时 intent 选择器或插件 UI；参考仓库不会打包，原始截图也不会显示：

`architecture`、`it-current-state`、`flowchart`、`sequence`、`state-machine`、`er-data-model`、`loop`、`nested`、`tree`、`layer-stack`、`venn`、`pyramid-funnel`、`bar-chart`、`line-chart`、`gantt`、`scatter-plot`、`high-level`、`process`、`medallion`、`data-flow`、`dp-integration`、`dp-security-matrix`。

将某个布局升级为交付能力，必须同时具备语义输入契约、生产 renderer、fixture、target/export 矩阵、无障碍检查和确定性的 gallery 输出。仅仅“看起来像参考项目”不能证明已经支持。
