# 支持责任归属

用途：当读者需要责任人、汇报路径和覆盖缺口时使用。

请求图表类型：`org-chart`
请求渲染目标：`mermaid`

## 源事实

- spec.orgChartSpec.nodes[1]: director (Support Director)
- spec.orgChartSpec.nodes[1].id: director
- spec.orgChartSpec.nodes[1].role: Front door
- spec.orgChartSpec.nodes[1].scope: triage, escalation
- spec.orgChartSpec.nodes[2]: platform (Platform Team)
- spec.orgChartSpec.nodes[2].id: platform
- spec.orgChartSpec.nodes[2].role: Runtime owner
- spec.orgChartSpec.nodes[2].scope: reliability, deployments
- spec.orgChartSpec.nodes[2].reportsTo: director
- spec.orgChartSpec.nodes[3]: incident (Incident Response)
- spec.orgChartSpec.nodes[3].id: incident
- spec.orgChartSpec.nodes[3].role: Escalation owner
- spec.orgChartSpec.nodes[3].scope: incidents, postmortems
- spec.orgChartSpec.nodes[3].reportsTo: director
- spec.orgChartSpec.nodes[3].status: planned

## 阅读线索

- 确认责任层级从入口到团队可追踪。
- 确认 planned 等覆盖状态清楚。
- 优先检查这条证据：spec.orgChartSpec.nodes[1]: director (Support Director)

这是输入示例；对应输出是带有 provider 元数据记录的真实 Vault 实测证据。
