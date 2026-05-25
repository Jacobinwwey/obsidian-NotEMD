---
date: 2026-05-20
last_updated: 2026-05-25
topic: unified-follow-through-matrix
canonical: true
---

# 主线统一推进矩阵

> 目的：保留一份单一执行矩阵，明确区分 **被重写后的 live mainline** 与 **仍保留更多后续工作结果的备份分支**，避免后续规划继续高估当前主线已发货进展。

## 1. Source-Of-Truth 规则

从这次检查点开始：

1. 重写后的 `origin/main` 才是唯一的当前发货真值。
2. `backup/main-before-origin-force-20260524` 只是 reintegration 证据，不是当前 release 真值。
3. 任何新的当前进展都先更新本文。
4. 只有当代码、测试、文档都真实存在于重写后的主线上时，某条轨道才允许被写成“已落地”。

## 2. 审计基线

本文基于以下事实建立：

1. 2026-05-24 force rewrite 之后的 live `origin/main`（审计时为 `0227f1b`）；
2. 先前仍与当前主线相关的文档：
   - `docs/brainstorms/2026-05-07-cli-next-phase-planning.*`
   - `docs/brainstorms/2026-05-08-packaging-semantic-convergence-progress-and-next-steps.*`
   - `docs/superpowers/plans/2026-05-03-mainline-stabilization-next-batch.*`
3. 来自 `backup/main-before-origin-force-20260524` 的备份分支证据。

## 3. 当前统一矩阵

| 轨道 | 当前 `origin/main` 真值 | 备份分支证据 | 需要的下一步 | 严禁误判 | 优先级 |
|---|---|---|---|---|---|
| A. Packaging / semantic verification | 当前 live 代码仍是单入口 `main.js` + inline `srcdoc`；helper/docs/tests 对该边界描述一致 | 更晚的备份分支曾进入更宽的 dedicated runtime-asset 通道 | 继续把当前单入口真值写清；只有当代码 + audit + 文档同批变化时才允许拓宽 topology | 不要继续把 `render-host.mjs` 写成当前主线已发货 | P0 |
| B. CLI / automation surface | 当前主线现已具备 registry-backed 的 config/profile export/import、脱敏 provider 导出、public-surface 导出，以及仓库内 export-only 的 maintainer help/invoke 脚本 | 备份分支还承载过更宽的 maintainer-bridge 设想，但当前 reintegration 刻意保持在窄边界内 | 继续把 export-only 边界写清楚；若要新增可变更型 maintainer 动作，必须同批补齐契约/测试/文档 | 不要把当前能力面写成通用 public CLI，或无边界的 maintainer mutation API | P1 |
| C. 用户可见 settings / preview / onboarding | 当前主线现已具备 preview flows、欢迎弹窗 release digest、provider diagnostics、settings reset、concept-note 前置配置提示、API liveness/activity UI，以及面向已保存工件的 preview 恢复链路 | 备份分支还有更多 UX 收口尝试，但目前已恢复切片已在当前主线上重新证明 | 继续保持 sidebar / preview / settings 的文案、i18n 与已保存工件行为一致 | 不要再把这些 UX guardrail 写成“当前主线缺失”，但也不要顺手高估尚未恢复的 UX 想法 | P1 |
| D. Regex / 文件筛选 / local-KB / chapter split | 当前主线现已具备 file-selection profiles、文件夹 regex/glob 筛选、`relativePath` / `basename` 匹配、可选子目录范围控制、local-KB retrieval、chapter split 及对应回归测试 | 备份分支提供了最初恢复证据；当前主线现在已直接携带该有界产品切片 | 下一步应视为质量/深度跟进，而不是继续证明这些能力“是否存在” | 不要继续把这些能力写成只存在于 backup、或 live mainline 尚未具备 | P1 |
| E. Release / repo-saga / clean-state hygiene | 当前主线现已具备 release/repo-saga 脚本，以及 repo-saga 执行锁、测试、文档与本地工件忽略 guardrail | 备份分支推动了这些 guardrail；当前主线已恢复有界串行安全切片 | 保持 repo-saga 刷新流程的串行纪律，并把 clean-state 证明保留为收尾要求 | 不要把“脚本还在”误读为“可以并行跑 repo-saga 刷新路径” | P0 |

## 4. 当前主线已确认 register

以下内容可以安全地继续描述为当前主线已存在：

1. packaging / semantic helper 与 maintainer 文档；
2. inline render-host 审计与相关测试；
3. provider profile export/import 命令面；
4. 欢迎弹窗 release digest；
5. preview artifact save/export helpers；
6. 脱敏 / public-safe CLI 导出表面与仓库内 maintainer help/invoke；
7. settings reset、concept-note 前置提示与 concept synonym suppression；
8. file-selection profiles 与 folder-scope regex/glob 控制；
9. local knowledge-base retrieval；
10. chapter split。

以下内容当前必须描述为 **未在重写后的主线上被证明存在**：

1. 已发货 dedicated runtime assets；
2. 超出当前 export-only helper 边界的更宽 maintainer mutation surface；
3. 任何绕开当前单入口 `main.js` + inline `srcdoc` 真值的 dedicated-runtime 叙述。

## 5. 单一执行顺序

除非出现打断当前顺序的回归：

1. **P0**：保持 packaging / semantic 当前主线真值诚实
2. **P0**：恢复 clean-state 与 repo-saga 串行 guardrails
3. **P1**：保持有界 CLI / maintainer-surface 真值收敛且测试充分
4. **P1**：持续保持已恢复的用户可见 settings / preview guardrails 在代码、i18n 与文档之间一致
5. **P1/P2**：以有界 current-main 工作继续深化 file-selection、local-KB、chapter split 的质量

## 6. 文档同步规则

每次触碰任一轨道，至少同步检查：

1. `change.md`
2. 对应专题 brainstorm 文档
3. 本矩阵
4. 若涉及 automation/verification 文案，则同步检查对应 maintainer 文档

## 7. 验证门禁

任何会更新本文判断的改动，都必须以以下结果收尾：

1. `npm run build`
2. `npm test -- --runInBand`
3. `npm run audit:i18n-ui`
4. `npm run audit:render-host`
5. `git diff --check`
6. clean 的 `git status --short --branch`
