# 优先级矩阵

用途：用于带有可比较项目位置的有界双轴优先级。

请求图表类型：`quadrant`
请求渲染目标：`mermaid`
Canonical payload kind：`quadrant`
语义 intent：`quadrant`

## 源事实

- spec.quadrant.items[1]: {"id":"adapter","label":"Adapter registry","x":0.78,"y":0.84,"detail":"high leverage"}
- spec.quadrant.items[2]: {"id":"docs","label":"Docs gallery","x":0.32,"y":0.68}
- spec.quadrant.items[3]: {"id":"cleanup","label":"Cleanup pass","x":0.24,"y":0.28}
- spec.quadrant.xAxisLabel: Low effort, High effort
- spec.quadrant.yAxisLabel: Low impact, High impact
- spec.quadrant.quadrantLabels: Invest, Quick wins, Defer, Evaluate

## 阅读线索

- 确认横轴和纵轴方向清晰。
- 确认项目位置对应源文档的判断。
- 优先检查这条证据：spec.quadrant.items[1]: {"id":"adapter","label":"Adapter registry","x":0.78,"y":0.84,"detail":"high leverage"}

这是输入示例；对应输出是带有 provider 元数据记录的真实 Vault 实测证据。
