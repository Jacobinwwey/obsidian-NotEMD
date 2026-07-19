# 图形生成链路与网站 MDX 进度

语言：[English](./diagram-generation-chain-and-website-mdx-progress-2026-07-19.md) | **简体中文**

## CircuitikZ 根因

用户选择**电路图**和 **CircuitikZ** 后，当前生成链路不会复用旧 mindmap prompt。`applyDiagramIntentPreference()` 会固定 `circuitikz` 与 `best-fit`；`buildDiagramOperationInput()` 保留这一组合；`buildDiagramSpecPrompt()` 只允许 `circuit` intent，要求结构化 `circuitSpec` JSON，并明确禁止模型直接输出 TikZ。

但两个边界缺口仍可能导致已报告的失败：

1. 命令与维护者 CLI override 只携带 `requestedIntent`，没有显式携带 `requestedRenderTarget`；
2. 受约束 golden-template fallback 只在 JSON 解析完成后执行，模型一旦直接返回 `\\begin{circuitikz}`，会在进入 fallback 前失败。

现在两个边界都会保留显式 CircuitikZ target。对于可识别的受支持电路，raw TeX 或错误 JSON 会在渲染前进入确定性拓扑 catalog fallback。prompt 也增加了共源 NMOS 拓扑 contract；完整 LaTeX 文档仍只由 renderer 负责生成。

## 当前架构

`UI / 命令 / 维护者 CLI` → `DiagramCommandInputOverrides` → `buildDiagramOperationInput()` → `runDiagramGenerateOperation()` → Circuit-only `DiagramSpec` prompt → 响应解析或受约束电路 fallback → `CircuitikzRenderer` → 完整 `.tex` 与审阅 SVG → 预览、导出和历史。

这样可把拓扑决策留在 `CircuitSpec`，把语法输出留在确定性 renderer，把视觉审阅与导出留在预览平台。对于未支持的电路族，系统仍会明确失败，不会静默替换成无关的 golden circuit。

可选修复边界现在也已明确：`runCircuitikzRepairLoop()` 最多接受一次模型生成的 `CircuitSpec`，在导出前拒绝拓扑漂移，并且只有拿到新鲜的编译与 render-smoke 证据后才采用候选。本地渲染器不可用时不会运行，因此 Obsidian 的常规生成路径仍无额外依赖并保持失败关闭。

TeX Live 实测还暴露并修复了两个运行时缺口。所有 golden exporter 现在都从 `\\documentclass[border=8pt]{standalone}` 开始输出可独立编译的文档，因此标准 `pdflatex` 可以直接编译，并把 PDF 裁剪到电路边界。Obsidian 生成的 wrapper note 在写入预览历史前也会回溯其链接的 `.tex` 源产物；重新打开 companion SVG 时，CircuitikZ 不再退化成 `HTML / flowchart` 历史记录。

## 托管 LaTeX 环境与历史抽屉

插件不会把完整 TeX 发行版或可执行压缩包嵌入 `main.js`。桌面增强能力按顺序使用三类来源：用户指定可执行文件、固定版本的托管 Tectonic、系统中发现的 `tectonic` 或 `pdflatex`。安装只能由用户在 CircuitikZ 环境面板或命令面板中明确触发；常规预览、SVG、PNG 和预览 PDF 导出无需安装。

托管链路固定 Tectonic `0.16.9`，每次重定向都经过 HTTPS 主机白名单，限制下载体积并校验 SHA-256，拒绝不安全压缩路径和链接，在 staging 中编译六个确定性 CircuitikZ fixture 后才原子激活。取消、超时、checksum、smoke 或写入失败都会清理 staging 并保留旧的活动运行时。桌面命令使用参数数组和 `shell: false`，带 untrusted/no-shell-escape 参数、有限日志、超时与进程树终止。

托管运行时发现现在保持只读。会修改 pointer 的恢复、旧版 pointer 所有权登记、激活与删除都在文件系统锁内执行。即使已有目录中的字节相同，也只有有效 Notemd pointer 或安装目录内清单能够证明所有权、普通可执行文件摘要匹配且 POSIX 执行权限有效时才允许复用。环境面板还提供显式过期锁恢复：通过独占 contender 声明、稳定 token 与死亡 owner 复核清锁；清理期间若观察到替换 owner，则保留新锁。

最终所有权审查还关闭了两类删除竞态。现有可执行文件与安装目录必须在规范化 `realpath` 解析后仍位于运行时根目录内，因此符号链接或 Windows junction 不能把删除重定向到外部用户目录。过期锁清理会先把已声明目录原子移动到带 token 的隔离目录，再复核 owner、claim token 与死亡进程状态；即使替换锁在最终提交边界到达，也不会被删除。

历史无法滚动的根因不在分页或历史存储。右侧抽屉是 Grid item，默认 `min-height: auto` 会把所在行撑到完整历史高度，外层再裁掉 overflow。现在 drawer 设置 `min-height: 0`，body 负责 `overflow: auto` 与 `overscroll-behavior: contain`，并由 CSS 合同测试锁定该不变量。

## 网站 MDX 决策

网站目前包含 21 个英文规范 MDX 页面与 33 个已发布 locale 镜像，共 693 个本地化 MDX 文件。仓库测试要求所有发布 locale 镜像英文路由集合，Docusaurus 也把这些文件作为受跟踪发布输入。现在删除它们或停止同步会破坏本地化路由与发布合同。

因此：

- 在新的构建期 locale 生成方案替代现有合同前，继续跟踪现有 MDX 镜像；
- 行为变化时只更新英文规范页与确实人工维护的 locale 页面；
- 小型 UI 文案变化不机械重写全部 locale 镜像；
- 维护者架构与诊断细节放在 `docs/maintainer/`，公开图表页面只保留概念、操作步骤、限制与故障排查。

英文与简体中文公开图表页现在只用用户语言说明可选托管环境。根目录 README 设置指南已同步到全部支持语言；LM Studio `hy-mt2-7b` 只用于这些文档翻译。

## 验证

- 命令 Host target 传递已有直接回归测试；
- 维护者 CLI schema、帮助、bridge 与示例均公开 `requestedRenderTarget`；
- raw CircuitikZ 响应 fallback 已有回归测试；
- prompt 测试覆盖 circuit-only 结构化生成；
- 网站文档合同覆盖精简后的英文与简体中文用户指南。
- 有界修复闭环覆盖拓扑、解析、第二次验收和渲染器可用性的正反测试；
- common-source golden template 使用分离路径、更轻线宽、更小文字，并移除冗余源极标签。
- 环境测试覆盖编译器顺序、自定义/系统/托管发现、移动端失败关闭、固定资产元数据、安全下载/解压、取消清理、golden fixture 验收与环境面板状态；
- 托管运行时回归覆盖未拥有的同字节目录保护、POSIX 执行权限、旧版 pointer 迁移、只读恢复并发交错、显式过期锁恢复与替换锁保护、精确所有权删除，以及提交后清理诊断不改变安装成功状态；
- 最终安全回归证明 linked runtime ancestor 不能授权删除外部用户目录，并证明在清理提交前一刻替换的新锁能够存活；
- 历史抽屉 CSS 合同验证 Grid item 与滚动 body 的最小尺寸/overflow 不变量；
- 所有根目录 README 语言都已说明设置发现、Vault 级历史、安全批处理目录确认与可选 CircuitikZ 原生环境；
- maintainer CLI helper 现在优先使用兼容的 `obsidian-cli native eval` 包装器，并在包装器不存在时回退到官方 `obsidian eval`；Study Vault 的只读 `local-knowledge.inspect` 已通过该 fallback 实机完成；
- TeX Live 2023 对 common-source 输出的实编译为 0 error / 0 warning，栅格化 PDF 画布紧凑，标签清晰且无重叠；
- 最终部署的 Study Vault 显示托管 Tectonic 0.16.9 ready，六个图形命令均已注册，共源 wrapper 能以 `Circuitikz` 预览打开，且没有 popup 或 notice；
- 预览右侧历史抽屉 client height 为 671 px、scroll height 为 1,139 px，可到达约 468 px 的底部偏移并保持分页器可见；独立历史视图也正确拥有纵向 overflow；
- 严格前端法则审计为 100/100，没有失败或未知法则；可选 `dev:errors` 与 error-level `dev:console` 宿主命令因 code 1 且无输出而记录为不可用；
- 最终生产构建、233-suite Jest（1,977 项通过，Windows 跳过 1 项仅 POSIX 测试）、i18n audit、render-host audit、VitePress 构建、34 locale Docusaurus 构建、website build audit 与独立 Critical/Important 审查全部通过。
