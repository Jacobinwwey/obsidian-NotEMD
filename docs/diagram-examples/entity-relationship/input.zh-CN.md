# Artifact schema

用途：当实体属性和基数关系承载主要解释时使用。

请求图表类型：`entity-relationship`
请求渲染目标：`mermaid`
Canonical payload kind：`legacy`
语义 intent：`erDiagram`

## 源事实

- spec.nodes[1]: {"id":"artifact","label":"Artifact","children":[{"id":"artifact-id","label":"id","kind":"uuid"}]}
- spec.nodes[2]: {"id":"panel","label":"Panel","children":[{"id":"panel-id","label":"id","kind":"uuid"}]}
- spec.edges[1]: {"from":"artifact","to":"panel","relation":"one-to-many","label":"contains"}

## 阅读线索

- 确认实体及属性仍成组显示。
- 确认 one-to-many 等基数关系可读。
- 优先检查这条证据：spec.nodes[1]: {"id":"artifact","label":"Artifact","children":[{"id":"artifact-id","label":"id","kind":"uuid"}]}

这是输入示例；对应输出是带有 provider 元数据记录的真实 Vault 实测证据。
