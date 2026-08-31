# 质量与延迟

用途：用于关注相关性或离群点的成对数值观测。

请求图表类型：`scatter-plot`
请求渲染目标：`vega-lite`

## 源事实

- spec.payload.kind: quantitative
- spec.payload.chartType: scatter
- spec.payload.series[1]: samples (Samples)
- spec.payload.series[1].id: samples
- spec.payload.series[1].points[1].x: 1
- spec.payload.series[1].points[1].y: 12
- spec.payload.series[1].points[2].x: 2
- spec.payload.series[1].points[2].y: 15
- spec.payload.series[1].points[3].x: 3
- spec.payload.series[1].points[3].y: 18
- spec.payload.series[1].points[4].x: 4
- spec.payload.series[1].points[4].y: 20
- spec.payload.series[1].points[5].x: 5
- spec.payload.series[1].points[5].y: 23
- spec.payload.series[1].points[6].x: 6
- spec.payload.series[1].points[6].y: 29
- spec.dataSeries[1]: samples (Samples)
- spec.dataSeries[1].id: samples
- spec.dataSeries[1].points[1].x: 1
- spec.dataSeries[1].points[1].y: 12
- spec.dataSeries[1].points[2].x: 2
- spec.dataSeries[1].points[2].y: 15
- spec.dataSeries[1].points[3].x: 3
- spec.dataSeries[1].points[3].y: 18

## 阅读线索

- 确认每个点保留一对数值。
- 确认离群点没有被隐藏。
- 优先检查这条证据：spec.payload.kind: quantitative

这是输入示例；对应输出是带有 provider 元数据记录的真实 Vault 实测证据。
