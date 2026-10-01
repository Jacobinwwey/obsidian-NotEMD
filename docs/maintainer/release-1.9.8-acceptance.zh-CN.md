# 1.9.8 发布验收

语言：[English](./release-1.9.8-acceptance.md) | **简体中文**

## 公开交付

V0–V6 已完成。[1.9.8](https://github.com/Jacobinwwey/obsidian-NotEMD/releases/tag/1.9.8) 已公开，标签提交为 `4ac48b59e6f95b4cfa737f1c86b542673ecd1e56`。候选 Linux／Windows Node 20 CI 和 main 复核均通过；四项下载资产与标准 Linux 发布构建哈希一致，两段完整语言说明与标签源码一致。Pages [运行 36825274177](https://github.com/Jacobinwwey/obsidian-NotEMD/actions/runs/36825274177) 部署 `31811dffe0c60f70358f504d975ed9fa9ac61497`，34 语言共 850 个线上 HTML 和 4 个发现文件与该工作流产物逐字节一致；102 个脚本／样式文件也与产物一致。仓库首页和官方 Obsidian 目录入口已核验。

发布工作流第一次尝试在创建草稿后停止，随后已能读取来源正确的空草稿。第二次沿用相同来源，核验上传／下载字节后公开发布并刷新编年史，未替换标签或公开资产。发布前自动触发的 Pages 任务已取消，验收采用显式的发布后部署收据。后续编年史提交为 `31811dffe0c60f70358f504d975ed9fa9ac61497`，仅更新 README／SVG 文档，未改变网站或运行时源码。

正式下载的运行时文件已安装到用户指定的 1Knowledge Vault。CLI 键盘和全部五类持久化竞态再次通过，原设置文件字节保留。实体移动设备、最低宿主兼容性及下述原生输出／检索限制继续明确保留。

[完整收据目录](./evidence/2026-10-01/candidate.json)保留本地来源哈希与远端身份，公开产物以 [public-release.json](./evidence/2026-10-01/public-release.json) 为准。

## 本地门禁

| 门禁 | 证据 |
|---|---|
| 插件 | 新鲜类型检查／构建通过；289 个 Jest 套件、2703 项测试通过、零失败，Windows 跳过一项 POSIX 专属测试；UI 文案、render-host 打包和 lint 回归检查通过 |
| 网站 | Node 24.14.0 构建与严格审计通过，覆盖 24 篇英文和 792 篇直接撰写译文，34 组首页／导航齐全 |
| 键盘及无障碍 | [816 场景](./evidence/2026-10-01/website-navigation.json)，每语言八个目的页、390／768／1440px，零失败；检查真实有界 Tab 导航、键盘 Enter、溢出、严重／关键 axe 问题、表头实际绘制和 RTL 标识符字形顺序 |
| 文档 | 31 份 README 首屏及相关说明完成；155 项专项测试和 464 项已撰写条款检查通过；双语配对契约、VitePress 构建及两项图表归档检查通过 |
| 原生导出 | 十页 PowerPoint 导出和未放宽的视觉匹配门禁通过；六个 CircuitikZ 黄金模板、五种方向变体编译成功 |

已目视检查最终[中文首页](./evidence/2026-10-01/zh-CN-390-home.png)和[波斯语 Agent 指南](./evidence/2026-10-01/fa-390-agents.png)。较早采用强制焦点的浏览器运行仅作为历史布局证据；最终收据使用真实 Tab。译文由 Codex 直接撰写／复核，未调用翻译端点，不等同于独立母语人工审校。

反例覆盖错误发布版本、缺失产物／语言、损坏的受众链接、过时默认工作流、不安全的公开 CLI 声明、Tab 被阻止、焦点循环和持续变化的无界焦点。这些用例均纳入通过的 Jest 门禁；原生反例另列于下方。

## 1Knowledge 中的 Obsidian CLI

用户明确指定已打开的 `1Knowledge` Vault，并要求仅使用 CLI。官方 `Obsidian.com` 命令在 Windows 的 Obsidian 1.13.7／Electron 39.8.3／Chromium 142 中实际执行；独立的 `obsidian-cli` 不可用。测试仅操作名称唯一的夹具目录，从未把用户整个 Vault 标记为可丢弃。设置备份保持私有，不进入受版本控制的证据。

- [宿主收据](./evidence/2026-10-01/obsidian-host.json)：两个并发回环请求在 44ms 内取消，无生成／移动文件，活动任务归零，迟到响应未修改源文；外部编辑和恢复前像得到保留，后续保存成功；五类 Mermaid／Vega／Drawnix 预览通过。
- [工作流收据](./evidence/2026-10-01/obsidian-workflow.json)：实际默认 `One-Click Extract::process-current-add-links>batch-generate-from-titles>batch-mermaid-fix` 使用两次本地夹具模型调用完成。源文不变，处理后的 wikilink 副本及 `concepts_complete` 笔记正确。四个注册的公开导出回调均执行，脱敏导出未包含夹具密钥；原设置恢复且插件空闲。
- [持久化收据](./evidence/2026-10-01/obsidian-persistence.json)：原子／旧式／二进制写入期间移动、补偿期间移动／替换，共五类竞态拒绝不安全写入，保留移动内容与恢复前像，队列仍可用。设置文件字节未变。
- F19：原生 Escape 最初同时关闭历史抽屉和父预览（[失败证据](./evidence/2026-10-01/obsidian-keyboard-before.json)）。Obsidian 在 DOM 冒泡前处理键盘 Scope，原 DOM 测试未覆盖这一边界。抽屉现在仅在打开期间持有独立 `Scope`，关闭／销毁即释放；新增 Chromium 回归修复前失败、修复后通过，历史键盘测试共十一项通过。
- [原生键盘重检](./evidence/2026-10-01/obsidian-keyboard-after.json)：CLI `dev:cdp` 输入验证连续 `abc`、十二次 Tab、首次 Escape 仅关闭历史并恢复入口焦点、第二次 Escape 关闭预览，全部通过。[重载收据](./evidence/2026-10-01/obsidian-installed-candidate.json)确认已安装修复构建且设置字节不变。

宿主／工作流探针在独立的 F19 修复前运行，构建为 `dbccc6d3…`；持久化与键盘重检使用 `3cb3b066…`。F19 修复后完整构建／Jest／lint／审计通过。真实用户 Vault 的激活 p95 为 549.8ms，不能与空白测试 Vault 的预算直接比较；未强制 GC 的堆样本不证明内存保留情况。独立冻结检索基准覆盖 12 文件／16 段，构建 p95 为 1.453ms、Top-3 查询 p95 为 0.119ms；这些观察不承诺任意 Vault 的性能。

## 原生消费应用结果

[PowerPoint 16.0 build 14332](./evidence/2026-10-01/office-export.json)完整导出与视觉比较通过。第一次运行实际导出成功，但 Slidev 环境探针报告不可用；完整重跑检测到 Slidev 52.16.0，未修改阈值即通过。已保留[可编辑导出文件](./evidence/2026-10-01/office-export.pptx)及[保存后重开文件](./evidence/2026-10-01/office-roundtrip.pptx)。[往返收据](./evidence/2026-10-01/office-roundtrip.json)确认一处单元格编辑、十页幻灯片、两张原生表格，前后均有六个 CJK 表格单元格。合并行分隔线在[导出文件](./evidence/2026-10-01/office-border.json)和[重开文件](./evidence/2026-10-01/office-reopened-border.json)均通过；历史缺陷文件因分隔线缺失／绘制混合被[再次拒绝](./evidence/2026-10-01/office-before-negative.json)。

[六个 CircuitikZ 模板](./evidence/2026-10-01/circuitikz-golden.json)及[五种方向变体](./evidence/2026-10-01/circuitikz-orientations.json)均通过缓存 Tectonic 编译并生成非空 PDF。方向变体保留拓扑，使用离线／不可信输入模式编译。Windows 仍发出 Fontconfig 配置警告；编译成功不代表环境完全无警告。

## 发布提交清单与交付收据

[计划清单](../plans/2026-09-13-001-feat-1-9-8-release-docs-geo-plan.zh-CN.md)已登记从 `1.9.7` 至 `291ea45` 的全部十四个提交，包括合并记录。后续 `71a1f32` 增加候选来源校验、草稿／下载哈希检查及可复现发布流程。当前候选增加最终 I/O 取消检查、翻译目录竞态处理、历史键盘／焦点修复、统一版本事实、受众入口、所有语言／README 撰写及严格网站／发布门禁。合并记录不重复计算功能。

完整[十六项提交清单](./evidence/2026-10-01/release-ledger.json)在十四项基线后补入 `71a1f32` 与 `4ac48b5`。[候选 CI](https://github.com/Jacobinwwey/obsidian-NotEMD/actions/runs/36823159948) 两个平台均通过 289 套件：Linux 2706 项测试，Windows 2705 项及一项 POSIX 跳过；[main 复核](https://github.com/Jacobinwwey/obsidian-NotEMD/actions/runs/36823959893)亦通过。[Release 工作流](https://github.com/Jacobinwwey/obsidian-NotEMD/actions/runs/36824052373)、[Pages 工作流](https://github.com/Jacobinwwey/obsidian-NotEMD/actions/runs/36825274177)、[线上哈希](./evidence/2026-10-01/live-pages.json)及[部署身份](./evidence/2026-10-01/pages-deployment.json)关闭 V5／V6。按时间保留失败的准备／草稿读取结果，不把重试描述成首次成功。

## 限制

实体移动设备和 Obsidian 0.15.0 未验证。Drawnix 重排后的跨枝附着箭头仍不支持；PPTX 中 Mermaid／SVG 可保留为图像回退。冻结词法检索 Top-3 正例召回为 7/9，不是语义检索证据。取消不承诺回滚或停止上游计费。搜索索引／引用尚未测量，不作为发布门禁。
