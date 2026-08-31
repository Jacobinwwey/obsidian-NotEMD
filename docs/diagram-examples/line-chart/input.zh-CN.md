# 渲染时间趋势

用途：用于有序时间或版本趋势。

请求图表类型：`line-chart`
请求渲染目标：`vega-lite`

## 源事实

- spec.payload.kind: quantitative
- spec.payload.chartType: line
- spec.payload.series[1]: render-time (Render time)
- spec.payload.series[1].id: render-time
- spec.payload.series[1].points[1].x: v1
- spec.payload.series[1].points[1].y: 22
- spec.payload.series[1].points[2].x: v2
- spec.payload.series[1].points[2].y: 19
- spec.payload.series[1].points[3].x: v3
- spec.payload.series[1].points[3].y: 16
- spec.payload.series[1].points[4].x: v4
- spec.payload.series[1].points[4].y: 12
- spec.dataSeries[1]: render-time (Render time)
- spec.dataSeries[1].id: render-time
- spec.dataSeries[1].points[1].x: v1
- spec.dataSeries[1].points[1].y: 22
- spec.dataSeries[1].points[2].x: v2
- spec.dataSeries[1].points[2].y: 19
- spec.dataSeries[1].points[3].x: v3
- spec.dataSeries[1].points[3].y: 16
- spec.dataSeries[1].points[4].x: v4
- spec.dataSeries[1].points[4].y: 12

## 阅读线索

- 确认横轴顺序保持。
- 确认折线表达连续趋势而非类别排名。
- 优先检查这条证据：spec.payload.kind: quantitative

这是输入示例；对应输出是带有 provider 元数据记录的真实 Vault 实测证据。
