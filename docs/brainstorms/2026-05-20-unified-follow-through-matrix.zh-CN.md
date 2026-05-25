---
date: 2026-05-20
last_updated: 2026-05-24
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
| B. CLI / automation surface | 当前主线已有 registry-backed 的 config/profile export/import，以及 capability/invocation contract export 表面 | 备份分支后续增加了 bounded maintainer bridge、共享 help-truth source，以及更窄的 public-surface 文案 | 在当前主线真值稳定后，再决定是否按小批次 reintegrate bridge/help 工作 | 不要把备份分支上的 maintainer bridge 继续描述成当前主线已存在 | P1 |
| C. 用户可见 settings / preview / onboarding | 当前主线仍有 preview flows、欢迎弹窗 release digest、provider diagnostics、canonical diagram wording | 备份分支后续新增了 settings reset、concept-note guard、preview history/layout 收口、sidebar liveness/activity hardening 等 | 先重新审计哪些用户 guardrail 必须优先恢复，再按小切片 reintegrate | 不要默认当前主线仍保留了所有后续 UX hardening 项 | P1 |
| D. Regex / 文件筛选 / local-KB / chapter split | 在被重写后的主线上，没有 file-selection profile、local-KB retrieval、chapter split 的当前代码/测试证据 | 备份分支曾有这些能力及对应测试，如 `folderTaskFileSelector`、`localKnowledgeBase`、`localKnowledgeTaskIntegration`、`chapterSplit` | 把这些能力视为 reintegration program，而不是继续写成已发货功能 | 不要让旧路线图措辞继续暗示这些能力仍在 live mainline 上 | P1/P2 |
| E. Release / repo-saga / clean-state hygiene | 当前主线有 release 与 repo-saga 脚本，但本地生成物未被忽略，串行防报错 guardrail 也没有完整保留 | 备份分支后续补过 repo-saga serial lock/test/doc hardening 与更严格 clean-state 纪律 | 先恢复能防止本机验证持续弄脏仓库的 guardrail，并视需要重新编码串行执行规则 | 不要把“脚本仍在”误当成“串行安全与 clean-state 收口仍然成立” | P0 |

## 4. 当前主线已确认 register

以下内容可以安全地继续描述为当前主线已存在：

1. packaging / semantic helper 与 maintainer 文档；
2. inline render-host 审计与相关测试；
3. provider profile export/import 命令面；
4. 欢迎弹窗 release digest；
5. preview artifact save/export helpers。

以下内容当前必须描述为 **未在重写后的主线上被证明存在**：

1. 已发货 dedicated runtime assets；
2. 备份分支上的 maintainer bridge help/runtime 脚本；
3. file-selection profiles 与 folder-scope regex/glob 控制；
4. local knowledge-base retrieval；
5. chapter split；
6. 备份分支后续加入的 settings reset 与 concept-note / synonym / product guardrails。

## 5. 单一执行顺序

除非出现打断当前顺序的回归：

1. **P0**：保持 packaging / semantic 当前主线真值诚实
2. **P0**：恢复 clean-state 与 repo-saga 串行 guardrails
3. **P1**：如果仍需要，恢复有界 CLI / maintainer-surface 真值
4. **P1**：重新审计并按需回灌用户可见 guardrails
5. **P1/P2**：只有在重新证明为“当前主线能力”后，才回灌 file-selection、local-KB、chapter split

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
