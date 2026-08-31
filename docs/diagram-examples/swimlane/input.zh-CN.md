# 发布交接

用途：当多个负责人在流程中彼此交接工作时使用。

请求图表类型：`swimlane`
请求渲染目标：`mermaid`

## 源事实

- spec.swimlaneLanes[1].steps[1]: draft -> review (next)
- spec.swimlaneLanes[2].steps[1]: build -> publish (next)
- spec.swimlaneLanes[1]: authoring (Authoring)
- spec.swimlaneLanes[1].id: authoring
- spec.swimlaneLanes[1].steps[1]: draft (Draft spec)
- spec.swimlaneLanes[1].steps[1].id: draft
- spec.swimlaneLanes[1].steps[1].nextStepId: review
- spec.swimlaneLanes[1].steps[2]: review (Review contract)
- spec.swimlaneLanes[1].steps[2].id: review
- spec.swimlaneLanes[2]: delivery (Delivery)
- spec.swimlaneLanes[2].id: delivery
- spec.swimlaneLanes[2].steps[1]: build (Build artifact)
- spec.swimlaneLanes[2].steps[1].id: build
- spec.swimlaneLanes[2].steps[1].nextStepId: publish
- spec.swimlaneLanes[2].steps[2]: publish (Publish release)
- spec.swimlaneLanes[2].steps[2].id: publish

## 阅读线索

- 确认每个步骤位于正确泳道。
- 确认跨泳道交接方向可追踪。
- 优先检查这条证据：spec.swimlaneLanes[1].steps[1]: draft -> review (next)

这是输入示例；对应输出是带有 provider 元数据记录的真实 Vault 实测证据。
