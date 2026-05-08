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
npm run chronicle:sync-repo-saga
npm run chronicle:update
npm run build
npm test -- --runInBand
npm run audit:i18n-ui
npm run audit:render-host
obsidian help
obsidian-cli help
git diff --check
```

如果本地环境缺少 `obsidian-cli`，请在发布说明或交接证据中明确记录。
如果改动触及图表语义，还必须执行 `docs/maintainer/diagram-semantic-verification.zh-CN.md` 中定义的维护者本地语义核验层。
推荐辅助命令：
```bash
npm run verify:diagram-semantics -- --vault "<vault-name>" --commit "<sha>" --version "<plugin-version>" --output ~/tmp/notemd-diagram-check.md
```
该 helper 会从 `esbuild.config.mjs` 提取当前打包入口/输出事实；评估 renderer 边界声明时，应以该配置文件为打包真值源。
对于 renderer 相关改动，还应把 helper 生成出的 packaging-boundary 区块视为必填真值维护项：`npm run audit:render-host` 并不等于真正的重型运行时隔离已经完成，它当前只证明内联 `srcdoc` host 仍按既有契约自包含于 `main.js`。

## 3. 版本同步

发布前请确保以下文件版本一致：

- `package.json`
- `manifest.json`
- `versions.json`
- `README.md`
- `README_zh.md`
- `change.md`

Release tag 必须使用纯数字 `x.x.x` 格式，不能加 `v` 前缀；Obsidian 社区插件发布仅接受数字版本 tag。

## 4. Release Notes 契约

发布说明现已拆分为两个完整文件：

- 英文：`docs/releases/<tag>.md`
- 简体中文：`docs/releases/<tag>.zh-CN.md`

两个文件都必须独立可读。发布 GitHub Release 时，由仓库内辅助脚本组合为一个双语 release body。

## 5. GitHub Release 资产要求

Release 必需资产：

- `main.js`
- `manifest.json`
- `styles.css`
- `README.md`

## 6. 发布命令

```bash
npm run release:github -- <tag>
```

该辅助命令会在调用 GitHub 前强制校验必须打包的资产，以及两份已提交的 release notes：

- 如果 release 尚不存在，则会先组合 `docs/releases/<tag>.md` 与 `docs/releases/<tag>.zh-CN.md`，再执行 `gh release create ... --verify-tag`。
- 如果 release 已存在，则执行 `gh release upload ... --clobber`。
- 如果 tag 不是纯数字 `x.x.x`，则立即失败。

第二条路径就是这类问题的修复路径：release 文案已发布，但插件安装资产未上传时，可直接补传。

## 7. CI 自动化

仓库现已内置 `.github/workflows/release.yml`：

- 推送 git tag 时自动发布 release。
- 通过 `workflow_dispatch` 并传入纯数字 `x.x.x` 的 `tag` 参数，可在 CI 中修复已有 release。
- 同一个工作流现在会在发布后重新生成季度版发展编年史，刷新所有根目录 `README*.md` 中的编年史区块，重写每个语言对应的 `docs/repo-saga/notemd-development-history.<locale>.svg`，同步刷新英文别名 `docs/repo-saga/notemd-development-history.svg`，并将这次纯文档更新推回 `main`。
- `npm run chronicle:sync-repo-saga` 会把当前依赖的两条上游 `repo-saga` 分支组装成 `.cache/repo-saga-upstream`：`feat/timeline-granularity` 提供季度切片能力，`feat-locale-i18n` 提供语言扩展能力。
- 该工作流**不会**在 `main` 的普通 push 或 PR 上自动运行；合并前验证仍需在本地执行。
- `main` 当前没有 branch protection，也没有普通 push/PR workflow。如果 commit-status API 在 `main` 上显示 `pending` 且 `statuses=[]`，应以 GitHub Actions runs 与 `check-suites` / `check-runs` 结果作为真实状态来源；release tag 触发的运行仍可能把成功 checks 挂到同一个 commit 上。
- 工作流现已固定使用 `actions/checkout@v6` 与 `actions/setup-node@v6`，避免继续保留旧版 Node 20 JavaScript-action 运行时弃用告警。
- 发布 job 会执行 `npm ci`、`npm run build`、`npm test -- --runInBand`、`npm run audit:i18n-ui`、`npm run audit:render-host`、`git diff --check`，最后执行 `npm run release:github -- "$TAG_NAME"`。
- 随后的编年史 job 会在 `main` 上执行 `node scripts/repo-saga/update-quarterly-saga.mjs --tag "$TAG_NAME"`，如果 `README*.md` 编年史区块或多语言季度 SVG 有变化，就自动提交并推送。
- 编年史刷新脚本本身现在也会先重建本地 `repo-saga` 集成缓存：以时间粒度分支为基底，再覆盖 locale/i18n 分支对应文件，然后才调用 `repo-saga` CLI。
- 这套脚本现在还补上了包管理器 fallback 的稳健性：如果环境里只有 `corepack` 或 `bun x pnpm`，脚本会额外创建一个可被子进程继承的本地 `pnpm` shim，确保上游 `repo-saga` workspace build 中嵌套调用的 `pnpm` 脚本在 CI 里仍然能执行。
- 工作流会在 checkout 与 publish 前校验 `^[0-9]+\.[0-9]+\.[0-9]+$`，因此会拒绝 `v1.8.2` 这类 tag。

工作流刻意复用仓库内的 release 辅助脚本，而不是在 YAML 中重复维护资产清单或 release notes 逻辑，避免两套规则漂移。

## 8. 图表语义层

凡是会影响 renderer 行为的改动，都还需要仓库 CI 之外的一层验证：

- 使用 `docs/maintainer/diagram-semantic-verification.zh-CN.md`
- 如需可复用的交接模板，可先执行 `npm run verify:diagram-semantics -- --vault "<vault-name>" --commit "<sha>" --version "<plugin-version>" --output ~/tmp/notemd-diagram-check.md`
- 在真实本地 vault 中验证受影响的 Mermaid / JSON Canvas / Vega-Lite 路径
- 在 release handoff 或 PR 说明中记录证据

当改动触及图表生成或预览行为时，仅靠自动化检查并不足够。
