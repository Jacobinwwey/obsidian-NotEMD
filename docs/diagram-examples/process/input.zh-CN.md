# 发布流程

用途：用于交接比 payload 类型更重要的分阶段多角色流程。

请求图表类型：`process`
请求渲染目标：`editable-html-svg`

## 源事实

- spec.payload.lanes[1]: {"id":"author","label":"AUTHORING"}
- spec.payload.lanes[2]: {"id":"review","label":"REVIEW"}
- spec.payload.lanes[3]: {"id":"delivery","label":"DELIVERY"}
- spec.payload.steps[1]: {"id":"draft","label":"DRAFT"}
- spec.payload.steps[2]: {"id":"review","label":"REVIEW"}
- spec.payload.steps[3]: {"id":"build","label":"BUILD"}
- spec.payload.steps[4]: {"id":"publish","label":"PUBLISH"}
- spec.payload.cells[1]: {"laneId":"author","stepId":"draft","title":"Write spec","sub":"contract"}
- spec.payload.cells[2]: {"laneId":"review","stepId":"review","title":"Review","sub":"quality gate","focal":true}
- spec.payload.cells[3]: {"laneId":"delivery","stepId":"build","title":"Build","sub":"artifact"}
- spec.payload.cells[4]: {"laneId":"delivery","stepId":"publish","title":"Publish","sub":"mainline"}
- spec.payload.edges[1]: {"from":{"laneId":"author","stepId":"draft"},"to":{"laneId":"review","stepId":"review"},"style":"accent","label":"handoff"}
- spec.payload.edges[2]: {"from":{"laneId":"review","stepId":"review"},"to":{"laneId":"delivery","stepId":"build"},"style":"muted"}
- spec.payload.edges[3]: {"from":{"laneId":"delivery","stepId":"build"},"to":{"laneId":"delivery","stepId":"publish"},"style":"muted"}
- spec.payload.kind: lane-grid

## 阅读线索

- 确认每个角色的步骤完整。
- 确认交接边连接相邻责任阶段。
- 优先检查这条证据：spec.payload.lanes[1]: {"id":"author","label":"AUTHORING"}

这是输入示例；对应输出是带有 provider 元数据记录的真实 Vault 实测证据。
