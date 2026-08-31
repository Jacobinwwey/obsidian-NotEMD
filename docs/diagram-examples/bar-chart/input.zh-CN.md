# 功能采用率

用途：用于比较离散类别，每类提供一个数值。

请求图表类型：`bar-chart`
请求渲染目标：`vega-lite`

## 源事实

- spec.payload.kind: quantitative
- spec.payload.chartType: bar
- spec.payload.series[1]: adoption (Adoption)
- spec.payload.series[1].id: adoption
- spec.payload.series[1].points[1].x: Search
- spec.payload.series[1].points[1].y: 82
- spec.payload.series[1].points[2].x: Preview
- spec.payload.series[1].points[2].y: 64
- spec.payload.series[1].points[3].x: Export
- spec.payload.series[1].points[3].y: 47
- spec.payload.series[1].points[4].x: History
- spec.payload.series[1].points[4].y: 31
- spec.dataSeries[1]: adoption (Adoption)
- spec.dataSeries[1].id: adoption
- spec.dataSeries[1].points[1].x: Search
- spec.dataSeries[1].points[1].y: 82
- spec.dataSeries[1].points[2].x: Preview
- spec.dataSeries[1].points[2].y: 64
- spec.dataSeries[1].points[3].x: Export
- spec.dataSeries[1].points[3].y: 47
- spec.dataSeries[1].points[4].x: History
- spec.dataSeries[1].points[4].y: 31

## 阅读线索

- 确认每个类别对应一个数值。
- 确认柱高排序与源数据一致。
- 优先检查这条证据：spec.payload.kind: quantitative

这是输入示例；对应输出是带有 provider 元数据记录的真实 Vault 实测证据。
