# 图表示例与实机证据

语言：[English](./README.md) | **简体中文**

这里的示例由运行中的 Notemd 插件和已配置 provider 实测生成。它们与 [静态 fixture gallery](../diagram-gallery.zh-CN.md) 分开：gallery 证明确定性预览覆盖，本目录记录真实 Vault 实测证据。

- [机器可读 manifest](./manifest.json)
- 输入笔记同时提供英文和简体中文版本。
- `passed` 表示真实 provider 运行完成并复制了至少一个 Artifact/视觉结果。`failed` 和 `unavailable` 会保留为明确限制。
- 运行结束后，生成器会清理专属临时 Vault 前缀；不会删除用户已有笔记。

## 1.9.7 回归证据

`quadrant` 实测确认 provider 误复制的结构性括号会从数据点标签中移除，而标题类元数据中有意使用的标点保持不变。`data-flow` 实测确认摘要/标题区域、lane 单元格、连接线和边标签分别占用测量后的区域；跨 lane 路由为正交路径并避开已占用单元格。这些条目都来自重新加载后的插件 bundle 实机运行，不是手工编辑的截图。

## 示例目录

### [研究主题](./mermaid-mindmap/input.zh-CN.md)

- 类型：`mermaid-mindmap`；target：`mermaid`；状态：`passed`
- [中文输入](./mermaid-mindmap/input.zh-CN.md)
- [SVG 结果](./mermaid-mindmap/result.svg)
- ![研究主题](./mermaid-mindmap/result.png)

### [图形交付架构](./drawnix-knowledge-map/input.zh-CN.md)

- 类型：`drawnix-knowledge-map`；target：`drawnix`；状态：`passed`
- [中文输入](./drawnix-knowledge-map/input.zh-CN.md)
- [SVG 结果](./drawnix-knowledge-map/result.svg)
- ![图形交付架构](./drawnix-knowledge-map/result.png)

### [发布决策](./flowchart/input.zh-CN.md)

- 类型：`flowchart`；target：`mermaid`；状态：`passed`
- [中文输入](./flowchart/input.zh-CN.md)
- [SVG 结果](./flowchart/result.svg)
- ![发布决策](./flowchart/result.png)

### [Artifact 请求](./sequence/input.zh-CN.md)

- 类型：`sequence`；target：`mermaid`；状态：`passed`
- [中文输入](./sequence/input.zh-CN.md)
- [SVG 结果](./sequence/result.svg)
- ![Artifact 请求](./sequence/result.png)

### [Artifact 生命周期](./state/input.zh-CN.md)

- 类型：`state`；target：`mermaid`；状态：`passed`
- [中文输入](./state/input.zh-CN.md)
- [SVG 结果](./state/result.svg)
- ![Artifact 生命周期](./state/result.png)

### [图形域](./class/input.zh-CN.md)

- 类型：`class`；target：`mermaid`；状态：`passed`
- [中文输入](./class/input.zh-CN.md)
- [SVG 结果](./class/result.svg)
- ![图形域](./class/result.png)

### [Artifact schema](./entity-relationship/input.zh-CN.md)

- 类型：`entity-relationship`；target：`mermaid`；状态：`passed`
- [中文输入](./entity-relationship/input.zh-CN.md)
- [SVG 结果](./entity-relationship/result.svg)
- ![Artifact schema](./entity-relationship/result.png)

### [图形域分组](./canvas-map/input.zh-CN.md)

- 类型：`canvas-map`；target：`json-canvas`；状态：`passed`
- [中文输入](./canvas-map/input.zh-CN.md)
- [SVG 结果](./canvas-map/result.svg)
- ![图形域分组](./canvas-map/result.png)

### [渲染趋势](./data-chart/input.zh-CN.md)

- 类型：`data-chart`；target：`vega-lite`；状态：`passed`
- [中文输入](./data-chart/input.zh-CN.md)
- [SVG 结果](./data-chart/result.svg)
- ![渲染趋势](./data-chart/result.png)

### [能力画像](./radar-chart/input.zh-CN.md)

- 类型：`radar-chart`；target：`vega-lite`；状态：`passed`
- [中文输入](./radar-chart/input.zh-CN.md)
- [SVG 结果](./radar-chart/result.svg)
- ![能力画像](./radar-chart/result.png)

### [支持责任归属](./org-chart/input.zh-CN.md)

- 类型：`org-chart`；target：`mermaid`；状态：`passed`
- [中文输入](./org-chart/input.zh-CN.md)
- [SVG 结果](./org-chart/result.svg)
- ![支持责任归属](./org-chart/result.png)

### [交付路线图](./timeline/input.zh-CN.md)

- 类型：`timeline`；target：`mermaid`；状态：`passed`
- [中文输入](./timeline/input.zh-CN.md)
- [SVG 结果](./timeline/result.svg)
- ![交付路线图](./timeline/result.png)

### [发布交接](./swimlane/input.zh-CN.md)

- 类型：`swimlane`；target：`mermaid`；状态：`passed`
- [中文输入](./swimlane/input.zh-CN.md)
- [SVG 结果](./swimlane/result.svg)
- ![发布交接](./swimlane/result.png)

### [优先级矩阵](./quadrant/input.zh-CN.md)

- 类型：`quadrant`；target：`mermaid`；状态：`passed`
- [中文输入](./quadrant/input.zh-CN.md)
- [SVG 结果](./quadrant/result.svg)
- ![优先级矩阵](./quadrant/result.png)

### [CMOS 反相器](./circuit/input.zh-CN.md)

- 类型：`circuit`；target：`circuitikz`；状态：`passed`
- [中文输入](./circuit/input.zh-CN.md)
- [SVG 结果](./circuit/result.svg)
- ![CMOS 反相器](./circuit/result.png)

### [功能采用率](./bar-chart/input.zh-CN.md)

- 类型：`bar-chart`；target：`vega-lite`；状态：`passed`
- [中文输入](./bar-chart/input.zh-CN.md)
- [SVG 结果](./bar-chart/result.svg)
- ![功能采用率](./bar-chart/result.png)

### [渲染时间趋势](./line-chart/input.zh-CN.md)

- 类型：`line-chart`；target：`vega-lite`；状态：`passed`
- [中文输入](./line-chart/input.zh-CN.md)
- [SVG 结果](./line-chart/result.svg)
- ![渲染时间趋势](./line-chart/result.png)

### [质量与延迟](./scatter-plot/input.zh-CN.md)

- 类型：`scatter-plot`；target：`vega-lite`；状态：`passed`
- [中文输入](./scatter-plot/input.zh-CN.md)
- [SVG 结果](./scatter-plot/result.svg)
- ![质量与延迟](./scatter-plot/result.png)

### [平台架构](./architecture/input.zh-CN.md)

- 类型：`architecture`；target：`editable-html-svg`；状态：`passed`
- [中文输入](./architecture/input.zh-CN.md)
- [SVG 结果](./architecture/result.svg)
- ![平台架构](./architecture/result.png)

### [旧系统当前状态](./current-state/input.zh-CN.md)

- 类型：`current-state`；target：`editable-html-svg`；状态：`passed`
- [中文输入](./current-state/input.zh-CN.md)
- [SVG 结果](./current-state/result.svg)
- ![旧系统当前状态](./current-state/result.png)

### [集成拓扑](./integration-topology/input.zh-CN.md)

- 类型：`integration-topology`；target：`editable-html-svg`；状态：`passed`
- [中文输入](./integration-topology/input.zh-CN.md)
- [SVG 结果](./integration-topology/result.svg)
- ![集成拓扑](./integration-topology/result.png)

### [按角色分区的数据流](./data-flow/input.zh-CN.md)

- 类型：`data-flow`；target：`editable-html-svg`；状态：`passed`
- [中文输入](./data-flow/input.zh-CN.md)
- [SVG 结果](./data-flow/result.svg)
- ![按角色分区的数据流](./data-flow/result.png)

### [平台访问矩阵](./access-matrix/input.zh-CN.md)

- 类型：`access-matrix`；target：`editable-html-svg`；状态：`passed`
- [中文输入](./access-matrix/input.zh-CN.md)
- [SVG 结果](./access-matrix/result.svg)
- ![平台访问矩阵](./access-matrix/result.png)

### [发布计划](./gantt/input.zh-CN.md)

- 类型：`gantt`；target：`editable-html-svg`；状态：`passed`
- [中文输入](./gantt/input.zh-CN.md)
- [SVG 结果](./gantt/result.svg)
- ![发布计划](./gantt/result.png)

### [平台分层](./layer-stack/input.zh-CN.md)

- 类型：`layer-stack`；target：`editable-html-svg`；状态：`passed`
- [中文输入](./layer-stack/input.zh-CN.md)
- [SVG 结果](./layer-stack/result.svg)
- ![平台分层](./layer-stack/result.png)

### [平台适配度](./venn/input.zh-CN.md)

- 类型：`venn`；target：`editable-html-svg`；状态：`passed`
- [中文输入](./venn/input.zh-CN.md)
- [SVG 结果](./venn/result.svg)
- ![平台适配度](./venn/result.png)

### [发布漏斗](./ranked-funnel/input.zh-CN.md)

- 类型：`ranked-funnel`；target：`editable-html-svg`；状态：`passed`
- [中文输入](./ranked-funnel/input.zh-CN.md)
- [SVG 结果](./ranked-funnel/result.svg)
- ![发布漏斗](./ranked-funnel/result.png)

### [运行闭环](./loop/input.zh-CN.md)

- 类型：`loop`；target：`editable-html-svg`；状态：`passed`
- [中文输入](./loop/input.zh-CN.md)
- [SVG 结果](./loop/result.svg)
- ![运行闭环](./loop/result.png)

### [范围级联](./nested/input.zh-CN.md)

- 类型：`nested`；target：`editable-html-svg`；状态：`passed`
- [中文输入](./nested/input.zh-CN.md)
- [SVG 结果](./nested/result.svg)
- ![范围级联](./nested/result.png)

### [责任树](./tree/input.zh-CN.md)

- 类型：`tree`；target：`editable-html-svg`；状态：`passed`
- [中文输入](./tree/input.zh-CN.md)
- [SVG 结果](./tree/result.svg)
- ![责任树](./tree/result.png)

### [发布流程](./process/input.zh-CN.md)

- 类型：`process`；target：`editable-html-svg`；状态：`passed`
- [中文输入](./process/input.zh-CN.md)
- [SVG 结果](./process/result.svg)
- ![发布流程](./process/result.png)

### [数据质量层](./medallion/input.zh-CN.md)

- 类型：`medallion`；target：`editable-html-svg`；状态：`passed`
- [中文输入](./medallion/input.zh-CN.md)
- [SVG 结果](./medallion/result.svg)
- ![数据质量层](./medallion/result.png)

### [高层平台](./high-level/input.zh-CN.md)

- 类型：`high-level`；target：`editable-html-svg`；状态：`passed`
- [中文输入](./high-level/input.zh-CN.md)
- [SVG 结果](./high-level/result.svg)
- ![高层平台](./high-level/result.png)
