# 图形交付架构

用途：当层级和跨分支关系都必须保持可编辑时使用。

请求图表类型：`drawnix-knowledge-map`
请求渲染目标：`drawnix`
Canonical payload kind：`drawnix-knowledge-map`
语义 intent：`drawnixMindmap`

## 源事实

- spec.nodes[1]: {"id":"architecture-zh-cn","label":"architecture.zh-CN","kind":"document","children":[{"id":"ui-entrypoints","label":"Obsidian UI","kind":"subsystem","children":[{"id":"command-palette","label":"Command...
- spec.edges[1]: {"from":"command-palette","to":"command-dispatch","label":"starts"}
- spec.edges[2]: {"from":"sidebar","to":"command-dispatch","label":"starts"}
- spec.edges[3]: {"from":"settings","to":"settings-store","label":"updates"}
- spec.edges[4]: {"from":"command-dispatch","to":"diagram-operation","label":"routes"}
- spec.edges[5]: {"from":"diagram-operation","to":"source-coverage","label":"covers source"}
- spec.edges[6]: {"from":"source-coverage","to":"diagram-spec","label":"builds"}
- spec.edges[7]: {"from":"diagram-spec","to":"drawnix-renderer","label":"renders"}
- spec.edges[8]: {"from":"drawnix-renderer","to":"drawnix-file","label":"writes"}
- spec.edges[9]: {"from":"drawnix-renderer","to":"svg-companion","label":"previews"}
- spec.edges[10]: {"from":"drawnix-file","to":"markdown-wrapper","label":"links"}
- spec.edges[11]: {"from":"obsidian-cli","to":"maintainer-bridge","label":"executes"}
- spec.edges[12]: {"from":"maintainer-bridge","to":"diagram-operation","label":"invokes"}

## 阅读线索

- 确认文件名根节点保留。
- 确认跨分支关系没有被静默删除。
- 优先检查这条证据：spec.nodes[1]: {"id":"architecture-zh-cn","label":"architecture.zh-CN","kind":"document","children":[{"id":"ui-entrypoints","label":"Obsidian UI","kind":"subsystem","children":[{"id":"command-palette","label":"Command...

这是输入示例；对应输出是带有 provider 元数据记录的真实 Vault 实测证据。
