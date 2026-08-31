# 高层平台

用途：用于在深入拓扑细节前查看有界端到端概览。

请求图表类型：`high-level`
请求渲染目标：`editable-html-svg`

## 源事实

- spec.payload.edges[1]: users -> api
- spec.payload.edges[2]: api -> jobs
- spec.payload.edges[3]: jobs -> store
- spec.payload.edges[4]: policy -> api
- spec.payload.kind: topology
- spec.payload.zones[1]: experience (Experience)
- spec.payload.zones[1].id: experience
- spec.payload.zones[2]: services (Services)
- spec.payload.zones[2].id: services
- spec.payload.zones[3]: data (Data)
- spec.payload.zones[3].id: data
- spec.payload.zones[4]: governance (Governance)
- spec.payload.zones[4].id: governance
- spec.payload.nodes[1]: users (Users)
- spec.payload.nodes[1].id: users
- spec.payload.nodes[1].zoneId: experience
- spec.payload.nodes[1].external: true
- spec.payload.nodes[2]: api (API)
- spec.payload.nodes[2].id: api
- spec.payload.nodes[2].zoneId: services
- spec.payload.nodes[2].focal: true
- spec.payload.nodes[3]: jobs (Jobs)
- spec.payload.nodes[3].id: jobs
- spec.payload.nodes[3].zoneId: services

## 阅读线索

- 确认体验、服务、数据和治理边界齐全。
- 确认概览保持端到端关系而不过度展开。
- 优先检查这条证据：spec.payload.edges[1]: users -> api

这是输入示例；对应输出是带有 provider 元数据记录的真实 Vault 实测证据。
