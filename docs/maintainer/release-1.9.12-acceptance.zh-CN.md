# 1.9.12 实施与发布验收

## 范围与机制

1.9.11 的预览已按标签分组诊断，但外层容器始终可见。新增原生外层折叠控件后，无错误时仅保留摘要。初始展开状态由已有诊断计数提供。分组键现同时包含严重级别和标签，只有错误分组默认展开，避免混合级别标签中的警告看起来像错误。不修改诊断生成器、导出操作或诊断记录。

## 验证

新增无错误/有错误展开断言在旧容器上失败，混合级别测试在修复分组前也失败。修复后预览与诊断两个套件的 45 项专项测试通过。最终发布已通过生产构建、Linux/Windows 完整 CI、lint/UI/render-host 审计及网站全部语言检查。原生 CLI 验收检查了无错误的紧凑面板，没有重新生成图形或调用 provider。

本地验证通过：生产构建；306 个 Jest 套件、2,983 项测试通过、1 项平台跳过；451 项诊断/版本/文档专项测试；UI/render-host 审计；三个文件的 lint 增量检查零新增问题。官方 Obsidian CLI 验证已安装的 1.9.12 候选版本：10 条真实诊断记录完整保留于三个收起分组，外层区域也默认收起。收起高度约 48 px，全部展开约 932 px。单元回归另验证仅错误分组展开，包括同一标签混合不同级别的情况。

## 文档与发布

1.9.11 公开后，用户选择另发 1.9.12，已保留 1.9.11 资产。已同步元数据、欢迎摘要、变更日志、成对发布说明、31 份 README 手册和网站 34 个语言版本。全部翻译更新由主助手直接编写，没有调用翻译 API 或 LM Studio。

## 最终发布证据

- [候选 CI](https://github.com/Jacobinwwey/obsidian-NotEMD/actions/runs/37272307032) 与 [main CI](https://github.com/Jacobinwwey/obsidian-NotEMD/actions/runs/37274414616) 的 Linux、Windows 验证均成功。每个平台均通过 306 个套件：Linux 通过 2,984 项测试；Windows 通过 2,983 项，另有一项平台跳过。
- [网站候选检查](https://github.com/Jacobinwwey/obsidian-NotEMD/actions/runs/37272400096) 通过 34 个语言版本的构建与审计，以及 96 个页面的导航/无障碍检查，零失败。
- [Notemd 1.9.12](https://github.com/Jacobinwwey/obsidian-NotEMD/releases/tag/1.9.12) 于 2026-10-05 通过[仓库 Actions 发布器](https://github.com/Jacobinwwey/obsidian-NotEMD/actions/runs/37274489101) 公开发布，标签提交为 `0f493b8d3cd60553e5a517660ca1a729ce4acdfc`。四个必需资产已独立下载并完成下表所列 SHA-256 核验。工作流也成功刷新了 chronicle。
- 发布器首次执行时创建的草稿未立即被后续查询读到。确认该草稿尚未公开且没有资产后，重跑失败的工作流任务即成功。沿用同一发布器与标签，没有替换任何公开资产。
- 确认 Release 已公开后，使用已验证的网站构建产物显式重跑 [Pages 部署](https://github.com/Jacobinwwey/obsidian-NotEMD/actions/runs/37274414551)，部署成功。34 个语言的线上发布页面均返回 HTTP 200，标题均为 1.9.12，包括[英文页](https://jacobinwwey.github.io/obsidian-NotEMD/docs/releases/1.9.12/)和[中文页](https://jacobinwwey.github.io/obsidian-NotEMD/zh-CN/docs/releases/1.9.12/)。
- 正式发布的 `main.js`、`manifest.json` 和 `styles.css` 已安装到本地 `1Knowledge` Vault，并通过官方 Obsidian CLI 重载。安装文件与公开资产的哈希一致。原生验收再次确认 10 条记录完整保留于三个默认收起的分组，整个面板默认收起（高度 47.6875 px，全部展开为 931.7916870117188 px）。该真实样本有零条错误、两条警告和八条信息；仅错误分组自动展开的行为由专项回归单独验证。

| 公开资产 | SHA-256 |
| --- | --- |
| `main.js` | `f4b96e4c85205efc74bc9958161d999ef17074cf994d0db810884bc786775e99` |
| `manifest.json` | `3556d65102baf9148b6053a7822abc2f4b3105c5f66b8859b88b3f7d469af17b` |
| `styles.css` | `eb2ac6c22652b2755ab70a82481fe3f45280f941b60f0f4e53efc6370e243fd1` |
| `README.md` | `7c4fadfd2ddd6a15b362533a78168aa91d1197153f2d4ab5ca689231f7922f78` |

本地证据保留在 `.cache/drawnix-task-regression/`：`public-release-1.9.12-verified.json`、`installed-public-release-1.9.12.json`、`published-pages-1.9.12.json` 和 `native-diagnostics-1.9.12.json`。本次最终验收记录不改变已发布的标签、资产或网站源文。

[1.9.11 恢复验收](./drawnix-export-recovery-acceptance.zh-CN.md)继续作为排布、PDF 和任务日志行为的证据；本次补充仅调整折叠默认状态。
