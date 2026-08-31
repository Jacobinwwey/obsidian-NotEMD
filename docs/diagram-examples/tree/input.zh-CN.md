# 责任树

用途：用于单根父子层级。

请求图表类型：`tree`
请求渲染目标：`editable-html-svg`
Canonical payload kind：`tree`
语义 intent：`tree`

## 源事实

- Canonical response shape：`{ "nodes": [], "edges": [], "payload": { "kind": "tree", "nodes": [{ "id": "root", "label": "..." }, { "id": "child", "label": "...", "parentId": "root" }] } }`。
- 顶层 nodes 和 edges 必须保持为空数组。
- payload.kind 必须是 `tree`；所有树节点放在 payload.nodes 中，且每个非根节点都必须有有效的 parentId。

- spec.payload.nodes[1]: {"id":"platform","label":"Platform","focal":true}
- spec.payload.nodes[2]: {"id":"authoring","label":"Authoring","parentId":"platform"}
- spec.payload.nodes[3]: {"id":"rendering","label":"Rendering","parentId":"platform"}
- spec.payload.nodes[4]: {"id":"delivery","label":"Delivery","parentId":"platform"}
- spec.payload.nodes[5]: {"id":"preview","label":"Preview","parentId":"rendering"}
- spec.payload.nodes[6]: {"id":"export","label":"Export","parentId":"delivery"}
- spec.payload.kind: tree

## 阅读线索

- 确认只有一个根节点。
- 确认每个子节点拥有正确父节点。
- 优先检查这条证据：spec.payload.nodes[1]: {"id":"platform","label":"Platform","focal":true}

这是输入示例；对应输出是带有 provider 元数据记录的真实 Vault 实测证据。
