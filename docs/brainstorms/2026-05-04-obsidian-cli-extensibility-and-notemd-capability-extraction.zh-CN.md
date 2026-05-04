---
date: 2026-05-04
topic: obsidian-cli-extensibility-and-notemd-capability-extraction
---

# Obsidian CLI 扩展性与 Notemd 能力抽取

## 问题框架

Notemd 现在已经有一批能力，实际规模明显超过“某个 Obsidian UI 按钮”：

- 可复现运行模式的 provider diagnostic
- spec-first diagram generation
- batch progress 持久化
- 结构化 workflow action ID 与可序列化 workflow 定义
- provider 级 `localOnly` 本地存储语义

但宿主现实比产品想象更窄。本机上的 `obsidian-cli` 当前只是稳定的桌面/调试包装器，暴露的是 `help`、`version`、`vaults`、`vault`、`doctor`、`native`、`gui`、`debug` 等调试入口。它**不是**插件能力宿主，也没有给第三方插件开放稳定的扩展协议。

这意味着下一步最有价值的动作，不是直接“给 `obsidian-cli` 塞几个 Notemd 命令”，而是先明确三件事：

1. Notemd 里哪些能力值得抽成宿主无关 operation
2. 哪些设置与执行契约可以脱离插件 UI 单独存在
3. `obsidian-cli` 真要承接这些能力，还缺哪些调用边界

如果不先做这层边界工作，CLI 化诉求最终只会退化成继续把逻辑堆在 `src/main.ts`，并且被 UI 假设和机器特定包装器拖死。

## 需求

**能力分类**
- R1. 仓库必须明确区分：哪些 Notemd 能力是宿主无关、适合未来 CLI 化的；哪些能力仍然绑定 Obsidian UI/runtime 表面。
- R2. 分类必须基于当前代码事实，而不是愿景。凡是声称“适合 CLI 化”的能力，都必须先核对它是否仍直接依赖 `App`、`Editor`、`MarkdownView`、`Notice`、modal 流程或插件自己的文件选择 UX。
- R3. 进度文档与架构文档必须明确区分本机 `obsidian-cli` 包装器和底层官方 `obsidian` CLI：后者已经具备插件命令触发能力，但仍缺少稳健自动化所需的类型化集成表面。

**适合 CLI 抽取的能力目标**
- R4. 下一条架构 seam 应优先围绕以下能力抽取可复用 operation：
  - provider diagnostics
  - diagram generation core
  - workflow / action registry 元数据
  - batch progress persistence 与 resumability metadata
  - `localOnly` 一类 provider/settings 序列化规则
- R5. 被抽取的能力必须优先形成稳定输入/输出契约，而不是把“模拟 sidebar 按钮点击”当成 CLI 集成方式。
- R6. 凡是仍然依赖编辑器原位修改、modal 交互、文件选择器或预览窗口的候选能力，在形成宿主无关 operation 之前，必须继续标记为延后 CLI 化目标。

**Obsidian CLI 集成方向**
- R7. 仓库必须把 `obsidian-cli` 集成写成一个分阶段扩展计划：
  - 阶段 1：抽取宿主无关的 Notemd operations
  - 阶段 2：定义 `obsidian-cli` 可调用的插件/operation invocation contract
  - 阶段 3：把少量 operation 暴露为稳定 CLI 命令或子命令
- R8. 仓库必须明确避免把“今天已经能触发插件命令”误判为“集成已经足够完善”。命令触发能力已经存在，但参数契约、能力发现、输出语义和自动化稳定性仍需单独设计。
- R9. 第一批面向 CLI 的集成目标必须优先选择非交互、可留证据、易自动化的能力：诊断、产物生成、配置检查/导出、dry-run 风格能力报告，而不是先做会直接改编辑器内容的流程。

**设置与扩展模型**
- R10. 仓库必须识别哪些 Notemd 设置值得未来 CLI 复用，哪些仍然属于插件本地 UI 设置。至少要覆盖：
  - provider 选择与 model 选择
  - `preferredDiagramIntent`
  - `localOnly` provider 持久化语义
  - workflow DSL 与 action IDs
  - developer diagnostic mode / timeout / stability-run 设置
- R11. 下一阶段架构必须朝“可复用 operation/config 层”推进，让插件 UI、未来 CLI 入口和维护者工具共享同一套边界，而不是继续把 orchestration 复制黏贴在 `src/main.ts` 里。

**文档与进度控制**
- R12. 当前进度文档必须逐段更新，明确说明：命令表面稳定化不再是唯一的边界加固主题；CLI 能力抽取现在已经是并行架构方向，但它的前提仍然是先建立宿主无关 operation seam。
- R13. roadmap 与 architecture overview 必须把 CLI 扩展性表述成“服务/边界加固的延伸”，而不是试图绕开这一步的捷径。

## 成功标准

- 维护者可以直接指向一份能力矩阵，解释哪些 Notemd 功能适合未来 CLI 暴露、哪些被插件宿主耦合阻塞、以及阻塞原因。
- 文档必须准确区分“官方 CLI 已可触发插件命令”和“项目仍缺少成熟插件自动化契约”这两层事实。
- 下一轮规划可以直接拆解一批具体 operation-extraction 工作，而不需要从头发明 CLI 范围和产品行为。
- 仓库继续把“本地机器 wrapper”“插件命令表面”“未来 CLI 扩展性”维持为三层边界，而不是塌成一个不稳定接口。

## 范围边界

- 本次 requirements 不实现新的 `obsidian-cli` 子命令。
- 本次 requirements 不修改这台机器上的 `/usr/local/sbin/obsidian-cli` 系统包装脚本。
- 本次 requirements 不立即把 `src/main.ts` 重构成服务层。
- 本次 requirements 不宣布当前所有 Notemd 命令都已经 CLI-ready。
- 本次 requirements 不把 sidebar actions 或 workflow DSL 行本身当成稳定公共 CLI API。

## 关键决策

- 把当前官方 CLI 的命令触发能力视作可用底座，而不是把它误读为“Notemd 的能力已经天然适合自动化 CLI 暴露”。
- 先抽 operation，再暴露 command。否则项目只会在插件 UI 和 CLI 两边重复 orchestration 逻辑。
- 第一批 CLI 适配优先选择非交互、可确定、可产出文件/证据的能力。
- 编辑器绑定、预览绑定、modal 绑定的流程，在形成明确宿主无关契约前继续留在插件宿主里。

## 依赖与假设

- 当前宿主证据来自 `obsidian-cli help`、`obsidian-cli doctor`、`obsidian --help`、`obsidian commands filter=notemd`，以及本机包装脚本 `/usr/local/sbin/obsidian-cli` 与 `/usr/local/libexec/obsidian-launch`。
- 当前代码证据表明 `src/main.ts` 仍掌握命令注册、busy-state orchestration、reporter 生命周期，以及大量依赖 `App` / `Editor` / `MarkdownView` 的流程。
- 可复用的低层 building block 已经部分存在于 `src/providerDiagnostics.ts`、`src/diagram/diagramGenerationService.ts`、`src/workflowButtons.ts`、`src/batchProgressStore.ts` 和部分 `src/llmUtils.ts` 中，但它们还没有被组织成真正的宿主无关 operation 层。

## 未决问题

### 延后到规划阶段
- [影响 R4][Technical] 从 `src/main.ts` 中优先抽哪一类 operation：diagnostics、diagram generation，还是 workflow execution？
- [影响 R5][Technical] 最小的宿主无关 operation 接口应该长什么样，才能表达输入、输出、进度和失败，同时不依赖 Obsidian UI 类？
- [影响 R7][Needs research] 未来 `obsidian-cli` 集成应走 plugin-discovered、manifest-declared，还是 CLI 侧显式 adapter 的方式？
- [影响 R10][Technical] 哪些设置应继续保持 vault/plugin-owned state，哪些值得未来支持 CLI profile 的导入导出？

## 下一步

-> /ce:plan 拆解一批具体的 operation 抽取与 CLI 扩展实现工作
