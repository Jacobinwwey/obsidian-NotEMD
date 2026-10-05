# 1.9.11 发布验收

## 范围

发布 Drawnix 关系排布与路由、通用 SVG 转 PDF 准备、会话日志保留和诊断默认折叠分组。[恢复验收](./drawnix-export-recovery-acceptance.zh-CN.md)包含根因、原样本测量和真实 Obsidian 1.13.7 CLI 导出证据。全程不使用 computer-use 或桌面界面自动化。

## 文档

版本元数据、中英文发布说明、31 份根目录 README 手册和网站 34 个语言版本同步更新。图形与配置手册说明一致。翻译由主助手直接编写、审阅，没有调用翻译 API、LM Studio 或委派翻译。语言审阅哈希覆盖对应源文与译文，不宣称经过独立母语审阅。

## 验证与发布

诊断专项回归在原平铺列表上失败，分组后两个套件的 42 项测试通过。真实 Obsidian CLI 确认候选版本将 10 条记录分为 3 个默认关闭的分组，全部消息保留；面板高度从展开约 953 px 降至收起约 184 px。

生产构建、UI/render-host 审计和 lint 增量检查通过。首轮发布全量测试发现 README 页脚/欢迎页版本遗漏，以及网站并行编译期间的两项超时（发布器子进程 20 秒期限与浏览器关闭）。版本展示已修正；版本契约、SVG 安全套件与发布器成功路径在定向复测中通过。公开发布前必须获得一次完整 CI 通过。99 条更新的语言审阅凭据与源文及译文一致。本候选提交时，网站构建/导航检查和远端发布尚待完成。

发布提交后确认工作区干净，并要求 main 的 Linux/Windows 验证工作流通过。推送对应标签，由唯一 Release Actions 工作流运行仓库发布器，不同时启动本地发布器。发布器在公开前下载并校验 main.js、manifest.json、styles.css 和 README.md 的哈希。核实公开发布及 chronicle 后续任务，再显式在 main 触发 deploy-docs.yml，检查线上版本和各语言页面。

## 已完成的发布检查

- 候选提交：`473eae05f89310cdcdcb74107164221a20bd1887`，无分歧集成到远端 main。
- [候选 CI](https://github.com/Jacobinwwey/obsidian-NotEMD/actions/runs/37266034837)与 [main CI](https://github.com/Jacobinwwey/obsidian-NotEMD/actions/runs/37267099683)的 Linux、Windows 均通过。各执行 306 个套件；Linux 2,977 项测试全部通过，Windows 2,976 项通过、1 项平台跳过。21 个文件的 lint 增量检查没有新增问题。
- 网站完整 34 语言构建与构建审计通过。导航/可访问性检查覆盖 96 个页面，零失败。
- 干净候选工作区的离线发布预检通过。原生诊断验收使用已安装的 1.9.11 候选版本；之后仅补充欢迎页版本摘要，由版本契约测试与两轮完整 CI 覆盖。
- Release 工作流首轮已创建草稿，但紧随其后的 API 查询未读到草稿。检查确认来源凭据一致且没有资产；由同一发布器按未变更标签重试，没有替换公开资产。

## 发布结果

[Notemd 1.9.11](https://github.com/Jacobinwwey/obsidian-NotEMD/releases/tag/1.9.11) 已公开。[Release 工作流](https://github.com/Jacobinwwey/obsidian-NotEMD/actions/runs/37267164141)第二轮完整成功，包含 chronicle 刷新（`a495a0d0`）。独立下载的四个资产均与来源凭据哈希一致：

| 资产 | SHA-256 |
| --- | --- |
| main.js | `74bbbdf6f423ebe89e7d581624dc3617efb134fa11b896b14db05c855c5908a7` |
| manifest.json | `5f2c326586b4b5c3ba8e0f2f5d7f14ba2e6558aa615574bc83152cfe3f986e24` |
| styles.css | `56c855d9e8f3f2bdbee8b7b75ae90ffeff00001f296bae6dbed345d52ed401ee` |
| README.md | `0d8fb1b136a413247ad4fd45e4f3348785e221a341146009a039d1b8c187bd31` |

首轮自动 Pages 构建通过，但部署门禁正确拒绝了当时尚未公开的版本。发布后通过 [deploy-docs.yml](https://github.com/Jacobinwwey/obsidian-NotEMD/actions/workflows/deploy-docs.yml)显式部署，线上指南为 [1.9.11](https://jacobinwwey.github.io/obsidian-NotEMD/zh-CN/docs/releases/1.9.11)。历史 1.9.10 资产没有修改。

## 保留的限制

原生 Drawnix 箭头重排后仍为静态坐标。布局优化有计算预算，不保证全局最优。日志跨会话内动作和视图重建保留，不跨插件重载保存。超大 PDF 页面等比例缩放。保留现有设置、原文、生成文件、净化规则和导出契约。
