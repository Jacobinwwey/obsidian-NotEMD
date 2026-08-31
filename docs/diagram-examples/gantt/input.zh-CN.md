# 发布计划

用途：用于有界交付时间线上的任务重叠和里程碑。

请求图表类型：`gantt`
请求渲染目标：`editable-html-svg`

## 源事实

- spec.payload.phases[1]: {"id":"foundation","label":"FOUNDATION"}
- spec.payload.phases[2]: {"id":"delivery","label":"DELIVERY"}
- spec.payload.tasks[1]: {"id":"contract","label":"Canonical contract","phaseId":"foundation","start":"W1","end":"W3"}
- spec.payload.tasks[2]: {"id":"renderer","label":"Native renderer","phaseId":"foundation","start":"W2","end":"W5","focal":true}
- spec.payload.tasks[3]: {"id":"preview","label":"Preview and gallery","phaseId":"delivery","start":"W4","end":"W6"}
- spec.payload.tasks[4]: {"id":"release","label":"Release gate","phaseId":"delivery","start":"W6","end":"W7"}
- spec.payload.milestones[1]: {"id":"gate","label":"consumer gate","date":"W5"}
- spec.payload.kind: schedule

## 阅读线索

- 确认任务条位于正确阶段。
- 确认里程碑与任务时间位置一致。
- 优先检查这条证据：spec.payload.phases[1]: {"id":"foundation","label":"FOUNDATION"}

这是输入示例；对应输出是带有 provider 元数据记录的真实 Vault 实测证据。
