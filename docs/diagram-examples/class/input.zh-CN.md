# 图形域

用途：用于表达类型级别的所有权和关联。

请求图表类型：`class`
请求渲染目标：`mermaid`
Canonical payload kind：`legacy`
语义 intent：`classDiagram`

## 源事实

- spec.nodes[1]: {"id":"spec","label":"DiagramSpec"}
- spec.nodes[2]: {"id":"renderer","label":"DiagramRenderer"}
- spec.edges[1]: {"from":"spec","to":"renderer","label":"renders with"}

## 阅读线索

- 确认类型关系保持。
- 确认关联标签没有被误读成执行顺序。
- 优先检查这条证据：spec.nodes[1]: {"id":"spec","label":"DiagramSpec"}

这是输入示例；对应输出是带有 provider 元数据记录的真实 Vault 实测证据。
