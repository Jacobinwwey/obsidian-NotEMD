---
date: 2026-05-07
topic: cli-next-phase-planning
---

# CLI 下一阶段规划

> 更新（2026-05-07，更晚一些）：本规划文档给出的推荐方向已经在当前 contract 深度上落地。`diagram.generate` 仍保持为宿主无关 generation core，而其下的 command-completion 层现在已经通过类型化 `followThrough` 结果结构显式化。下一波工作应转向 packaging / semantic-verification 收敛，只有后续某个分支真的证明自己足够宿主无关时，才再考虑更大的导出边界。

## 问题框架

5 月 4-5 日这一组 brainstorm 文档其实已经把大方向定下来了：

- Notemd 应先抽取宿主无关 operation，再谈更强的 CLI / 公共表面承诺。
- 写入型 note-processing proof set 已经落地。
- 第一轮 diagram/provider wrapper 抽离也已经落地。

因此，CLI 的下一阶段不再是“继续加命令”，也不再是“继续做大范围 registry onboarding”。当前剩余的问题更窄：

- `diagram.generate`、`diagram.preview` 与 `provider.connection.test` 都已经是具备 typed contract 的 registry-backed seam。
- `runDiagramGenerateOperation()` 已经是宿主无关的 generation core。
- 当前剩余的混合语义主要位于 `src/operations/diagramCommandExecution.ts` 与 `src/operations/diagramCommandHostAdapter.ts` 中，负责把生成结果继续保存、重开、预览、自动修复并提示给用户。
- 实际出货的命令依然如实地沿用 `src/workflowButtons.ts` 中的 `requires-active-file`、`write-file` 或 `interactive-ui` 语义。

所以，当前规划的核心曾经是做一次分层澄清：把 core-generation contract 与 host follow-through contract 明确拆开，同时避免重开已经完成的 write-heavy 家族，也避免过早膨胀 top-level operation ID。这一决策现在已经实现，本文其余内容仍可作为当前实现形态的设计依据。

## 代码事实快照

### `diagram.generate` 已经具备真实的核心边界

`src/operations/diagramGenerateOperation.ts` 接收显式 markdown 输入和运行时依赖，然后返回 `DiagramGenerationResult`。它本身并不会保存文件、打开预览或弹 notice。这是仓库里最强的一条证据，说明项目已经拥有“宿主无关的 diagram generation seam”。

### 剩余副作用都发生在 generation 之后

`src/operations/diagramCommandExecution.ts` 先运行 generation core，然后再进入 `src/operations/diagramCommandHostAdapter.ts`。

这一层 host adapter 目前承接的，正是有意义的 follow-through：

- 保存 Mermaid 输出
- 保存 artifact 输出
- 视情况自动修复已保存 Mermaid
- 重开保存后的文件
- 打开预览
- 发出用户可见提示

这些都是真实的宿主/文件/UI 语义，不应该再和纯 generation core 混在同一层抽象里。

### registry 已经体现了这种分层，但还不够显式

`src/operations/registry.ts` 当前把 `diagram.generate` 导出为 `safe` / `read-only`，同时又保留了来自 `src/workflowButtons.ts` 的真实命令语义：

- `notemd-generate-diagram` -> `requires-active-file` / `write-file`
- `notemd-summarize-as-mermaid` -> `requires-active-file` / `write-file`
- `notemd-preview-diagram` -> `interactive-ui` / `preview-ui`

这在方向上是对的，而后续实现现在也已经把“这里描述的是 core operation，不是出货命令本身”说得更清楚：导出的 `diagram.generate` 结果之下新增了类型化 `followThrough` 结构，但 command binding 本身保持不变。

### `provider.connection.test` 是本地最成熟的参考模式

`src/operations/providerConnectionTestCommandHostAdapter.ts` 已经把下面两层分开：

- 类型化的测试核心路径
- 额外增加 busy/reporter 行为的交互式 wrapper

这正是剩余 diagram/provider command-core 分层应继续借鉴的模式。

## 与既有 brainstorm 文档的关系

| 既有文档 | 它已经确认的结论 | 本文新增澄清 |
|---|---|---|
| `docs/brainstorms/2026-05-04-obsidian-cli-extensibility-and-notemd-capability-extraction.md` | 要先抽 operation，再谈更强 CLI 形态 | 进一步明确：现在剩余工作主要是 contract layering，而不是新一轮 operation 家族抽取 |
| `docs/brainstorms/2026-05-05-cli-mainline-progress-sync-and-next-phase-requirements.md` | 下一阶段应转向更深层 diagram/provider command-core 工作 | 进一步明确：优先做 typed internal completion/follow-through contract，而不是马上新增 top-level operation ID |
| `docs/brainstorms/2026-05-05-cli-write-heavy-contract-tightening-requirements.md` | write-heavy proof set 已完成，不再是主瓶颈 | 再次确认：此时重开这些家族只会制造 churn，不会产生真正进展 |

## 考虑过的方案

### 方案 1：立即新增更多 top-level diagram operations

比如新增 `diagram.save-mermaid`、`diagram.save-artifact`、`diagram.preview-artifact`。

- 优点：表面上看起来很显式
- 缺点：会把宿主文件/UI follow-through 过早包装成“已经宿主无关的工程边界”
- 风险：在代码尚未证明这些路径真能脱离命令上下文时，先把公共契约面做大

### 方案 2：维持当前混合 wrapper 形态，不再细化

- 优点：短期成本最低
- 缺点：core 与 command follow-through 的边界仍然模糊
- 风险：后续维护者继续把更多 wrapper 语义塞进导出的 operation contract

### 方案 3：保持 top-level operation surface 稳定，同时把内部 completion/follow-through 层类型化

- 优点：既保留当前正确的顶层 seam，又能把剩余模糊处说清楚
- 缺点：需要更谨慎地设计内部 contract
- 风险：如果约束不够强，host-side completion helper 仍可能偷偷演变成第二套隐式 API

## 推荐方向

选择方案 3。

CLI 的下一阶段应保持 `diagram.generate`、`diagram.preview` 与 `provider.connection.test` 这组 top-level frame 稳定，然后把 diagram completion/follow-through 层在这组 frame 之下显式类型化。

这一步现在已经落地。

落到工程上，就是：

1. 继续把宿主无关 generation core 与 save/open/preview follow-through 分离
2. 优先引入内部 typed execution/result structure，而不是先发明新的 top-level operation ID
3. 以 `provider.connection.test` 作为 core-vs-interactive layering 的参考样板
4. 把更广的 CLI/public-surface 扩张、packaging isolation 与 maintainer semantic verification 留到后续波次

## 具体落地方案

### 阶段 1：把当前分层先写清楚

1. 保持 `diagram.generate` 继续表示宿主无关的 `sourceMarkdown -> DiagramGenerationResult` 契约。
2. 复核当前已导出的结果字段（`operationInput`、`generation`、`outputPath`、`previewOpened`），明确哪些属于 core result，哪些其实属于 follow-through 层。
3. 在文档与元数据中明确：即便 operation-level metadata 仍是 `safe` / `read-only`，command binding 也必须继续保留实际出货命令的触发语义。

### 阶段 2：在 core 之下把 follow-through 层类型化

1. 围绕以下行为引入更清晰的内部 execution/result structure：
   - Mermaid 保存收尾
   - artifact 保存收尾
   - preview follow-through
   - reopen / auto-fix / notice 等副作用
2. 优先把这些能力落成“内部类型化执行边界”。
3. 只有当某个分支已经证明自己是宿主无关且可脱离命令上下文独立调用时，才提升为新的 top-level operation。

实现更新：
- `diagram.generate` 现在会返回 `followThrough.kind`、`followThrough.outputPath`、`followThrough.previewOpened`、`followThrough.autoFixAttempted` 与 `followThrough.artifactTarget`
- 为了兼容现有调用方，顶层 `outputPath` 与 `previewOpened` 目前仍继续导出

### 阶段 3：用元数据和测试把边界锁住

1. 保持 `src/operations/registry.ts`、`src/operations/capabilityManifest.ts` 与 `src/cliContracts.ts` 明确描述各自所属层级。
2. 补充或收紧测试，防止 operation-core metadata 静默漂移回 command-trigger 语义。
3. 重新校验维护者文档，确保它们不再把 CLI 下一阶段误写成“命令数量增长”。

### 阶段 4：再进入下一波工作

1. packaging / 重型运行时隔离
2. maintainer-local semantic verification 硬化
3. selection/export 与 workflow/settings contract 增强
4. 更广的 CLI/public-surface 决策

这一阶段现在已经成为当前的实际下一波方向。

## 需求

- R1. 下一批实现必须保持当前阶段顺序：先做 diagram/provider contract layering，再做 packaging/semantic-verification，最后才是更广的 CLI/public-surface 声明。
- R2. `diagram.generate` 必须继续表示宿主无关 generation，而不是活动文件命令执行本身。
- R3. Mermaid 保存、artifact 保存、preview 打开、已保存文件重开、auto-fix 与 notice 语义，必须被视作独立的 completion/follow-through 层。
- R4. 下一批实现必须把这一 follow-through 层显式类型化。只有当某个分支真正变成宿主无关、且可脱离命令上下文独立调用时，才有理由升级为新的 top-level operation ID。
- R5. registry / capability manifest / contract 元数据必须明确各自描述的是哪一层：core operation 还是 command binding。
- R6. 添加测试锁定这一分层，防止后续再次漂移。
- R7. 除非更深层 diagram/provider 重构真的带来必须的对齐调整，否则不要重开已经落地的 write-heavy proof set。
- R8. 本阶段不新增新的 `obsidian-cli` 子命令。

## 成功标准

- 维护者能够解释清楚：为什么 `diagram.generate` 可以保持 `safe` / `read-only`，而真实出货的 diagram commands 仍然必须是 `requires-active-file` / `write-file`。
- 下一份实现 PRD 现在可以从已落地的 `followThrough` 契约出发，再判断它是否已经足够，还是未来真的需要更大的导出契约。
- 仓库文档不再把 CLI 下一阶段写成“命令数量增长”。

## 范围边界

- 本次规划不新增 `obsidian-cli` 子命令。
- 本次规划不重开 write-heavy note-processing contract batch。
- 本次规划不实现 packaging isolation。
- 本次规划不把 interactive preview/file-save 流程提升为 `safe`。

## 关键决策

- 目前先保持 top-level operation frame 稳定。
- 优先引入 typed internal completion/follow-through structure，而不是新增 top-level operation ID。这一偏好现在已经反映在落地实现中。
- 用 `provider.connection.test` 作为“typed core 与 interactive wrapper 并存”的本地参考模式。

## 依赖 / 假设

- 当前事实基于 `src/operations/diagramGenerateOperation.ts`、`src/operations/diagramCommandExecution.ts`、`src/operations/diagramCommandHostAdapter.ts`、`src/operations/providerConnectionTestCommandHostAdapter.ts`、`src/operations/registry.ts`、`src/cliContracts.ts` 与 `src/workflowButtons.ts` 的核对。
- 5 月 4-5 日的 brainstorm 文档仍然有效，应被视作沿袭脉络，而不是要被覆盖掉的旧历史。
- capability matrix 仍是维护者面对 automation-level truth 时的控制面，应与这份规划保持一致。

## 未决问题

### 延后到实现规划

- `diagram.generate` 结果顶层是否还应长期继续保留 `outputPath`、`previewOpened` 这样的兼容字段，还是未来应只保留更明确的 `followThrough` 结构？
- 哪些 diagram completion 分支最值得先提升为更强的内部 typed execution contract？
- 在这轮 layering correction 已落地后，selection/export/workflow contract 增强 与 packaging/maintainer verification，哪一个才是下一步更高杠杆的跟进项？

## 下一步

-> 将本文件与任务目录中的 research 纪要作为历史依据，然后在没有新宿主无关边界出现的前提下，优先从 packaging / semantic-verification 收敛启动下一份实现 PRD。
