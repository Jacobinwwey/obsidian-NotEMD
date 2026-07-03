---
date: 2026-07-02
topic: mainline-ci-geo-cli-slidev-closeout-plan
canonical: true
status: completed
---

# 主线 CI、GEO、CLI 与 Slidev 收口方案

语言: [English](./2026-07-02-mainline-ci-geo-cli-slidev-closeout-plan.md) | **简体中文**

## 范围

本方案用于收口当前 `main` 对齐批次，覆盖四个相互关联的面：

1. 远端 `main` CI 与 GitHub Pages 部署真值；
2. GEO / 公开文档站源码真值；
3. CLI 与 maintainer automation 的命令解析真值；
4. Slidev 导出环境探测与 HTML 输出路径真值。

本方案不把 maintainer-only CLI operations 提升为 public user API，也不重开 Slidev 布局质量路线图；只有当进程启动问题影响环境探测时，才触及 Slidev 导出链路。

## 基线发现

| 区域 | 发现 | 当前解释 |
|---|---|---|
| 远端 Pages CI | 失败 run `27451762938` 失败在 `actions/deploy-pages@v4`，报错为 `HttpError: Not Found`，并出现 GitHub 的“enable Pages”提示 | 历史 repository settings / Pages availability 问题，不是当前源码失败 |
| 近期 Pages deploys | 最近 `main` 上 Pages workflow 为绿色，包括 `28281641014` | Pages 源码门禁当前健康 |
| 当前基线 commit | 排查时 `eb777ef` 没有关联 check-runs，也没有 legacy statuses | 未发现当前失败中的 CI context |
| Windows Slidev probe | Obsidian 在环境检测时报 `spawn EINVAL` | Windows 直接进程启动没有处理 `.cmd` / `.bat` shim |
| Linux/macOS 行为 | POSIX direct exec 一直可用 | 不应在 direct exec 已经正确的平台额外加 shell 层 |
| Windows shell fallback | 全局 `shell: true` 会破坏 JSON、复杂引号和 `code=...=>...` 参数 | 只对解析出的 `.cmd` / `.bat` 文件使用隔离 batch-file adapter |

## 实施方案

| 步骤 | 具体动作 | 状态 |
|---|---|---|
| 1 | 在 `scripts/lib/cross-platform-command.js` 集中 Node 侧跨平台命令执行 | 已实现 |
| 2 | 更新 release、repo-saga、maintainer、package-manager 与 Slidev verification scripts，统一使用共享命令适配器 | 已实现 |
| 3 | 在 `src/slideExport/platformUtils.ts` 加固插件侧 Slidev 环境探测：direct exec first、Windows `PATH` + `PATHEXT` 解析、Node script 走 `process.execPath`、batch shim 走带 quoting 的 `cmd.exe /d /s /c call` | 已实现 |
| 4 | 将 HTML `index.html` 输出发现收敛到 `src/slideExport/htmlExportPaths.ts`，统一处理 Windows 与 POSIX 路径分隔符 | 已实现 |
| 5 | 让 Mermaid post-fit injection 由 exporter 路径统一负责，不再在 `src/main.ts` 里重复修改 standalone HTML | 已实现 |
| 6 | 更新 CLI、Slidev workflow、GEO roadmap、Pages measurement log、website README 与 `llms.txt`，同步新的源码真值 | 已在本文档批次实现 |
| 7 | 执行源码验证：Jest、插件构建、Pages build/audit、diff whitespace check，以及 Obsidian CLI/runtime smoke checks | 已于 2026-07-03 在本地验证 |
| 8 | 提交并推送到 `main`；因为已改动 `website/**`，推送后观察 Pages workflow | 已于 2026-07-03 完成（`b09d286`，workflow run `28641376675`） |
| 9 | 确认最终本地工作区 clean 且与 `origin/main` 对齐 | 已于 2026-07-03 完成 |

## 架构方向

命令解析架构应继续按职责拆分：

1. `src/slideExport/platformUtils.ts` 负责插件/runtime 内的 Slidev export probe 与 export subprocess；
2. `scripts/lib/cross-platform-command.js` 负责 release、maintainer、repo-saga 与 package-manager automation 的 Node script 执行；
3. Windows batch execution 是 `.cmd` / `.bat` shim adapter，不是默认执行模型；
4. POSIX 继续 direct exec，因为它保留正常 executable 与 shebang 行为；
5. public CLI promotion 继续 contract-driven，而不是 convenience-driven。

## 验证方案

本批次必须完成的本地检查：

1. `npm test -- --runInBand`
2. `npm run build`
3. `npm --prefix website run build`
4. `npm --prefix website run audit:build`
5. `git diff --check`
6. `obsidian help`
7. 若已安装则执行 `obsidian-cli help`；若未安装，明确记录缺失
8. `obsidian command id=notemd:probe-slide-export-environment`
9. `obsidian dev:errors`

推送后的远端收口：

1. 确认 push 落到 `main`；
2. 观察由 `website/**` 触发的 `Deploy Docusaurus to GitHub Pages` workflow；
3. 在最终状态中记录 workflow 结论与 URL。

## 2026-07-03 本地验证结果

源码侧收口所需的本地验证现在已经完成：

1. 通过仓库内本地 Node 运行时跑完整 Jest，193 个 suite、1570 个测试全部通过；
2. 通过 `tsc -noEmit -skipLibCheck` 与 production esbuild bundling，插件构建通过；
3. `npm --prefix website run build` 通过；
4. `npm --prefix website run audit:build` 通过；
5. 文档布局清理完成后，`git diff --check` 通过；
6. `obsidian help`、`obsidian commands filter=notemd` 与 `obsidian dev:errors` 都成功返回，但宿主会提示当前安装器较旧、CLI 能力有限；
7. 当前 Windows 环境里独立 `obsidian-cli` 未安装，因此它的缺失已经被明确记录为收口证据，而不是悬而未决的歧义；
8. `obsidian command id=notemd:probe-slide-export-environment` 已经通过官方 `obsidian` trigger surface 返回同样的安装器版本提示，这足以证明 trigger surface 存在，只是当前宿主无法给出更丰富的命令输出。

## 2026-07-03 远端收口结果

push 之后的跟进现在也已经收口：

1. commit `b09d286`（`chore(mainline): close out process alignment and archive root docs`）已经落到 `main`；
2. 本次 push 触发的 `Deploy Docusaurus to GitHub Pages` run `28641376675` 已成功完成；
3. 两个 workflow job 都通过：
   - `build` job `84938128239`
   - `deploy` job `84938347473`
4. 当前剩余的 GitHub 侧提示并不是源码失败，而是 Actions 的 Node 20 deprecation 注记：`actions/checkout@v4`、`actions/setup-node@v4`、`actions/upload-artifact@v4` 与 `actions/deploy-pages@v4` 都被 GitHub runner 策略强制跑在 Node 24 上。

## 本批之后的剩余工作

剩余工作属于外部测量和后续产品范围，不是当前源码修复：

1. 在 Search Console 提交或刷新 `sitemap.xml` 与 `zh-CN/sitemap.xml`；
2. 检查 canonical root、zh-CN root、FAQ、provider overview、一个 provider detail 与一个未发布 zh-CN fallback；
3. 抓取后重跑英文和中文 AI visibility prompts；
4. zh-CN 扩展继续绑定到已翻译、已审核、已声明的页面；
5. 未来任何 public CLI promotion 都必须在同批补齐 schema、副作用文档、确定性失败语义与用户文档。
