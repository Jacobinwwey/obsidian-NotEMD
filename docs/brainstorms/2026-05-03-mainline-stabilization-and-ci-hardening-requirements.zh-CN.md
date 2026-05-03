---
date: 2026-05-03
topic: mainline-stabilization-and-ci-hardening
---

# 主线稳定化与 CI 加固需求

## 问题框架

Notemd 当前已经不再缺 diagram platform 的核心架构，真正的风险正在转移：

- 仓库进度文档可能继续偏离代码和 workflow 真相
- 维护者可能把 GitHub commit-status 接口误读为 `main` 真有 CI 失败，即使 `main` 根本没有普通 workflow
- release 路径可能出现“今天还是绿的，明天因为 GitHub 平台升级直接红掉”的时间炸弹
- Drawnix 很容易被误解成近期要接入的宿主，而它更适合被定义为数据边界和转换边界参考

因此，当前最需要落盘的不是再写一版泛化路线图，而是一份明确约束 `main` 真实状态、下一批工作优先级、以及 Drawnix 影响边界的具体 requirements 文档。

## 需求

**事实源控制**
- R1. 进度文档与路线图必须逐段更新，确保它们对当前代码、远端 workflow 行为和剩余缺口的描述不夸大、不失真。
- R2. 面向维护者的文档必须明确区分普通 `main` 真值与 release-tag workflow 真值。当 GitHub commit-status API 在 `main` 上显示 `pending` 且 `statuses=[]` 时，文档必须引导维护者以 GitHub Actions runs 与 `check-suites` / `check-runs` 作为真实状态来源。
- R3. release workflow 必须保持在 GitHub 官方维护的 JavaScript actions 的受支持 major 版本上，不能让弃用告警悄悄老化成真正的发布失败。

**下一批次优先级**
- R4. 下一批实现必须优先处理命令表面收口，然后才考虑新的 renderer 家族或新的宿主级集成。
- R5. 下一批实现必须定义一套可持续的维护者本地语义核验 runbook 或 harness，且不能依赖已跟踪密钥、硬编码 vault 路径或误提交的 live tests。
- R6. 运行时打包隔离仍然是显式里程碑：在更重的 preview runtime 真正通过多入口或独立资产策略发货前，不得把它们描述为“已隔离”。
- R6.1. 对 `2026-04-14-diagram-rendering-platform-roadmap.en.md` 的中长期要求解读，必须从“继续建设平台”收敛为“优先完成边界加固，再决定是否扩展平台”。

**外部参考边界**
- R7. Drawnix 必须继续作为 `ref/` 下的本地参考项目存在，而不是 Notemd 的发货依赖或嵌入式宿主。
- R8. 任何未来的 Drawnix 相关实验都必须保留 spec-first 语义层。长期更优方向是 `DiagramSpec -> DrawnixExportedData` 或 `DiagramSpec -> PlaitElement[]`，而不是 `DiagramSpec -> Mermaid/Markdown -> Drawnix converter`。

**仓库卫生**
- R9. `ref/**`、`coverage/**` 等本地分析/构建产物必须继续排除在发货范围和提交工作树之外。

## 成功标准

- 维护者只读更新后的进度文档，就能决定下一批执行工作，而不用重新审计整个代码库。
- release workflow 不再保留 `actions/checkout@v4` 与 `actions/setup-node@v4` 带来的那条 GitHub 官方弃用告警路径，并且 `2026-05-03` 的 `1.8.4` 成功 release run 已体现这条加固后的路径。
- 仓库文档清楚说明 Drawnix 是参考边界，而不是近期宿主集成目标。
- `main` 保持干净，且当前仓库级验证门继续通过。

## 范围边界

- 本次 requirements 不会给 `main` 新增普通 push/PR CI workflow。
- 本次 requirements 不会把 Drawnix 宿主、工具栏体系或浏览器文件系统交互搬进 Notemd。
- 本次 requirements 不会退役 legacy Mermaid prompt，也不会移除 `mermaidProcessor.ts` fixer 路径。
- 本次 requirements 本身不会创建 release 或 tag。

## 关键决策

- 先把“`main` CI 报错”当成事实源判断问题，而不是先假设主分支真的存在失败流水线。
- 现在就修 release workflow 的未来失效点，不等 GitHub 的 Node 20 JavaScript-action 弃用时间表把告警变成真实失败。
- 将 Drawnix 限定在 adapter / data-boundary 参考层，不让它把 Notemd 拉进第二套托管前端应用边界。
- 将 roadmap 的下一阶段落地顺序固定为：命令表面 -> 维护者本地语义核验 -> 运行时打包边界 -> legacy prompt / MermaidProcessor 收缩 -> 更远期扩展。

## 依赖与假设

- `.github/workflows/release.yml` 是当前仓库唯一 active 的 GitHub Actions workflow。
- 成功的 `1.8.3` 修复 run（`25215799596`）是本仓库旧版 JavaScript-action 弃用告警的具体证据。
- 成功的 `1.8.4` release run（`25274341984`）是 `actions/checkout@v6` 与 `actions/setup-node@v6` 加固路径已转绿的具体证据。
- `actions/checkout` 与 `actions/setup-node` 的上游当前版本已经提供可替换旧 pin 的受支持 major，无需重写发布流程。

## 未决问题

### 延后到规划阶段
- [影响 R4][Technical] 在保留兼容别名的前提下，哪一个 command ID 应该成为最终的 canonical stable entrypoint？
- [影响 R5][Technical] 什么样的维护者本地语义核验 harness 才足够小、足够稳定，且能覆盖 Mermaid / JSON Canvas / Vega-Lite？
- [影响 R8][Needs research] 如果未来要支持 board export，Notemd 应直接输出 `.drawnix`，还是先定义更通用的 Plait adapter 边界？

## 下一步

-> 先直接执行 workflow 加固与文档对齐；之后如需推进下一批真正改代码的稳定化工作，再使用 `/ce:plan` 做正式拆解。
