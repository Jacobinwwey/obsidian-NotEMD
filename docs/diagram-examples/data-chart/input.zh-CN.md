# 渲染趋势

用途：仅在源文档提供适合比较的数值时使用。

请求图表类型：`data-chart`
请求渲染目标：`vega-lite`

## 源事实

- spec.dataSeries[1]: render-time (Render time)
- spec.dataSeries[1].id: render-time
- spec.dataSeries[1].points[1].x: baseline
- spec.dataSeries[1].points[1].y: 12
- spec.dataSeries[1].points[2].x: board
- spec.dataSeries[1].points[2].y: 16
- spec.dataSeries[1].points[3].x: presentation
- spec.dataSeries[1].points[3].y: 19

## 阅读线索

- 确认数值没有被重新编造。
- 确认共享坐标轴支持趋势比较。
- 优先检查这条证据：spec.dataSeries[1]: render-time (Render time)

这是输入示例；对应输出是带有 provider 元数据记录的真实 Vault 实测证据。
