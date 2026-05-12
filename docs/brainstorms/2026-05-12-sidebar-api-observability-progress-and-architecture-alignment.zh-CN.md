---
date: 2026-05-12
last_updated: 2026-05-12
topic: sidebar-api-observability-progress-and-architecture-alignment
---

# Sidebar API 可观测性：深度对比、当前进展与后续方向

## 1. 范围与需求基线

本文档用于落盘 sidebar API 可观测性切片的具体方案、已落地实现真值与下一阶段方向评估。

主要需求来源：

1. 产品侧要求在 footer `Log output` 区域直接提供快捷 `Deep debug` 开关
2. 产品侧要求在 ready/progress 卡片中提供可见的 API 测活状态，包括：
   - 等待 API 输出
   - 正常接收输出
   - 30 秒后的长任务健康提示
   - 成功收到响应
   - 输出中断
3. 明确要求在增加功能时优先保证既有已发布路径稳定，不允许为“看起来更丰富”的状态牺牲鲁棒性
4. 仓库既有稳定化纪律，来源于 `docs/superpowers/plans/2026-05-03-mainline-stabilization-next-batch.en.md`

本切片交付目标：

1. 用更直接的 sidebar 反馈缓解用户对 provider 是否“卡住”的焦虑
2. 让 deep debug 不再依赖“先离开侧边栏 -> 打开设置页 -> 再返回”的低效路径
3. 保持 transport 语义诚实：不能夸大 buffered / 非流式 provider 所能证明的实时健康状态
4. 覆盖单文件、批处理、文件夹与重试链路，避免仅在 happy-path 单请求场景有效

## 2. 改动前现状与根因分析

在本切片之前，插件已经具备一定的 debug 与 progress 基础能力，但与真实支持/排障流程仍然存在明显断层：

- `enableApiErrorDebugMode` 只存在于设置页，无法支撑实时排障
- sidebar 虽然能展示通用任务进度，但无法回答用户最关心的问题：“provider 现在到底有没有回东西，还是任务挂了？”
- retry 尝试失败与最终失败在 UI 边界上缺少明确区分
- batch / folder 流程会为每个文件包装 mini-reporter，如果新观测通道不显式透传，很容易在真实路径中静默丢失

根因总结：

1. **debug 可达性过低**
   诊断开关存在，但不在用户查看实时日志的工作面上
2. **provider 响应观测停留在 runtime 层**
   transport 能知道响应时机，但 sidebar 没有契约去接收和渲染这些事实
3. **失败语义过粗**
   一次可重试失败与最终中断，在没有 retry-aware 状态的前提下都容易被 UI 渲染成“错误”
4. **并发/批处理引入聚合脆弱性**
   如果仍用单一全局状态字段，多个请求并发时非常容易出现提前结束或误判

## 3. 实现映射（需求 -> 代码证据）

| 需求 / 问题 | 代码证据 | 状态 |
|---|---|---|
| Sidebar 快捷 `Deep debug` 开关 | `src/ui/NotemdSidebarView.ts` footer log header toggle | 已落地 |
| 开关需写回真实插件设置 | `enableApiErrorDebugMode` 通过 `plugin.saveSettings()` 持久化 | 已落地 |
| 成功路径也输出原始响应调试信息，而非仅错误路径 | `src/llmUtils.ts` 中的 `logSuccessfulApiDebug()` | 已落地 |
| 复用现有脱敏 debug schema，而不是再造第二套 | `getDebugInfo()` + shared runtime debug attempts | 已落地 |
| Sidebar API 测活事件契约 | `src/types.ts` 中 `ApiLivenessEvent` / `ProgressReporter.updateApiLiveness()` | 已落地 |
| 在重试链路中保持稳定的逻辑请求身份 | `src/llmUtils.ts` 中 request-scoped reporter 绑定 + `src/types.ts` 中 `requestId` | 已落地 |
| 区分请求已被接受 / 已拿到响应头 与 正文接收 | direct transport 路径中的 `response-headers` 发射 + `src/ui/NotemdSidebarView.ts` 中 accepted 状态渲染 | 已落地 |
| 在不继续扩张 footer 状态的前提下暴露结构化 per-request 观测证据 | `src/llmUtils.ts` 中 request-scoped deep debug liveness logging | 已落地 |
| 为 per-request 可观测性提供首个一等消费面，而不是反向解析日志 | `src/ui/NotemdSidebarView.ts` 中的 sidebar request activity summary + export report | 已落地 |
| 提供 inline per-request 下钻，而不只是导出报告 | `src/ui/NotemdSidebarView.ts` 中 active/recent request sections + inline history rows | 已落地 |
| 流式链路在真实收到 chunk 时发测活事件 | `src/llmUtils.ts` 中 `requestViaWebFetch*StreamTransport` 与 `requestViaDesktopHttp*StreamTransport` | 已落地 |
| 非流式 provider 走保守型“响应已到达”测活语义 | `executeAnthropicApi`、`executeGoogleApi`、`executeAzureOpenAIApi`、`executeOllamaApi` 与 OpenAI-compatible 成功路径 | 已落地 |
| 区分可重试失败与最终中断 | `callApiWithRetry()` 发出带 `retrying: true/false` 的 `request-error` | 已落地 |
| 防止并发请求把 sidebar 过早翻成 completed/error | `src/ui/NotemdSidebarView.ts` 中基于 `requestId` 的请求状态表 | 已落地 |
| batch/folder mini-reporter 透传测活事件 | `src/fileUtils.ts` 与 `src/operations/noteProcessingCommandHostAdapter.ts` | 已落地 |
| 新 sidebar 文案具备 i18n 覆盖 | `src/i18n/locales/en.ts`、`zh_cn.ts`、`zh_tw.ts` | 已落地 |
| 聚焦回归测试锁定行为 | `src/tests/sidebarDomButtonClicks.test.ts`、`llmUtilsProviderSupport.test.ts`、`noteProcessingCommandHostAdapter.test.ts` | 已落地 |

## 4. 架构推进评估

这个切片的价值在于“收紧观测边界”，而不是“增加更多炫目状态”：

1. **从设置页诊断提升为运行时邻接诊断**
   debug 控制现在位于用户查看实时日志的位置，不需要重开全局设置架构
2. **从 transport 事实提升为显式 UI 契约**
   provider 响应时机现在通过类型化 progress-reporter 通道进入 UI，而不是依赖日志字符串猜测
3. **从粗粒度失败提升为 retry-aware 失败语义**
   瞬时失败不再需要伪装成最终中断
4. **从单请求假设提升为 request-keyed 并发聚合**
   sidebar 测活状态现在可以精确容忍重叠请求，即使多个请求来自同一个 provider 也不会互相踩状态
5. **从粗糙 footer 状态提升为 request-scoped 调试证据**
   deep debug 现在会记录结构化 liveness 行（`requestId`、逻辑请求 attempt、phase、transport、已知时的 `statusCode`），而不必继续扩张终端用户状态模型
6. **从仅调试证据提升为可复用 request activity 工作面**
   sidebar 现在会基于同一条 live event stream 持久化 request-scoped activity 摘要与可导出的 per-request 历史，支持排障不再依赖复制原始日志后手工重建时序
7. **从 report-only 消费面提升为 inline 下钻**
   request-scoped 历史现在可以直接在 sidebar 内以 active/recent timeline 形式查看，降低 live run 中检查 retries 与 terminal transitions 的成本

本切片**没有**做的事情：

1. 没有做 per-provider 实时时间线，也没有在 footer 中直接暴露原始 transport metadata
2. 没有声称 buffered / 非流式 provider 在完整响应对象到达之前就能证明“正在持续输出正文”
3. 没有改变 provider 协议语义，也没有扩展到 packaging/runtime 拓扑改造

## 5. 相对先前方案轨道的深度对比

### 5.1 对 `mainline-stabilization-next-batch` 的对齐

一致点：

1. 这是一个稳定性/可运维性加固切片，而不是投机性产品扩张
2. 它沿用了计划中既有的落地规则：类型化契约 -> 聚焦测试 -> 全量门禁 -> 文档同步
3. 它强化了已发布支持/排障路径，但没有重开无关的 runtime-packaging 决策

差异点：

- 本切片推进的是产品侧观测边界，而不是 packaging/release 边界

### 5.2 对 release-chronicle / CI 加固工作的对齐

一致点：

1. 同样沿用了 anti-drift 模式：把真值集中到仓库代码，再用聚焦测试锁定
2. 同样保持 evidence-first 收口规则：全量 build/test/audit/diff/Obsidian wrapper 检查全部保留

差异点：

- 本切片提升的是用户侧运行时可观测性；release-chronicle 切片提升的是维护者侧发布恢复能力

### 5.3 对 packaging / semantic-verification convergence 轨道的对齐

一致点：

1. 二者都属于 boundary-hardening 工作
2. 二者都显式避免夸大当前架构能力
3. 二者都把 docs/tests/code 视为同一真值面

差异点：

- 本切片不启动 Stage-C packaging 拓扑实现
- 不能把它误读为 heavy-runtime isolation 或 per-request semantic verification 已经解决

## 6. 非流式输出的语义真值

这是当前实现中最需要在文档和后续工作里保持清晰的点。

### 6.1 流式 provider / transport

对于流式路径，`response-chunk` 的含义是：runtime 确实已经从 provider transport 收到了响应字节 / chunk。

这是一个真实的 liveness 信号。

### 6.2 Buffered / 非流式 provider

对于 buffered / 非流式路径，runtime 通常无法在完整响应对象到达前证明“provider 正在持续生成正文输出”。

当前行为是刻意保守的：

1. `request-start` 使 sidebar 进入 waiting
2. 如果 direct transport 真的在正文到达前暴露了响应头，runtime 可以发出 `response-headers`，UI 将其渲染为“请求已接受 / 等待正文”
3. 如果没有这种 transport 证据，UI 会继续停留在 waiting
4. 当完整 response object 或正文字节真正可用后，runtime 才发出保守型“响应已到达”事件（`response-chunk`）并继续 complete

这意味着：

- 对流式路径，绿色“正常输出中……”是强语义成立的
- 当前蓝色 accepted 状态只代表“transport 已接受请求且暴露了 headers”，不代表“正文已经在持续输出”
- 对 requestUrl-only 或其他没有 header timing 证据的 buffered 路径，当前实现只会在响应对象已到达时声称“收到响应”；不会在等待阶段伪造“服务端仍然健康持续输出中”的结论

这是当前阶段正确的取舍。任何更强的结论都需要额外协议证据，例如 request ID、response headers timing，或服务端主动 heartbeat。

## 7. 风险清单与控制措施

1. **风险：** 可重试失败闪成终局错误，误导用户。
   **控制：** `request-error` 现在带 `retrying`，sidebar 会把可重试失败挡在最终红态之外。
2. **风险：** 某个请求先完成，错误地结束另一个仍在运行的请求的测活状态，尤其是多个请求来自同一 provider 时。
   **控制：** sidebar 现在基于 `requestId` 状态表推导 UI，而不是依赖 provider 名称或纯计数聚合。
3. **风险：** batch/folder mini-reporter 丢失新测活通道。
   **控制：** mini-reporter 透传已经显式打通，并有 host-adapter 回归锁定。
4. **风险：** 文档或 UI 文案夸大 buffered / 非流式健康语义。
   **控制：** 本文档与代码都把非流式行为定义为“保守型响应到达”，而不是猜测式“健康输出进行中”。
5. **风险：** 未来 transport 重构击穿观测行为，但表面功能仍“看起来能跑”。
   **控制：** provider/transport 支持测试现在直接断言 liveness 事件，而不是只看最终返回文本。
6. **风险：** deep debug 日志在流式输出下过于嘈杂，反而淹没有效信息。
   **控制：** 结构化 liveness logging 会对同一逻辑 attempt 内重复的 `response-chunk` 做去重，每个 attempt 只保留一条 chunk-transition 线。
7. **风险：** UI 导出/下钻面与 live liveness 模型分叉，开始讲述与 footer 不一致的状态故事。
   **控制：** 导出报告现在直接消费驱动 sidebar 聚合的同一份 request-scoped record store，而不是从复制日志中重建状态。
8. **风险：** inline timeline 截断得太狠，导致支持最需要看的转换状态被静默丢掉。
   **控制：** 可视 history 窗口保持小而足够覆盖 retries + acceptance + terminal states；复制报告仍保留更完整的 retained history。

## 8. 验证证据

已执行并通过：

1. `npm run build`
2. `npm test -- --runInBand`
3. `npm run audit:i18n-ui`
4. `npm run audit:render-host`
5. `git diff --check`
6. `obsidian help`
7. `obsidian-cli help`

新增 / 更新的聚焦回归包括：

1. sidebar 测活状态流转、accepted 与 receiving 区分、长等待提示与快捷 debug toggle 持久化
2. provider runtime 支持测试中的 retry-aware liveness 事件断言，以及 `requestId` 在重试链路中的稳定连续性
3. deep debug 结构化 liveness logging 对 `requestAttempt`、`statusCode` 与跨 attempt retry 连续性的覆盖
4. batch concept extraction 路径下 per-file liveness 事件向主 reporter 的透传
5. sidebar request-activity 渲染与无日志解析的报告导出覆盖
6. sidebar active/recent timeline section 与 inline history row 覆盖

## 9. 当前进展与后续方向

本切片落地后，`main` 上的状态是：

1. quick deep debug 已经可以从实时日志工作面直接触达
2. sidebar 测活现在能表达 waiting / accepted / receiving / healthy-long-running / received / interrupted
3. retry 语义与并发请求聚合现在已经收紧到 `requestId` 粒度，而不是只停留在计数粒度
4. deep debug 现在包含结构化 per-request liveness 证据，不再强迫支持排障只能从泛化 progress log 里反推阶段
5. sidebar 现在已经提供首个 request-scoped API activity 工作面，并可基于同一份 live liveness 记录导出报告
6. sidebar 现在也提供了首个 inline active/recent request timeline，用户不复制日志也能直接看到近期 phase transition
7. batch/folder 工作流不再静默丢失测活信号

建议的下一阶段方向：

1. **继续扩展 per-request 结构化证据深度，而不是继续加全局状态**
   export/report 与 inline drill-down 都已落地；如果下一段还要继续做支持工具，应优先走保留策略、可保存诊断或更丰富的 per-request timing metadata，而不是继续在 footer 级别堆条件分支
2. **继续保持非流式 provider 的保守结论**
   除非 transport 真有证据，否则不要把非流式长等待升级成绿色“任务健康输出中”
3. **只有在 transport 真能暴露 acceptance 证据时才扩大 accepted 语义**
   requestUrl-only 等路径在代码无法安全证明更早 acceptance 之前，应继续停留在 waiting

## 10. 本次结论

这个切片之所以值得上 `main`，不是因为它“多了几个状态”，而是因为它让状态更接近真实：

- deep debug 更快可达
- retry 不再伪装成最终失败
- 并发请求不再过早清空 footer 状态，即使同一 provider 上有重叠请求也能稳定表达
- 请求已被接受 / 已收到响应头 不再被误报为“正在输出正文”
- deep debug 现在携带 request-scoped liveness 证据，而不必再从泛化日志里推测 retry/phase
- sidebar 现在可以直接从 live records 导出 request-scoped API activity，而不必再复制原始日志后手工还原链路
- sidebar 现在也直接提供了首个 inline active/recent timeline，不离开面板就能看到近期重试与终局转换
- 非流式 provider 被保守处理，而不是被戏剧化“脑补健康”

这使它在今天的 `main` 上可维护、可支持，同时为未来更深的 per-request observability 留出了干净演进路径，而不会夸大当前运行时真值。
