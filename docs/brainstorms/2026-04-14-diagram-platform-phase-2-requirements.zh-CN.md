---
date: 2026-04-14
topic: diagram-platform-phase-2
---

# Diagram Platform Phase 2 对齐需求

## 问题框架

Notemd 的图表平台路线图已经不再是纸面设想。仓库当前已经落地了相当完整的 spec-first 流水线、多目标渲染器、预览与导出辅助能力，以及 locale/theme 对齐逻辑。现在的问题已经变了：实现现实已经跑在路线图前面，但原计划中部分架构承诺，在代码里仍然只实现了一半。

这种漂移会带来两个明确风险：

- 后续工作可能会重复建设已经落地的能力
- 后续版本可能会对 runtime isolation、命令收口或 renderer 稳定性作出超过现状的承诺

因此，下一阶段应该把重点放在产品化与边界加固，而不是继续增加 renderer 数量。

最近的稳定化工作已经把剩余 Mermaid legacy 表面往这个方向推进了一部分：render-host bundle 审计已经进入发布门禁，命令编排在 `src/main.ts` 中已经部分统一，共享 note-directive parsing / note attachment / edge-label surgery helper 也开始从 `src/mermaidProcessor.ts` 下沉到 `src/diagram/adapters/mermaid/legacyFixerUtils.ts`。当前未解决的问题已经不是“要不要开始拆分”，而是“在不破坏 legacy 修复覆盖面的前提下，剩余 sunset boundary 要推进到多激进”。

## 需求

**事实源对齐**

- R1. 仓库中必须存在一份可长期维护的文档，明确说明哪些 diagram-platform 能力已经发货、哪些仍处于实验阶段、哪些只完成了一部分、哪些被明确延后。
- R2. `docs/superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap.zh-CN.md` 必须逐段更新，使每个任务都反映当前实现状态、证据和剩余缺口。
- R3. 面向用户和维护者的文档不得宣称当前代码尚未真正交付的 renderer isolation、打包保证或命令统一程度。

**产品化方向**

- R4. spec-first 流水线在 best-fit routing 通过明确验收门槛之前，必须继续保留兼容当前 Mermaid 行为的路径。
- R5. 下一批实现必须优先把已经落地但仍停留在 developer-only 或 experimental 表面的图表能力推进到稳定用户路径，再考虑新增 renderer 家族。
- R6. Mermaid、JSON Canvas、Vega-Lite 与 HTML fallback 输出必须继续维护一份清晰的预览/导出契约，明确说明每个目标支持哪些 inline preview、SVG export、PNG export 与 raw-source save。
- R7. 图表预览与导出行为必须在当前已发货 locale 目录内，与插件 UI locale 以及解析后的 Obsidian theme 保持一致。

**架构控制**

- R8. 后续 renderer 工作必须复用 `DiagramSpec`、`RendererService` 与 target-aware save/export 流程，不能再把新的图表逻辑直接塞回 `src/main.ts`。
- R9. build/runtime isolation 必须被视为独立加固里程碑；在打包与执行边界真正实现并验证前，不得把更重的 preview runtime 描述为“已隔离”。
- R10. PlantUML、Graphviz、Draw.io 等高级引擎仍然保持延后，直到当前平台退出 experimental gating，且 host/runtime boundary 完成加固。

## 成功标准

- 路线图与需求文档能够如实反映当前代码，不再出现明显失真宣称。
- 维护者无需重新通读整个 diagram 代码库，仅凭文档就能决定下一批实现工作。
- 下一批工作被明确表述为“稳定化、命令架构、runtime 边界”，而不是功能蔓延。
- 在 phase-2 planning 或直接执行前，不再存在阻塞性的产品问题。

## 范围边界

- 本次 brainstorm 不新增 renderer 实现。
- 本次 brainstorm 不退役 legacy Mermaid fixer 路径。
- 本次 brainstorm 不宣称 iframe-host 已经把重型 runtime 从主插件 bundle 中隔离出来。
- 本次 brainstorm 本身不创建新的 release 或 tag。

## 关键决策

- 更新现有 roadmap，而不是重写一份新的。它已经是实现锚点，应被提升为权威状态文档。
- 新增一份专门的 phase-2 requirements 文档。roadmap 描述执行切片，这份文档定义下一阶段必须优化什么。
- 将 diagram platform 视为“核心能力已落地，但尚未完全产品化”。核心模块已经存在，但 experimental gating、runtime isolation 与 legacy 路径收缩仍未完成。
- 优先做边界加固，而不是新增 renderer 扩展。当前最高杠杆动作是稳定现有平台，而不是继续拉长 target 列表。

## 依赖与假设

- `README.md` 与 `docs/releases/1.8.3.md` 已经记录当前实验性图表功能集，并应继续与代码保持一致。
- `ref/**` 仅作为本地参考材料，不属于发货范围。
- 发布质量级改动仍沿用 `npm run build`、`npm test -- --runInBand`、`npm run audit:i18n-ui`、`npm run audit:render-host` 与 `git diff --check` 作为完整仓库验证门禁。

## 未决问题

### 延后到规划阶段

- [影响 R4][Technical] best-fit diagram generation 需要满足哪些明确验收门槛，才能从 developer-only / experimental 状态升级为 stable opt-in 或 default-on？
- [影响 R8][Technical] 剩余 diagram orchestration 路径中，哪些应优先从 `src/main.ts` 迁出，避免平台继续沿着插件入口膨胀？
- [影响 R9][Needs research] 一旦 release asset packaging 形式被正式化，更重的 preview runtime 应放在内联 `srcdoc`、独立 bundle frame，还是 hybrid loader？

## 下一步

-> 直接推进 phase-2 稳定化批次，或先使用 `/ce:plan` 形成更正式的执行拆解。
