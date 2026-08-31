# 平台适配度

用途：当解释依赖两个或三个显式集合的重叠时使用。

请求图表类型：`venn`
请求渲染目标：`editable-html-svg`

## 源事实

- spec.payload.kind: set-overlap
- spec.payload.sets[1]: reliable (Reliable)
- spec.payload.sets[1].id: reliable
- spec.payload.sets[2]: editable (Editable)
- spec.payload.sets[2].id: editable
- spec.payload.sets[3]: discoverable (Discoverable)
- spec.payload.sets[3].id: discoverable
- spec.payload.intersections[1]: core (Production capability)
- spec.payload.intersections[1].id: core
- spec.payload.intersections[1].setIds: reliable, editable, discoverable
- spec.payload.intersections[1].focal: true
- spec.payload.intersections[2]: re (Evidence)
- spec.payload.intersections[2].id: re
- spec.payload.intersections[2].setIds: reliable, editable

## 阅读线索

- 确认集合名称和边界清楚。
- 确认交集只包含源事实支持的内容。
- 优先检查这条证据：spec.payload.kind: set-overlap

这是输入示例；对应输出是带有 provider 元数据记录的真实 Vault 实测证据。
