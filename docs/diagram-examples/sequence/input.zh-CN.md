# Artifact 请求

用途：当独立参与者之间的交互顺序最重要时使用。

请求图表类型：`sequence`
请求渲染目标：`mermaid`
Canonical payload kind：`legacy`
语义 intent：`sequence`

## 源事实

- spec.nodes[1]: {"id":"user","label":"User"}
- spec.nodes[2]: {"id":"plugin","label":"Plugin"}
- spec.nodes[3]: {"id":"renderer","label":"Renderer"}
- spec.edges[1]: {"from":"user","to":"plugin","label":"generate"}
- spec.edges[2]: {"from":"plugin","to":"renderer","label":"render"}
- spec.edges[3]: {"from":"renderer","to":"plugin","label":"artifact"}

## 阅读线索

- 确认参与者顺序保持不变。
- 确认请求、渲染和返回方向清楚。
- 优先检查这条证据：spec.nodes[1]: {"id":"user","label":"User"}

这是输入示例；对应输出是带有 provider 元数据记录的真实 Vault 实测证据。
