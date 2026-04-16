# 2026-04-09 语言支持基线

此目录保存 language-support 多阶段改造的不可变**变更前**证据。

## 文件

- `environment-before.txt`：运行时与 CLI 环境快照（`node`、`npm`、`obsidian`、`obsidian-cli`）。
- `build-before.txt`：改动前 `npm run build` 输出。
- `targeted-tests-before.txt`：改动前的定向回归测试输出。

## 当前基线解释

- 该基线上的定向测试为 PASS。
- 该基线上的构建为 FAIL，原因是 `ref/notebook-navigator` 被 `tsconfig` 的 glob 模式纳入编译范围，从而触发 TypeScript `TS6059`。
- 这个构建问题被视为已知基线约束；如果 `ref` 参考目录仍保留在仓库中，必须在计划中的 Task 9 Step 1 解决（将 `ref/**` 排除出 TypeScript 编译范围）。

## 使用规则

对于每个实现任务，都应在此目录下新增成对的 `taskN-before.txt` 与 `taskN-after.txt` 日志，并在合并前执行直接对比。

## 最终门禁快照（2026-04-09）

- `task9-build-after-docs.txt`：最终 `npm run build` 结果。
- `task9-targeted-matrix.txt`：workflow/sidebar/provider/language 回归矩阵。
- `task9-full-runInBand.txt`：完整 Jest 运行结果。
- `task9-regression-baseline.txt` 与 `task9-regression-compare.txt`：脚本化 baseline 与 compare 结果。
- `task9-git-diff-check.txt`：空白符与 patch 安全检查。
- `task9-obsidian-help.txt` 与 `task9-obsidian-cli-help.txt`：Obsidian CLI 可用性证据。

本次运行的环境说明：

- 当前环境中未安装 `obsidian-cli`（`command not found`）。
- `obsidian help` 可以执行，但可能因宿主环境为桌面或 headless 场景而输出额外提示。
