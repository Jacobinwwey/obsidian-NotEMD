---
date: 2026-05-05
topic: cli-mainline-progress-sync-and-next-phase-requirements
---

# CLI 主线进展同步与下一阶段需求

## 问题框架

截至 2026-05-05，Notemd 的 CLI 相关主线已经跨过“只有命令触发”的早期阶段：

- 最新远端 `main` 已包含 operation registry、capability/contract 导出，以及第一批 diagram / provider / config-profile host adapter 抽离。
- 本轮 clean worktree 已继续把翻译、概念提取、原文提取与 `extract-concepts-and-generate-titles` 组合命令下沉到 `src/operations/noteProcessingCommandHostAdapter.ts`。
- 同一轮 clean worktree 也已落地 note-processing registry onboarding、第一批 utility-command registry、batch translation 的 injected reporter、original-text extraction 的输出路径返回，以及承接 duplicate check / duplicate cleanup / Mermaid fix / formula fix 的 `src/operations/utilityCommandHostAdapter.ts`。
- `src/fileUtils.ts` 与 `src/extractOriginalText.ts` 不再强耦合具体 `NotemdPlugin` 类，而是改为接受更窄的 runtime context。
- 组合命令此前存在两个真实缺陷：外层先置 `isBusy` 导致内部 `extractConceptsCommand()` 直接早退，以及批量生成阶段没有强制使用配置中的概念目录。本轮已一起修复。

但这还不是 CLI-ready 终态。当前剩余问题已经再次转移到三类更实质的边界：

1. `src/operations/registry.ts`、`src/operations/capabilityManifest.ts` 与 `src/cliContracts.ts` 已覆盖第一批 note-processing 与 utility-command operations，但仍未覆盖剩余 process / generate / research 等长尾 automation-facing surfaces。
2. `src/translate.ts`、`src/fileUtils.ts`、`src/extractOriginalText.ts` 与 `src/formulaFixer.ts` 仍持有 `App` / `Notice` / vault 写入等宿主副作用，operation contract 虽更干净但仍未宿主中立。
3. `src/main.ts` 虽已显著收缩，但 note-processing 与 utility-host 两轮抽离之后仍有直接执行表面与 sidebar 专属 read-path 尚未进入 registry/contract 体系。

因此，下一阶段重点不应再是“继续增加 CLI 命令”，而应是把已经抽出的 host adapter 进一步推进成可注册、可发现、可约束的 operation surface。

## 需求

**事实同步**
- R1. `docs/brainstorms/2026-05-02-progress-audit-and-next-direction.*` 与 `docs/architecture*` 必须逐段对齐到 2026-05-05 的代码现实，明确写出：翻译/抽取 host adapter 已落地，组合命令 bug 已修复，剩余缺口已从 wrapper 抽离转移到 registry 与 utility side-effect 边界。
- R2. 任何文档都不得继续把“翻译/抽取 wrapper 仍留在 `src/main.ts`”描述为当前事实。

**下一阶段优先级**
- R3. 下一阶段必须优先把剩余 automation-facing command families 纳入 `src/operations/registry.ts`、`src/operations/capabilityManifest.ts` 与 `src/cliContracts.ts`，而不是先增加新的 CLI 子命令。
- R4. 当前已经落地的 registry-backed operation 第一批包括：
  - `translate.file`
  - `translate.folder-batch`
  - `concept.extract-file`
  - `concept.extract-folder`
  - `content.extract-original-text`
  - `workflow.extract-and-generate`
  - `duplicate.check-file`
  - `concept.dedupe`
  - `mermaid.batch-fix`
  - `formula.fix-file`
  - `formula.batch-fix`
- R5. 下一批 registry onboarding 必须把同样的建模纪律扩展到剩余 automation-facing surfaces，显式写出 `automationLevel`、`requiredContext`、`sideEffectClass`、输入 schema、结果 schema，以及 alias policy。

**宿主副作用收口**
- R6. `src/translate.ts` 的批量翻译流程现在已经支持 injected reporter，不再把 `ProgressModal` 当成唯一执行载体；下一阶段必须继续把 notice 整形与结果语义上提，为 CLI / maintainer automation 留出更干净的无 UI 路径。
- R7. `src/fileUtils.ts`、`src/extractOriginalText.ts` 与 `src/formulaFixer.ts` 中与 `Notice`、vault 落盘、目录创建、输出命名冲突处理相关的逻辑，必须继续向显式 host effect 或结果对象收口，避免 operation core 隐式写 UI 文案。
- R8. 对 active-file / folder-picker / preview 绑定较重的流程，不得被误标为 `safe`；在 contract 未补齐前只能维持为 `requires-active-file`、`requires-vault-path` 或 `interactive-ui`。

**剩余 `src/main.ts` 瘦身方向**
- R9. 当前文件 duplicate check、duplicate / concept-note cleanup、batch Mermaid fix 与 single / batch formula fix 现已抽入 `src/operations/utilityCommandHostAdapter.ts`。
- R10. 下一批 `src/main.ts` 瘦身应转向剩余长尾命令面，而不是回头重复已抽离家族。

**主线与工作区卫生**
- R11. `main` 集成必须继续在干净 worktree 或干净分支上完成，不能试图清理或复用当前 dirty root worktree。
- R12. 交付完成时，当前执行 worktree 必须重新回到 clean 状态，并能给出 fresh build/test/audit 证据。

## 成功标准

- 维护者只看最新 requirements / progress / architecture 文档，就能清楚区分“已经落地的 host adapter 抽离”和“尚未完成的 registry / utility side-effect 收口”。
- note-processing 能力与第一批 utility operations 现在已进入 registry-backed operation 范围，下一阶段 operation onboarding 已明确收敛为剩余 automation-facing surfaces 覆盖与更深的副作用边界整理。
- 文档不再误报 `extractConceptsAndGenerateTitles` 的旧行为；组合命令当前已使用同一 host adapter 路径并对齐配置中的概念目录。
- 所有主线同步与代码变更都在干净工作树中完成，并通过完整仓库验证门。

## 范围边界

- 本次 requirements 不会直接新增新的 `obsidian-cli` 子命令。
- 本次 requirements 不会把 write-heavy note-processing 流程提前宣告为稳定公共 CLI API。
- 本次 requirements 不会清理 dirty root `main` worktree。
- 本次 requirements 不会把 preview / modal 驱动流程硬塞进 capability manifest 作为 `safe` 操作。

## 关键决策

- note-processing registry onboarding 与第一批 utility registry 现已完成，下一阶段最高杠杆工作变为剩余 automation-facing surfaces 覆盖与更深的 result/side-effect 收口。
- host adapter 抽离已经足够成熟，不应再盲目重复搬运 `src/main.ts` wrapper；下一阶段真正要解决的是 schema、capability 与 side-effect 边界。
- 组合命令的真实 bug 已经证明：只做“表面 delegator 抽离”不够，必须验证组合路径与共享 busy-state 的实际行为。

## 依赖与假设

- 当前 clean worktree 已基于最新远端 `main`，且包含 registry / capability contract / provider/diagram/config-profile 第一批抽离成果。
- `src/operations/noteProcessingCommandHostAdapter.ts` 现在已经承接 process / generate / research / translate / extract 全套 note-processing command wrapper。
- 当前 capability registry 已纳入第一批 note-processing 与 utility operation definitions；主要结构缺口已转向剩余 surface 覆盖与更丰富的结果语义。

## 未决问题

### 延后到规划阶段
- [影响 R5][Technical] 剩余长尾 command IDs 是否也应先按 task family 归一后再进入 registry？
- [影响 R6][Technical] `batchTranslateFolder()` 在 host 层接管更多结果语义后，是否还应继续直接弹 success notice？
- [影响 R7][Technical] `extractOriginalText`、concept-note creation 与 formula-fix 的文件写入结果，是否应先统一标准化为更丰富的 result object 再继续向 CLI 暴露？

## 下一步

-> 进入新的实施计划，优先完成剩余 automation-surface registry 覆盖、更深的 utility side-effect 收口，以及剩余长尾 `src/main.ts` / sidebar command-host 瘦身。
