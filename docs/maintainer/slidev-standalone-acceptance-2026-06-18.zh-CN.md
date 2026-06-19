# Slidev Standalone 验收记录，2026-06-18

语言: [English](./slidev-standalone-acceptance-2026-06-18.md) | **简体中文**

本文记录 `architecture.zh-CN.md` 的真实 standalone 验收结果。它存在的原因很直接：生成的 HTML 与截图是检查产物，不适合继续作为 main 分支源码产物提交。

## 结论

在 commit `e46eb60` 上，维护者 verifier 路径已验收通过：

```text
fix(slidev-export): gate native standalone html
```

这个验收结论是有边界的：

1. 真实源文件是 `docs/architecture.zh-CN.md`；
2. 工作流命中了 Jacob 的本地 Slidev fork；
3. 工作流加载了完整 Slidev skill 目录，包括 references；
4. 通过的是严格 native standalone，不是 server-script 兼容通道；
5. 生成后的完整 deck 经过渲染布局审计，overflow 与 unreadable 均为零。

这不是在声明未来任意自定义 Slidev component layout 都自动安全。

## 为什么之前在 main 上看不到文件

真实输出归档在仓库外：

```text
/home/jacob/slidev-export-review/2026-06-18/standalone-strict/
```

这样做是为了避免把一次性生成文件提交到 `main`，尤其是：

```text
final-output/architecture.zh-CN-slides/index-standalone.html
final-output/architecture.zh-CN-slides/slide-01-workflow.png
...
final-output/architecture.zh-CN-slides/slide-28-workflow.png
```

问题在于：此前缺少一份仓库内可追踪的验收索引。代码和维护者文档已经写了规则与结果摘要，但没有一个专门文件指向真实 strict report、真实 HTML 和归档位置，所以从 main 上看会像“只有口头结论，没有验收文件”。

## 验收证据

严格报告：

```text
/home/jacob/slidev-export-review/2026-06-18/standalone-strict/completion-rerun-strict-report.json
```

可打开检查的 standalone HTML：

```text
/home/jacob/slidev-export-review/2026-06-18/standalone-strict/final-output/architecture.zh-CN-slides/index-standalone.html
```

准备后的 Slidev 源文件：

```text
/home/jacob/slidev-export-review/2026-06-18/standalone-strict/final-output/_slidev-sources/architecture.zh-CN.slidev.md
```

严格报告的机器可读摘要：

```json
{
  "ok": true,
  "source": {
    "vaultRoot": "/home/jacob/obsidian-NotEMD/docs",
    "sourcePath": "architecture.zh-CN.md"
  },
  "slidev": "52.16.0 (/home/jacob/slidev/packages/slidev/bin/slidev.mjs)",
  "skillRootPath": "/home/jacob/slidev/skills/slidev",
  "skillReferenceCount": 52,
  "output": {
    "format": "html",
    "path": "/home/jacob/obsidian-NotEMD/docs/export/architecture.zh-CN-slides/index-standalone.html",
    "bytes": 4299348
  },
  "htmlExport": {
    "requestedMode": "standalone",
    "actualMode": "standalone",
    "requiresLocalServer": false,
    "fallbackPath": null,
    "standaloneAttempt": {
      "attempted": true,
      "accepted": true,
      "loaderGaps": [],
      "failureReason": null
    }
  },
  "standaloneGate": {
    "required": true,
    "passed": true,
    "reason": null
  },
  "layoutAuditSummary": {
    "slideCount": 28,
    "overflowCount": 0,
    "unreadableCount": 0,
    "renderErrorCount": 0,
    "retryCount": 4
  },
  "playwrightFailed": 0,
  "ignoredOutputs": []
}
```

## 与要求逐项对比

| 要求 | 当前状态 | 证据 |
| --- | --- | --- |
| 使用本地 Slidev fork | 已通过 | 报告显示 `/home/jacob/slidev/packages/slidev/bin/slidev.mjs` |
| 使用完整 Slidev skill，而不是只有 `SKILL.md` | 已通过 | `skillRootPath = /home/jacob/slidev/skills/slidev`，`skillReferenceCount = 52` |
| 非大纲导出流程包含 source preparation | 已通过 | UI 等价 verifier 在导出前调用生产 `prepareSlidevExportSource()` |
| native standalone 必须严格通过 | 已通过 | `actualMode = "standalone"`，`requiresLocalServer = false`，`standaloneGate.passed = true` |
| 不能静默接受坏 standalone 输出 | 已通过 | 坏 attempt 会通过 `loaderGaps` 被拒绝，并在 fallback 前保留为 `index-standalone.failed.html` |
| 真实验收必须基于 `architecture.zh-CN.md` | 已通过 | strict report 的 source 是 `architecture.zh-CN.md` |
| 完整 deck 渲染布局门禁 | 已通过 | 28 个审计页，overflow、unreadable、render error 均为零 |
| UI 有导出格式选择 | sidebar 与 settings 已通过 | sidebar 暴露 `.notemd-slide-export-format-select`；settings 暴露默认格式与 HTML mode |
| 生成输出必须可检查 | 本地已通过 | `ignoredOutputs = []`；`git check-ignore` 对当前生成路径无输出 |
| 测试/生成输出不要提交到 main | 本验收切片已满足 | 真实输出归档在 `/home/jacob/slidev-export-review/...`，不把新生成产物塞进 main |

## 发现并修掉的问题

第一次 strict standalone gate 失败时，本地 Slidev fork 实际已经生成了 standalone bundle。失败原因在 NoteMD 的检测器：旧边界检查没有正确建模 JavaScript identifier，导致 `$n` 这种压缩后的 loader identifier 被误判成缺失。

修复点在 NoteMD，而不是生成 deck：

1. `detectStandaloneBundleLoaderGaps()` 改为 JavaScript identifier-aware boundary；
2. HTML export 记录结构化 outcome：`requestedMode`、`actualMode`、`requiresLocalServer`、`standaloneAttempt` 与 fallback 状态；
3. strict verifier 会在 compatibility fallback 掩盖 native standalone 失败时 fail closed。

所以早期 compatibility report 可以是 `ok: true`，但 `actualMode = "server-script-fallback"`。这不应被算作 native standalone 验收通过。

## 架构推进状态

导出路径现在是由 export command 拥有的一条完整操作：

```text
UI command or sidebar action
  -> exportSlidesCommand()
  -> probeEnvironment()
  -> prepareSlidevExportSource()
  -> convergeSlidevDeckLayout()
  -> exportSlidevHtmlWithOutcome()
  -> strict standalone outcome or explicit server-script fallback
```

当前代码里的关键边界：

1. `prepareSlidevExportSource()` 负责 deck 准备、完整 skill 加载、现有 deck working-copy 隔离、sibling support-entry mirror；
2. `convergeSlidevDeckLayout()` 负责渲染反馈与有界 patch/rebuild；
3. `exportSlidevHtmlWithOutcome()` 负责 standalone 与 server-script 的 outcome 报告；
4. `detectStandaloneBundleLoaderGaps()` 负责 build 后 standalone sanity detection；
5. UI 只选择配置并派发完整操作。

这个方向是对的。把布局或 standalone 检查退回到 prompt-only 指令，会重新制造这次暴露出来的弱验收问题。

## 剩余风险

1. Obsidian CLI 可以 dispatch `notemd:export-slides`，但没有 export-complete handshake；因此维护者 verifier 仍比 host-command smoke 更强。
2. 超出当前支持集的 richer custom/component-heavy layout 仍可能需要 manual review 或新增 patcher 支持。
3. Full-deck Playwright 验证比代表性抽样慢，但削弱它会回到最初的“能 build 不代表能看”的误判。
4. 仓库历史里已经存在 tracked `docs/dist` 和旧 `docs/export/test-*` 产物。本次 standalone 验收不继续扩大这个债务。

## 后续方向

1. 继续把 `npm run verify:slidev-export -- --format html --html-mode standalone --require-native-standalone --source architecture.zh-CN.md --json` 作为 native standalone 收口 gate；
2. 大型生成验收产物继续放在 repo 外，只提交验收索引与可复跑命令；
3. 后续新增 richer component/custom-layout fixture 时，必须落到明确的 patcher 边界，而不是只增加演示；
4. 如果准备给 Slidev skill 提 PR，范围应保持通用：完整 references、优先内置/配置主题、frontmatter 闭合、大内容 transform/zoom 建议、浏览器抽样验证、输出目录清理。不要上游 NoteMD vault 路径、本地 fork 检测或本项目 fixture。
