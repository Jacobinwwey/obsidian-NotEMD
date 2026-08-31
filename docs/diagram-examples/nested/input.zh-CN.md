# 范围级联

用途：用于策略、工作区和 Artifact 等包含边界。

请求图表类型：`nested`
请求渲染目标：`editable-html-svg`

## 源事实

- spec.payload.kind: nested
- spec.payload.levels[1]: org (Organization)
- spec.payload.levels[1].id: org
- spec.payload.levels[1].sub: global policy
- spec.payload.levels[2]: workspace (Workspace)
- spec.payload.levels[2].id: workspace
- spec.payload.levels[2].sub: team defaults
- spec.payload.levels[3]: project (Project)
- spec.payload.levels[3].id: project
- spec.payload.levels[3].sub: local contract
- spec.payload.levels[3].focal: true
- spec.payload.levels[4]: artifact (Artifact)
- spec.payload.levels[4].id: artifact
- spec.payload.levels[4].sub: single output

## 阅读线索

- 确认范围从外层向内层收窄。
- 确认焦点范围仍位于正确父边界内。
- 优先检查这条证据：spec.payload.kind: nested

这是输入示例；对应输出是带有 provider 元数据记录的真实 Vault 实测证据。
