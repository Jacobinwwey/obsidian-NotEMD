# 语言支持发布交接（2026-04-09）

## 范围

本交接覆盖第一性原理语言支持改造：

- 语言域模型（`uiLocale` + 任务语言策略）。
- 带 locale fallback 的 UI i18n 基础设施。
- 设置页、侧边栏与错误提示等运行时字符串迁移。
- prompt 与处理流程中的统一语言决策路径。
- locale-aware 时间格式与 RTL-safe 样式保护。
- 脚本化 baseline/compare 回归工作流。

## 前后对比摘要

- 基线构建此前不稳定，原因是 `ref/**` 被纳入 TypeScript 编译范围，触发 `TS6059`。
- 当前构建范围已排除 `ref/**`；最终 `npm run build` 为 PASS。
- 定向行为矩阵在迁移前后均保持 PASS。
- 集成后的完整 `npm test -- --runInBand` 为 PASS。
- `git diff --check` 未发现格式问题。

## 最终验证证据

- Build：`task9-build-after-docs.txt`
- 定向矩阵：`task9-targeted-matrix.txt`
- 完整测试：`task9-full-runInBand.txt`
- 回归脚本：`task9-regression-baseline.txt`、`task9-regression-compare.txt`
- Patch 质量：`task9-git-diff-check.txt`
- Obsidian 命令检查：`task9-obsidian-help.txt`、`task9-obsidian-cli-help.txt`

上述文件均位于：

- `docs/superpowers/baselines/2026-04-09-language-support/`

## 剩余风险

- 环境依赖：当前执行环境缺少 `obsidian-cli`（`command not found`），因此 CLI 验证仍是不完整的。
- 宿主依赖：`obsidian help` 的行为可能在 headless 或桌面受限环境中发生变化。

## 发布就绪说明

- 代码与文档已经针对语言架构和回归流程保持同步。
- `README.md` 与 `README_zh.md` 已同时记录维护者发布约束：
  - 独立可读的中英双语 release 文案；
  - release 必需资产必须包含 `README.md`。
- 推荐发布门禁保持为：
  - `npm run build`
  - `npm test -- --runInBand`
  - `npm run regression:language-compare`
