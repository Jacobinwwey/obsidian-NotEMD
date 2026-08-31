# 图形域分组

用途：用于相关领域的空间概览。

请求图表类型：`canvas-map`
请求渲染目标：`json-canvas`

## 源事实

- spec.edges[1]: authoring -> rendering
- spec.edges[2]: rendering -> delivery
- spec.nodes[1]: authoring (Authoring)
- spec.nodes[1].id: authoring
- spec.nodes[2]: rendering (Rendering)
- spec.nodes[2].id: rendering
- spec.nodes[3]: delivery (Delivery)
- spec.nodes[3].id: delivery

## 阅读线索

- 确认相关概念形成空间分组。
- 确认连接表达领域之间的关系。
- 优先检查这条证据：spec.edges[1]: authoring -> rendering

这是输入示例；对应输出是带有 provider 元数据记录的真实 Vault 实测证据。
