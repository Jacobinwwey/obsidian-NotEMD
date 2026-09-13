# Notemd 发布流程（维护者）

语言: [English](./release-workflow.md) | **简体中文**

此文档面向维护者与贡献者，不面向普通最终用户。

## 1. 回归基线

先采集变更前基线：

```bash
npm run regression:language-baseline
```

完成改动后，与最新基线进行对比：

```bash
npm run regression:language-compare
```

## 2. 发布前验证门禁

执行：

```bash
npm run build
npm test -- --runInBand
npm run audit:i18n-ui
npm run audit:render-host
npm run lint:regressions -- --base-ref origin/main
obsidian help
obsidian-cli help
git diff --check
```

Release 公开后，串行执行 `npm run chronicle:sync-repo-saga` 与 `npm run chronicle:update -- --tag <tag>`，或交由发布工作流刷新。它们共享 `.cache/repo-saga-*` 状态，并强制使用 `.cache/.repo-saga-execution.lock`；如果残留锁文件，先确认没有任何 repo-saga sync/update 进程仍在运行，再手动移除。不得把旧编年史证据改标为尚未发布的版本。

如果本地环境缺少 `obsidian-cli`，请在发布说明或交接证据中明确记录。
如果改动触及图表语义，还必须执行 `docs/maintainer/diagram-semantic-verification.zh-CN.md` 中定义的维护者本地语义核验层。
如果改动触及 Slidev 导出接线、Slidev 设置、source preparation、本地 fork 探测，或 HTML/PDF/PNG/MP4 导出行为，还必须执行 `docs/maintainer/slidev-export-workflow.zh-CN.md` 中定义的维护者本地工作流：
```bash
npm run verify:slidev-export
```
该命令会有意在 `docs/export/` 下写出可检查产物；除非发布任务明确要求，不应把这些生成文件提交进 commit。
推荐辅助命令：
```bash
npm run verify:diagram-semantics -- --vault "<vault-name>" --commit "<sha>" --version "<plugin-version>" --output ~/tmp/notemd-diagram-check.md
```
如果不传 `--output`，helper 会直接把检查清单打印到 stdout，便于快速审阅；若 `--surface` 不受支持，则会快速失败，而不是静默生成残缺模板。
该 helper 会从 `esbuild.config.mjs` 提取当前打包入口/输出事实；如果顶层配置只是把构建入口/输出委托给共享 helper，则还会回退到 `scripts/lib/esbuild-bundle-config.js` 继续解析；同时它还会从 `src/rendering/preview/renderHostRuntimeClient.ts` 提取 latent runtime-module specifier 真值，从 `scripts/audit-render-host-bundle.js` 提取 render-host audit 真值，而 audit 的 marker / output / reference 规则由 `scripts/lib/packaging-contract.js` 统一提供；它还会从 `src/main.ts`、`src/ui/DiagramPreviewModal.ts`、`src/rendering/webview/page.ts` 与 `src/rendering/webview/renderFrame.ts` 提取 runtime-consumption 真值，从 `scripts/release/publish-github-release.js` 提取 release 打包契约事实，从 `.github/workflows/release.yml` 提取 release 触发、tag 防护、workflow-source 分支与 chronicle-target 分支契约事实，并从 `src/operations/registry.ts` 提取操作契约提升边界事实；评估 renderer 边界声明时，应以这些文件作为打包/契约真值源。
对于 renderer 相关改动，还应把 helper 生成出的 packaging-boundary、render-host audit、render-host runtime-consumption、implementation-readiness、packaging-contract、contract-promotion-boundary 与 Stage-C gate 区块都视为必填真值维护项：`npm run audit:render-host` 并不等于真正的重型运行时隔离已经完成，它当前只证明内联 `srcdoc` host 仍按既有契约自包含于 `main.js`，并会通过共享 packaging contract 拒绝当前主线上残留的 `render-host.mjs` 资产或引用。
在当前单入口主线上，这份 packaging-boundary 真值还要求 latent runtime helper 保持 fail-closed：除非 dedicated runtime asset 被显式配置并在同批真实发货，否则不得默认合成 standalone `render-host.mjs` module specifier。
它还要求当前 `main` 上的 `createRenderHostBundleBuildOptions()` 保持 candidate-only：除非 standalone render-host release assets、audit logic、maintainer/release docs 同批前进，否则 production `esbuild.config.mjs` 路径不得消费它。
packaging-contract 区块记录数字 tag、workflow tag-trigger glob、离线预览、候选版本归属、草稿验证、workflow-source 分支与 chronicle-target 分支；这些共同组成发布契约。

## 3. 版本同步

发布前请确保以下文件版本一致：

- `package.json`
- `package-lock.json`（根版本及根 package 版本）
- `manifest.json`
- `versions.json`
- `README.md`
- `README_zh.md`
- `change.md`

Release tag 必须使用纯数字 `x.x.x` 格式，不能加 `v` 前缀；Obsidian 社区插件发布仅接受数字版本 tag。

## 4. 文档翻译交付

1.9.8 及此政策下的后续工作，由 Codex 直接撰写和复核翻译。不得调用 LM Studio、外部翻译 API 或旧版 `translate-*.cjs --write` 命令。此撰写政策不改变插件对 LM Studio provider 的支持。

1. 翻译前，依据命令、默认值和实际支持行为校核英文源文档。
2. 冻结源 revision，再更新所有受影响的已发布语言。网站有 34 个 locale，插件 UI 有 21 个，两者不可混同。
3. 每种语言必须独立可读。保留可执行代码、command id、URL、MDX 和表格结构；旧指南误放进代码块的说明文字仍需翻译。
4. 记录源 revision，并逐语言复核修改内容。AI 撰写不等于独立母语人士审阅，也不会自动使一个 locale 获得搜索索引资格。
5. 运行 `npm --prefix website run build`、`npm --prefix website run audit:build`、仓库文档检查和 `git diff --check`；检查代表性 RTL、CJK 与窄屏布局。

工具可枚举文件、检查结构和渲染已撰写内容，但不得通过外部模型生成翻译。其他语言取得独立发布证据之前，保留当前索引政策。

## 5. Release Notes 契约

发布说明现已拆分为两个完整文件：

- 英文：`docs/releases/<tag>.md`
- 简体中文：`docs/releases/<tag>.zh-CN.md`

两个文件都必须独立可读。发布 GitHub Release 时，由仓库内辅助脚本组合为一个双语 release body。

## 6. GitHub Release 资产要求

Release 必需资产：

- `main.js`
- `manifest.json`
- `styles.css`
- `README.md`

## 7. 发布命令

```bash
npm run release:github -- <tag>
```

对维护者本地验证来说，`npm run release:github -- <tag> --dry-run` 是已检入的无网络证明路径：校验本地版本元数据、必需资产与双语说明，以 JSON 输出源 commit、工作树状态和资产 SHA-256。它不重新构建、不查询 GitHub，也不推断 Release 是否存在。未知、重复和多余参数会在外部命令执行前失败。

发布操作负责完整事务：

- 要求干净 checkout 位于本地 tag，版本元数据一致，远端 tag 解引用后的 commit 相同。鉴权、网络和服务器错误必须失败；按 tag 查询返回 404 后，还会查询已鉴权的草稿列表。
- 从干净的 tag 源码重新构建。工作流使用锁定依赖与 Linux Node 20 作为权威发布环境，Windows 独立验证行为。已有且被忽略的 `main.js` 不能证明归属。
- 冻结实际上传字节，组合两份说明，在 release body 的隐藏候选版本注释中记录源 commit 和 SHA-256。
- 以 `--verify-tag` 创建草稿，上传四项资产，重新下载核对状态与哈希后才公开。上传中断或哈希失败时保留草稿。
- 只恢复归属和双语正文完全相同的候选版本。草稿资产可以用同一候选版本字节替换；已公开资产必须匹配且不得覆盖，只允许补齐缺失项。没有匹配归属的历史 Release 不能由此 publisher 修复。

同 tag 的 Actions 运行串行执行。本地发布使用 `.cache/.release-<tag>.lock`，异常退出可能留下锁；确认其中记录的进程已停止后，才能删除该锁。使用单一 publisher，不得让本地发布与 Actions 竞争。公开后的代码修正需要新补丁版本，不得移动已发布 tag 或静默替换二进制。

## 8. CI 自动化

仓库现已内置 `.github/workflows/release.yml`：

- 推送 git tag 时自动发布 release。
- 通过 `workflow_dispatch` 并传入纯数字 `x.x.x` 的 `tag` 参数，可在 CI 中修复已有 release。
- 同一个工作流现在会在发布后重新生成季度版发展编年史，刷新所有根目录 `README*.md` 中的编年史区块，重写每个语言对应的 `docs/repo-saga/notemd-development-history.<locale>.svg`，同步刷新英文别名 `docs/repo-saga/notemd-development-history.svg`，并将这次纯文档更新推回 `main`。
- `npm run chronicle:sync-repo-saga` 会把当前依赖的两条上游 `repo-saga` 分支组装成 `.cache/repo-saga-upstream`：`feat/timeline-granularity` 提供季度切片能力，`feat-locale-i18n` 提供语言扩展能力。
- `.github/workflows/verify-plugin.yml` 在 Linux 和 Windows 上验证普通 PR 与 push，包括构建、全量 Jest、审计、lint 回归比较和 diff 格式。它与 tag 触发的 publisher 独立。
- 检查实际候选 commit 的 Actions runs 与 check-runs。工作流存在不等于分支保护或必需检查已启用；旧 commit-status API 没有 statuses 也不能直接推断失败。
- 工作流现已固定使用 `actions/checkout@v6` 与 `actions/setup-node@v6`，避免继续保留旧版 Node 20 JavaScript-action 运行时弃用告警。
- 发布 job 执行 `npm ci`，安装两个 Playwright 包锁定的 Chromium，构建、运行全量 Jest 和审计、检查 diff，再调用 publisher。publisher 再次构建，以证明被忽略 bundle 的来源。
- 随后的编年史 job 会在 `main` 上执行 `node scripts/repo-saga/update-quarterly-saga.mjs --tag "$TAG_NAME"`，如果 `README*.md` 编年史区块或多语言季度 SVG 有变化，就自动提交并推送。
- workflow-source checkout 分支与 chronicle push 目标现在会在 workflow 中分别显式命名为 `NOTEMD_RELEASE_WORKFLOW_SOURCE_BRANCH` 与 `NOTEMD_RELEASE_CHRONICLE_TARGET_BRANCH`，而仓库侧默认契约归 `scripts/lib/packaging-contract.js` 管。GitHub Actions 在首次 checkout 前仍需要 bootstrap env 值，但脚本、helper 输出与测试现在都把这些分支名作为 release-contract 真值处理，而不是各自维护 release 脚本默认值。
- release workflow 的 tag trigger 会继续保留 GitHub Actions bootstrap 字面量 `*.*.*`，但这条字面量的所有者现在是 `scripts/lib/packaging-contract.js` 中的 `RELEASE_WORKFLOW_TAG_TRIGGER_GLOB`；`RELEASE_WORKFLOW_DISALLOWED_TAG_TRIGGER_GLOBS` 会把 `v*.*.*` / `V*.*.*` 排除在触发列表之外。这个 wildcard 只决定 workflow 是否启动，真正的纯数字 `x.x.x` 准入仍由已检入的 tag validator 执行。
- 编年史刷新脚本本身现在也会先重建本地 `repo-saga` 集成缓存：以时间粒度分支为基底，再覆盖 locale/i18n 分支对应文件，然后才调用 `repo-saga` CLI。
- 编年史刷新脚本现在还会强制使用 `.cache/.repo-saga-execution.lock` 单实例执行锁，避免本地或 CI 并发刷新把共享缓存状态踩坏。
- 这套脚本现在还补上了包管理器 fallback 的稳健性：如果环境里只有 `corepack` 或 `bun x pnpm`，脚本会额外创建一个可被子进程继承的本地 `pnpm` shim，确保上游 `repo-saga` workspace build 中嵌套调用的 `pnpm` 脚本在 CI 里仍然能执行。
- 已检入的 `scripts/release/commit-chronicle-refresh.js` 入口现在也具备 process-level 回归锁定：覆盖 clean no-op、显式 `--target-branch` override、缺失参数失败路径，以及 git status 失败透传。
- 已检入的 `scripts/repo-saga/update-quarterly-saga.mjs` 入口现在也具备 process-level 回归锁定：覆盖 `--sync-only` 在 stamp 命中时的成功路径、已有执行锁时的快速失败、隔离的 `--no-readme --tag <tag>` 真实生成路径，以及缺失 `--tag` 值或未知参数时的快速失败，并可证明它会产出多语言编年史 SVG 而不会改动 README 文件。
- 工作流现在会在 checkout release ref 之前通过已检入的 `scripts/release/validate-release-tag.js` helper 做 tag 校验，因此 CI 与仓库内 release helper 复用同一套纯数字 tag 契约，并继续拒绝 `v1.8.2` 这类 tag。

工作流刻意复用仓库内的 release 辅助脚本，而不是在 YAML-local 脚本片段中重复维护资产清单、release notes 逻辑、tag 校验或 chronicle 目标分支默认值，避免多套规则漂移。

Release 与编年史验证后显式部署 Pages。`GITHUB_TOKEN` 创建的 Release 或 push 不会自动触发另一个 release/push workflow。网站将新版本标为稳定版之前，先确认公开 Release 可下载；部署后核对网页版本、canonical、语言政策和部署源码 revision。

## 9. 图表语义层

凡是会影响 renderer 行为的改动，都还需要仓库 CI 之外的一层验证：

- 使用 `docs/maintainer/diagram-semantic-verification.zh-CN.md`
- 如需可复用的交接模板，可先执行 `npm run verify:diagram-semantics -- --vault "<vault-name>" --commit "<sha>" --version "<plugin-version>" --output ~/tmp/notemd-diagram-check.md`
- 在真实本地 vault 中验证受影响的 Mermaid / JSON Canvas / Vega-Lite 路径
- 在 release handoff 或 PR 说明中记录证据

当改动触及图表生成或预览行为时，仅靠自动化检查并不足够。
