# Notemd 1.9.9 实施与验收

## 范围与发布顺序

从实现提交 `3a7f7169662612ac79c61018456ae799f1f6d6e6` 继续，更新当前手册、31 份 README、34 个公开网站语言、版本元数据与双语发行说明。全部翻译由主 Codex 会话直接撰写，不调用翻译 API、LM Studio，也不委派翻译。历史发布页面与证据保持原样。

先验证插件及两套文档构建，再推送 main；等待 Linux／Windows 验证后，通过已有 release 工作流作为唯一发布者发布 `1.9.9` 标签。工作流从干净标签源码重建，先上传草稿并核验下载 SHA-256，再公开。Release 及串行编年史刷新结束后，从 main 手动触发 Pages，并核查线上版本、升级路由和语言元数据。

## 实现证据

- 多类型生成、独立格式、按类型命名、紧凑实时预览、存储及关系标签修复均已在发布准备前完成，见[实施与真实 Vault 证据](../multiple-diagrams-implementation.zh-CN.md)。
- 实现通过 298 个套件、2,870 项测试，1 项既有跳过；[Linux／Windows CI](https://github.com/Jacobinwwey/obsidian-NotEMD/actions/runs/37115852934) 通过。
- 本次保留 1.9.8 公开资产和用户 Vault 文件／设置。文档准备不重复调用模型生成产物。

## 候选验证

- 插件生产构建通过。最终独立运行 Jest，通过 298 个套件、2,874 项测试，1 项既有跳过。首次与全网站构建并行运行时，两个浏览器套件出现 hook 超时，同时发现一条过时文档断言；修正断言并消除构建资源争用后，全量重跑通过。后续维护文档变更通过 9 项定向契约测试。
- lint 增量比较、界面字符串审计、render-host 打包审计及 `git diff --check` 均通过，无新增诊断。
- VitePress 构建通过；Docusaurus 使用 Node 24.14.0 完成全部 34 种语言构建，每种语言 25 篇源指南，共 850 个指南页面。标准生成 HTML 的 NUL 清理及网站内容／元数据审计通过。
- 全部 34 种语言、390／768／1440 像素宽度下的 816 个浏览器导航与可访问性场景通过，包括升级页面和深色模式供应商页面。三份报告分别包含 96、360、360 个场景，均无失败。
- 最终构建已通过官方 Obsidian CLI 重新加载至已打开的 `1Knowledge` Vault，返回版本 `1.9.9`、无进行中任务、设置字节未改变。已加载的 `main.js`、`manifest.json`、`styles.css` 与候选发布文件逐字节一致。独立的 `obsidian-cli` 可执行程序未安装，本次使用 `Obsidian.com`。
- 全部 272 个受影响网站页面与 31 份 README 已更新，译文由主会话直接撰写；对照内容后更新源文审核哈希。网站仍仅允许英文与简体中文索引；译文由 AI 撰写不等于独立母语审核。

本地收据保留于 `.cache/release199-*` 与 `.cache/verification/{website-navigation,release199-navigation-1,release199-navigation-2}`。

## 发布收据

- 发布源码及不可变标签 `1.9.9`：[`e2d696f3a39cc53eaf252ccb5c62ce6dbe4510bc`](https://github.com/Jacobinwwey/obsidian-NotEMD/commit/e2d696f3a39cc53eaf252ccb5c62ce6dbe4510bc)。[Linux／Windows 验证](https://github.com/Jacobinwwey/obsidian-NotEMD/actions/runs/37122671653)的两个任务均通过。
- [Release 工作流](https://github.com/Jacobinwwey/obsidian-NotEMD/actions/runs/37123106601)在第 2 次尝试完成发布及编年史刷新。第 1 次已创建正确的空草稿，但立即回读未找到它；后续认证查询确认来源记录匹配，重跑接续该草稿，没有移动标签或创建另一份 Release。
- [Notemd 1.9.9](https://github.com/Jacobinwwey/obsidian-NotEMD/releases/tag/1.9.9) 于 `2026-10-03T12:42:12Z` 公开，并独立确认是公开、稳定、最新版本。四个必需附件均再次下载，其大小和 SHA-256 与发布来源记录、GitHub 资产摘要一致。
- 工作流串行刷新编年史，产生提交 [`28737855da274ea596ddf790c163faba7196f64a`](https://github.com/Jacobinwwey/obsidian-NotEMD/commit/28737855da274ea596ddf790c163faba7196f64a)，本地 main 已快进同步。Release 中的 README 保持标签版本，main 随后更新编年史时间戳。
- [首轮 Pages 部署](https://github.com/Jacobinwwey/obsidian-NotEMD/actions/runs/37122671617)已从发布源码完成。线上 HTTP 核查通过 34 个本地化升级路由、英中主页、`llms.txt` 和 sitemap：共 38 个地址，UTF-8 有效，版本、canonical／alternate 元数据及索引策略正确。
- [发布后显式触发的 Pages 部署](https://github.com/Jacobinwwey/obsidian-NotEMD/actions/runs/37124523550)以编年史提交 `28737855da274ea596ddf790c163faba7196f64a` 为源码，构建、审计、浏览器检查和部署均通过。部署后再次核验全部 38 个线上地址，全部通过。最终仅记录收据的文档提交不改变已部署的网站源码或不可变 Release。

| 附件 | 字节数 | SHA-256 |
| --- | ---: | --- |
| `main.js` | 10136209 | `f4a34d74156c9d43108ae1cafd89d996f81576bb9b636a6f33b454d314b01b21` |
| `manifest.json` | 406 | `f5fa1d09105ee6b1f6f63a23eca907595e8f181de6ded1f20fe3edde91ea2d8c` |
| `styles.css` | 81537 | `f83670cf3fa12371cd252af0069b57d3071728cbd1d73523a2615ad7f532af51` |
| `README.md` | 105757 | `f8e396c33fa9b184f86f59e9b4fa82753436cb7236d2ee381a56a4b15ea8a73a` |

公开 CSS 使用 LF，本地 Windows 候选文件使用 CRLF；统一换行符后文本完全一致。公开 JavaScript 和 manifest 与本地已加载候选文件逐字节一致。未修改 1.9.8 公开附件或历史发行说明。

## 边界

真实 Vault 证据覆盖所记录的桌面 CLI 场景，不代表所有平台或所有模型响应。物理移动设备与 Obsidian 0.15.0 仍未验证；演示导出保留各自依赖。不能将已有证据改称本次重新运行了全部原生消费端测试。
