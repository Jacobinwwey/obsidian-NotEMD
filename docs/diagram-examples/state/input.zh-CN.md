# Artifact 生命周期

用途：用于展示系统在命名状态之间的变化。

请求图表类型：`state`
请求渲染目标：`mermaid`
Canonical payload kind：`legacy`
语义 intent：`stateDiagram`

## 源事实

- spec.nodes[1]: {"id":"draft","label":"Draft"}
- spec.nodes[2]: {"id":"validated","label":"Validated"}
- spec.nodes[3]: {"id":"published","label":"Published"}
- spec.edges[1]: {"from":"draft","to":"validated","label":"validate"}
- spec.edges[2]: {"from":"validated","to":"published","label":"publish"}

## 阅读线索

- 确认状态节点完整。
- 确认转换标签与方向表达生命周期。
- 优先检查这条证据：spec.nodes[1]: {"id":"draft","label":"Draft"}

这是输入示例；对应输出是带有 provider 元数据记录的真实 Vault 实测证据。
