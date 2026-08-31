# 平台分层

用途：用于应用、服务和存储等有序抽象层级。

请求图表类型：`layer-stack`
请求渲染目标：`editable-html-svg`

## 源事实

- spec.payload.kind: ordered-stack
- spec.payload.direction: up
- spec.payload.layers[1]: storage (Storage)
- spec.payload.layers[1].id: storage
- spec.payload.layers[1].sub: durable state
- spec.payload.layers[2]: data (Data services)
- spec.payload.layers[2].id: data
- spec.payload.layers[2].sub: query and transform
- spec.payload.layers[3]: runtime (Runtime)
- spec.payload.layers[3].id: runtime
- spec.payload.layers[3].sub: orchestration
- spec.payload.layers[3].focal: true
- spec.payload.layers[4]: experience (Experience)
- spec.payload.layers[4].id: experience
- spec.payload.layers[4].sub: users and agents

## 阅读线索

- 确认层级顺序从上到下稳定。
- 确认焦点层仍处于正确抽象边界。
- 优先检查这条证据：spec.payload.kind: ordered-stack

这是输入示例；对应输出是带有 provider 元数据记录的真实 Vault 实测证据。
