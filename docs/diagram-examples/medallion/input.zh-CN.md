# 数据质量层

用途：用于具有明确晋级语义的有序数据质量层。

请求图表类型：`medallion`
请求渲染目标：`editable-html-svg`

## 源事实

- spec.payload.kind: ordered-stack
- spec.payload.direction: down
- spec.payload.layers[1]: raw (Raw)
- spec.payload.layers[1].id: raw
- spec.payload.layers[1].sub: landed source
- spec.payload.layers[2]: clean (Clean)
- spec.payload.layers[2].id: clean
- spec.payload.layers[2].sub: validated
- spec.payload.layers[2].focal: true
- spec.payload.layers[3]: curated (Curated)
- spec.payload.layers[3].id: curated
- spec.payload.layers[3].sub: joined and documented
- spec.payload.layers[4]: aggregate (Aggregate)
- spec.payload.layers[4].id: aggregate
- spec.payload.layers[4].sub: consumer-ready
- spec.payload.layers[5]: archive (Archive)
- spec.payload.layers[5].id: archive
- spec.payload.layers[5].sub: retention

## 阅读线索

- 确认质量层按晋级顺序排列。
- 确认焦点层的质量含义明确。
- 优先检查这条证据：spec.payload.kind: ordered-stack

这是输入示例；对应输出是带有 provider 元数据记录的真实 Vault 实测证据。
