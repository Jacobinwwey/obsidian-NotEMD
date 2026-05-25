---
date: 2026-05-24
last_updated: 2026-05-24
topic: mainline-force-rewrite-audit-and-next-direction
---

# 主线 Force Rewrite 审计与下一步方向

## 1. 范围与基线

这份审计文档存在的原因，是仓库在 2026-05-24 发生了实质性形态变化：

1. `git fetch origin` 显示 `origin/main` 被强制改写；
2. 当前远端主线不再等同于此前已经推进过的本地更宽分支状态；
3. 如果继续把更晚分支的状态写成“当前 main”，当前进度文档就会直接失真。

本文对比：

1. 被重写后的当前 `origin/main`；
2. 先前仍相关的主线规划文档；
3. 仅用于审计参考的本地备份分支 `backup/main-before-origin-force-20260524`。

核心规则：

- live `origin/main` 决定当前发货真值；
- 备份分支证据只决定未来 reintegration 机会。

## 2. 当前代码真值快照

### 2.1 Packaging / runtime 真值

当前 `origin/main` 仍然证明的是单入口打包边界：

1. `esbuild.config.mjs` 只构建 `main.js`；
2. `IframeRenderHost` 消费 inline `htmlSrcdoc`；
3. `scripts/audit-render-host-bundle.js` 审计的是 bundled `main.js` 标记，而不是独立运行时资产；
4. maintainer 文档仍明确把 `main.js + inline srcdoc` 写成当前真实边界。

### 2.2 当前 automation / CLI 真值

当前主线仍保留了一些有价值的 extracted automation 表面：

1. provider profile export/import operations；
2. capability manifest export；
3. invocation contract export；
4. 上述表面的 registry-backed operation metadata。

但当前主线 **并不包含** 备份分支上更晚加入的 maintainer bridge/help 栈：

1. 没有 `scripts/invoke-maintainer-cli-operation.js`；
2. 没有共享的 `scripts/lib/maintainer-cli-operation-help.js`；
3. 没有 `cliPublicSurface`、`invokeMaintainerCliOperationScript`、`repoSagaExecutionLock` 这类更晚 bridge/public-surface hardening 测试。

### 2.3 当前用户可见真值

当前主线仍保留：

1. preview artifact save/export helpers；
2. welcome-modal release digest；
3. provider diagnostics；
4. canonical diagram wording 与当前 inline preview host 路径。

但备份分支上后续做过的以下用户能力，在重写后的当前主线上**没有被证明存在**：

1. settings reset；
2. concept-note path guard modal；
3. file-selection profiles 与 folder-task filter UX；
4. local-KB retrieval；
5. chapter split；
6. 更晚的 sidebar API liveness/activity hardening。

### 2.4 Clean-state 真值

被重写后的主线也暴露出一个真实的 hygiene 缺口：

1. `docs/` 下本地生成的 vault 工件没有被忽略；
2. 更早工作留下的根目录 `render-host.mjs` 也会把仓库弄脏；
3. 这意味着本机验证结束后，即使真正代码 diff 没问题，工作区也可能错误地表现为不 clean。

## 3. 相对先前方案要求的深度对比

### 3.1 相对 packaging / semantic 轨道

当前代码仍然匹配的部分：

1. packaging-boundary honesty；
2. helper-driven anti-drift verification；
3. maintainer 文档与当前代码真值一致。

当前代码已不再匹配的部分：

1. 假定已发货 `render-host.mjs` 通道的更晚文档；
2. 假定 dedicated runtime assets 仍在当前主线上的更晚 Stage-C 文案。

结论：

- packaging / semantic 轨道仍然活着，但当前真值又变窄了。

### 3.2 相对 CLI-next-phase 规划轨道

当前代码仍然匹配的部分：

1. extracted operation contracts 仍比“继续加命令数量”更重要；
2. capability/export/config 表面仍是当前主线上的合法 automation seams。

当前代码已不再匹配的部分：

1. 更晚的 bounded maintainer-bridge 工作当前主线上不存在；
2. 更晚的 public-safe wording 与 help-truth 收口当前主线上不存在。

结论：

- 当前主线仍能承载有界 automation 工作，但不能无条件继承更晚的 maintainer-bridge 叙述。

### 3.3 相对 local-KB / chapter-split 任务 PRD

PRD 与备份分支证明这些工作后来确实做过，但重写后的当前主线并未携带：

1. 缺失测试：`chapterSplit`、`localKnowledgeBase`、`localKnowledgeTaskIntegration`、`folderTaskFileSelector`、`settingsReset`；
2. 缺失后续进度文档：更晚的 unified matrix 与 05-13/05-20 进度面不在当前主线上；
3. 因此当前主线不能再诚实地写成“已经发货这些产品能力”。

结论：

- 这些能力现在应被视为 reintegration candidates，而不是当前主线完成项。

## 4. 架构推进评估

### 4.1 当前主线真实推进了什么

1. packaging/semantic 契约诚实度；
2. registry-backed export/config automation seams；
3. release-digest/onboarding 连续性；
4. preview artifact handling 与当前 inline preview host 流程。

### 4.2 当前主线没有保住什么

1. 更晚的 dedicated runtime-asset 工作；
2. 更晚的 maintainer-bridge/public-surface hardening；
3. 更晚的产品面 retrieval/splitting/profile 切片；
4. 更晚的 repo-saga 串行防报错执行约束。

### 4.3 正确解释

被重写后的主线并不是“坏掉了”，但相对于本地备份分支，它的 **能力宽度确实回退了**。因此正确的下一步不是继续假装这些更宽能力还在，而是：

1. 先修正文档里的当前主线真值；
2. 先补齐 clean-state guardrails；
3. 然后再按轨道挑选 reintegration 切片。

## 5. 具体后续方向

### Priority 0：修复当前主线真值叙述

1. 让 packaging 进度文档重新对齐到单入口 `srcdoc` 真值；
2. 增加一份统一推进矩阵，明确区分 live main 与 backup-branch evidence；
3. 不再把当前主线上不存在的文件继续引用为 live roadmap state。

### Priority 0：收口 clean-state

1. 忽略本地生成的 vault/runtime 工件；
2. 每一轮验证都以 clean status 证明收尾；
3. 把 clean-state 规则写清楚，避免本机测试残留被误判为产品回归。

### Priority 1：做有界 reintegration 规划

1. 决定下一批 reintegration 是 packaging/runtime follow-through、CLI/maintainer-surface hardening，还是产品表面恢复；
2. 每个 reintegration 切片都保持足够窄，保证代码/测试/文档能同批落地；
3. 不要把备份分支的说法整包搬回当前主线而不重新验证。

### Priority 2：更晚的产品面恢复

如果仍希望把更晚产品能力恢复到主线，建议按以下顺序回灌：

1. clean-state + repo-saga/release guardrails；
2. CLI/help/public-surface truth；
3. settings/sidebar guardrails；
4. file-selection/profile control；
5. local-KB retrieval 与 chapter split。

## 6. 验证门禁

任何会改变“当前状态解释”的批次，都至少应运行：

1. `npm run build`
2. `npm test -- --runInBand`
3. `npm run audit:i18n-ui`
4. `npm run audit:render-host`
5. `git diff --check`
6. 最终 clean 的 `git status --short --branch`

## 7. 结论

当前被重写后的 `main` 仍然是自洽的，但前提是我们要诚实地描述它：

1. 它当前发货的是单入口 packaging / semantic 轨道；
2. 它当前并没有发货备份分支上的更宽能力面；
3. 下一步真正的“develop to next level”应是有纪律的 reintegration，而不是叙事漂移。
