# 平台架构

用途：用于按信任边界或系统边界分组的有界组件。

请求图表类型：`architecture`
请求渲染目标：`editable-html-svg`

## 源事实

- spec.payload.edges[1]: web -> api (request)
- spec.payload.edges[2]: api -> worker (dispatch)
- spec.payload.edges[3]: worker -> store (write)
- spec.payload.edges[4]: worker -> history (record)
- spec.payload.kind: topology
- spec.payload.zones[1]: experience (Experience)
- spec.payload.zones[1].id: experience
- spec.payload.zones[1].sub: public and operator surfaces
- spec.payload.zones[2]: services (Services)
- spec.payload.zones[2].id: services
- spec.payload.zones[2].sub: orchestration and policy
- spec.payload.zones[3]: data (Data)
- spec.payload.zones[3].id: data
- spec.payload.zones[3].sub: durable state
- spec.payload.nodes[1]: web (Web client)
- spec.payload.nodes[1].id: web
- spec.payload.nodes[1].zoneId: experience
- spec.payload.nodes[1].sub: HTTPS
- spec.payload.nodes[1].external: true
- spec.payload.nodes[2]: api (API gateway)
- spec.payload.nodes[2].id: api
- spec.payload.nodes[2].zoneId: services
- spec.payload.nodes[2].sub: REST / auth
- spec.payload.nodes[2].focal: true

## 阅读线索

- 确认组件位于正确边界。
- 确认拓扑连接方向和焦点组件清晰。
- 优先检查这条证据：spec.payload.edges[1]: web -> api (request)

这是输入示例；对应输出是带有 provider 元数据记录的真实 Vault 实测证据。
