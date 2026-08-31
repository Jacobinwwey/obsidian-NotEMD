# 发布漏斗

用途：用于有界分段的排名层级或转化流失。

请求图表类型：`ranked-funnel`
请求渲染目标：`editable-html-svg`
Canonical payload kind：`ranked-segments`
语义 intent：`rankedFunnel`

## 源事实

- spec.payload.segments[1]: {"id":"ideas","label":"Ideas","sub":"captured"}
- spec.payload.segments[2]: {"id":"specs","label":"Specs","sub":"approved"}
- spec.payload.segments[3]: {"id":"builds","label":"Builds","sub":"verified"}
- spec.payload.segments[4]: {"id":"releases","label":"Releases","sub":"published","focal":true}
- spec.payload.kind: ranked-segments
- spec.payload.orientation: funnel

## 阅读线索

- 确认阶段顺序保持。
- 确认每个漏斗段表达排名或转化关系。
- 优先检查这条证据：spec.payload.segments[1]: {"id":"ideas","label":"Ideas","sub":"captured"}

这是输入示例；对应输出是带有 provider 元数据记录的真实 Vault 实测证据。
