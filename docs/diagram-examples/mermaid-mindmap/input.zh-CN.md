# 研究主题

用途：用于展示读者按树形查看的单一主题层级。

请求图表类型：`mermaid-mindmap`
请求渲染目标：`mermaid`
Canonical payload kind：`legacy`
语义 intent：`mindmap`

## 源事实

- spec.nodes[1]: {"id":"research","label":"Research","children":[{"id":"methods","label":"Methods","children":[{"id":"evaluation","label":"Evaluation"}]},{"id":"evidence","label":"Evidence"}]}

## 阅读线索

- 确认根主题与子主题层级清晰。
- 确认细节节点仍属于正确的主题分支。
- 优先检查这条证据：spec.nodes[1]: {"id":"research","label":"Research","children":[{"id":"methods","label":"Methods","children":[{"id":"evaluation","label":"Evaluation"}]},{"id":"evidence","label":"Evidence"}]}

这是输入示例；对应输出是带有 provider 元数据记录的真实 Vault 实测证据。
