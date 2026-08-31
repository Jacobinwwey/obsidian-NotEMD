# 运行闭环

用途：用于各站点把持久状态写回同一中心的强化循环。

请求图表类型：`loop`
请求渲染目标：`editable-html-svg`

## 源事实

- spec.payload.kind: cycle
- spec.payload.hub.label: Shared record
- spec.payload.hub.sub: one durable operating memory
- spec.payload.stations[1]: capture (Capture)
- spec.payload.stations[1].id: capture
- spec.payload.stations[1].sub: signals
- spec.payload.stations[2]: research (Research)
- spec.payload.stations[2].id: research
- spec.payload.stations[2].sub: evidence
- spec.payload.stations[3]: decide (Decide)
- spec.payload.stations[3].id: decide
- spec.payload.stations[3].sub: approve
- spec.payload.stations[3].focal: true
- spec.payload.stations[4]: act (Act)
- spec.payload.stations[4].id: act
- spec.payload.stations[4].sub: ship
- spec.payload.stations[5]: measure (Measure)
- spec.payload.stations[5].id: measure
- spec.payload.stations[5].sub: outcomes
- spec.payload.stations[6]: learn (Learn)
- spec.payload.stations[6].id: learn
- spec.payload.stations[6].sub: update playbook

## 阅读线索

- 确认循环方向首尾闭合。
- 确认共享状态中心与各站点关系清楚。
- 优先检查这条证据：spec.payload.kind: cycle

这是输入示例；对应输出是带有 provider 元数据记录的真实 Vault 实测证据。
