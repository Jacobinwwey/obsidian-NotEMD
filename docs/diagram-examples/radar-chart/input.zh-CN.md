# 能力画像

用途：当多个可比较维度构成有界多轴画像时使用。

请求图表类型：`radar-chart`
请求渲染目标：`vega-lite`

## 源事实

- spec.radarSpec.axes[1]: reliability (Reliability)
- spec.radarSpec.axes[1].id: reliability
- spec.radarSpec.axes[1].max: 10
- spec.radarSpec.axes[2]: latency (Latency)
- spec.radarSpec.axes[2].id: latency
- spec.radarSpec.axes[2].max: 10
- spec.radarSpec.axes[3]: operability (Operability)
- spec.radarSpec.axes[3].id: operability
- spec.radarSpec.axes[3].max: 10
- spec.radarSpec.axes[4]: cost (Cost)
- spec.radarSpec.axes[4].id: cost
- spec.radarSpec.axes[4].max: 10
- spec.radarSpec.axes[5]: coverage (Coverage)
- spec.radarSpec.axes[5].id: coverage
- spec.radarSpec.axes[5].max: 10
- spec.radarSpec.series[1]: current (Current)
- spec.radarSpec.series[1].id: current
- spec.radarSpec.series[1].points[1].axisId: reliability
- spec.radarSpec.series[1].points[1].value: 7
- spec.radarSpec.series[1].points[2].axisId: latency
- spec.radarSpec.series[1].points[2].value: 5
- spec.radarSpec.series[1].points[3].axisId: operability
- spec.radarSpec.series[1].points[3].value: 6
- spec.radarSpec.series[1].points[4].axisId: cost

## 阅读线索

- 确认每个轴的范围一致。
- 确认不同画像的维度对应关系一致。
- 优先检查这条证据：spec.radarSpec.axes[1]: reliability (Reliability)

这是输入示例；对应输出是带有 provider 元数据记录的真实 Vault 实测证据。
