# 旧系统当前状态

用途：用于暴露现状景观、手工交接和瓶颈。

请求图表类型：`current-state`
请求渲染目标：`editable-html-svg`

## 源事实

- spec.payload.edges[1]: forms -> drive (CSV)
- spec.payload.edges[2]: drive -> analyst (COPY)
- spec.payload.edges[3]: analyst -> portal (XLSX)
- spec.payload.edges[4]: portal -> partners (download)
- spec.payload.kind: topology
- spec.payload.zones[1]: collect (Collection)
- spec.payload.zones[1].id: collect
- spec.payload.zones[1].sub: siloed inputs
- spec.payload.zones[2]: process (Processing)
- spec.payload.zones[2].id: process
- spec.payload.zones[2].sub: manual transformation
- spec.payload.zones[3]: publish (Dissemination)
- spec.payload.zones[3].id: publish
- spec.payload.zones[3].sub: fragile outputs
- spec.payload.nodes[1]: forms (Survey forms)
- spec.payload.nodes[1].id: forms
- spec.payload.nodes[1].zoneId: collect
- spec.payload.nodes[1].sub: CSV exports
- spec.payload.nodes[2]: drive (Shared drive)
- spec.payload.nodes[2].id: drive
- spec.payload.nodes[2].zoneId: process
- spec.payload.nodes[2].sub: no version control
- spec.payload.nodes[2].focal: true
- spec.payload.nodes[3]: analyst (Analyst machines)

## 阅读线索

- 确认旧系统和阶段边界完整。
- 确认手工交接与瓶颈位置可见。
- 优先检查这条证据：spec.payload.edges[1]: forms -> drive (CSV)

这是输入示例；对应输出是带有 provider 元数据记录的真实 Vault 实测证据。
