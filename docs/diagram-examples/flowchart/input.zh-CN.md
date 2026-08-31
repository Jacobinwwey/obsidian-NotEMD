# 发布决策

用途：用于包含明确决策点的有序流程。

请求图表类型：`flowchart`
请求渲染目标：`mermaid`
Canonical payload kind：`legacy`
语义 intent：`flowchart`

## 源事实

- spec.nodes[1]: {"id":"build","label":"Build"}
- spec.nodes[2]: {"id":"tests","label":"Tests"}
- spec.nodes[3]: {"id":"release","label":"Release"}
- spec.edges[1]: {"from":"build","to":"tests"}
- spec.edges[2]: {"from":"tests","to":"release","label":"pass"}

## 阅读线索

- 确认决策节点和结果边方向正确。
- 确认发布路径保留通过条件。
- 优先检查这条证据：spec.nodes[1]: {"id":"build","label":"Build"}

这是输入示例；对应输出是带有 provider 元数据记录的真实 Vault 实测证据。
