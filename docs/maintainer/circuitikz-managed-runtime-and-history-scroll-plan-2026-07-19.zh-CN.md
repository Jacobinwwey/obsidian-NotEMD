---
date: 2026-07-19
topic: circuitikz-managed-runtime-and-history-scroll-plan
---

# CircuitikZ 托管运行时与历史滚动方案

语言：[English](./circuitikz-managed-runtime-and-history-scroll-plan-2026-07-19.md) | **简体中文**

## 决策

Notemd 不会把 TeX Live、MiKTeX、TinyTeX 或任何可执行压缩包嵌入 `main.js`。图形生成、companion SVG 预览和预览导出继续保持零依赖。原生 LaTeX 是显式、仅桌面端可用的增强能力，用于编译诊断、原生 PDF 证据和受保护的 CircuitikZ 修复验收链路。

第一版托管运行时固定为 Tectonic `0.16.9`。它适合作为可选下载，官方按平台发布压缩包与 SHA-256，支持不受信任编译模式，并能按需取得 TeX 资源。现有系统 `tectonic` 与 `pdflatex` 仍作为优先复用候选。MiKTeX 与 TeX Live 通过系统环境发现支持，不随插件捆绑。

## 用户体验

实验图形设置区新增紧凑设置项 **CircuitikZ 原生编译环境（可选）**，按钮打开独立环境面板；命令面板也可直接打开同一界面。

环境面板必须展示：

- 当前编译器来源、版本、可执行路径与就绪状态；
- 零依赖预览导出与原生 LaTeX 编译之间的区别；
- 平台、架构、固定运行时版本、下载大小、安装目录与许可证链接；
- 检查、安装或修复、取消、重试、删除托管运行时，以及显式清理过期安装锁等操作；
- 实时下载字节数、当前阶段、有限长度日志和明确的完成/失败状态；
- 编译诊断、原生 PDF 与修复验收能力摘要。

常规失败只在界面内显示，不弹出笼统错误窗口。安装必须由用户显式触发，不得静默后台下载。

## 运行时架构

```text
设置 / 命令面板
  -> CircuitikzEnvironmentModal
  -> probeCircuitikzEnvironment()
       -> 自定义可执行文件
       -> 托管 Tectonic
       -> 系统 Tectonic
       -> 系统 pdflatex
  -> installManagedTectonic()
       -> HTTPS 主机白名单与重定向复核
       -> 有体积上限的流式下载
       -> SHA-256 校验
       -> 防路径穿越的可执行文件解压
       -> staging 中使用 --untrusted / -no-shell-escape 编译 smoke
       -> 原子激活版本
  -> 重新执行环境探测
```

桌面进程执行使用直接参数数组与 `shell: false`，限制输出缓存，支持超时、取消和进程树终止。UI 不拼装任意 shell 字符串。

托管文件默认位于操作系统应用数据目录，而不是 Vault。高级自定义运行时根目录可将其迁移到其他磁盘。Vault 只保存偏好，不产生 `node_modules`、包管理文件、编译器压缩包或 TeX 缓存。

## 安全与失败契约

- 只接受固定版本且来自获准 HTTPS 主机的资产。
- 每次重定向重新验证主机；下载前后都执行压缩体积上限。
- 所有压缩包必须匹配固定 SHA-256。
- 解压时只接受预期的 `tectonic` 可执行文件，拒绝绝对路径、`..`、符号链接和硬链接。
- 下载与解压使用同级 staging。取消、超时、校验失败、smoke 失败和写入失败都清理 staging，并保留旧的活动版本。
- 运行时发现保持只读；pointer 规范化与旧版所有权登记只在持有托管运行时锁时执行。只有有效的 Notemd pointer 或安装目录内所有权清单能够证明所有权、可执行文件摘要匹配，且 POSIX 执行权限有效时，才允许复用已有目录。
- 所有权路径必须同时通过词法 containment 与规范化 `realpath` containment。运行时根目录下的符号链接或 Windows junction 不能把 Notemd pointer 变成读取或递归删除外部用户目录的权限。
- 禁止自动删除过期锁。环境面板提供显式恢复操作；只有取得独占清理声明、确认 owner token 稳定并重复验证 owner 进程已死亡后才清锁。声明成功的锁目录会先原子重命名到带 token 的隔离目录，并在隔离目录内再次校验后才删除；若锁在最终提交边界被替换，则恢复或保留替换锁，不会将其删除。
- Tectonic 使用 `--untrusted`；`pdflatex` 使用 `-no-shell-escape`。
- smoke 编译使用 Notemd 自有的确定性 CircuitikZ fixture，不默认编译任意用户 TeX。
- 移动端继续使用 companion SVG，并在不加载桌面进程代码的前提下报告原生编译不受支持。

## 历史抽屉根因与修复

历史抽屉是 CSS Grid item。默认 `min-height: auto` 会把隐式 grid row 撑到历史内容高度，导致 body 本身没有内部 overflow；layer 再用 `overflow: hidden` 裁掉超出部分。

根因修复是在 `.notemd-diagram-history-drawer` 上设置 `min-height: 0`。body 继续保留 `min-height: 0` 与 `overflow: auto`，并增加 `overscroll-behavior: contain`，避免滚动传递到底层预览。共享的独立历史 Modal 保持自己的滚动模型。

## 测试计划

1. 先为 drawer 最小尺寸不变量增加失败的 CSS 合同测试，再应用最小样式修复。
2. 单测覆盖平台/架构选择、PATH 发现、编译器偏好、能力报告与移动端行为。
3. 单测覆盖流式下载进度、取消、超时、重定向白名单、体积上限、checksum、压缩包路径穿越拒绝、staging 清理与原子激活。
4. 单测覆盖直接进程执行，以及准确的 untrusted/no-shell-escape 参数数组。
5. 安装器使用本地 HTTP fixture，Jest 不依赖公网可用性。
6. 覆盖环境面板状态，以及英文、简体中文设置/命令连线。
7. 执行完整插件 build、Jest、i18n audit、render-host audit、网站构建和文档合同。
8. 将 `main.js`、`manifest.json`、`styles.css` 与 `README.md` 部署到 Study Vault，重载 Obsidian，实测长历史滚动与原生 LaTeX smoke，确认被测流程没有错误弹窗或 notice，并记录宿主是否支持可选的开发者控制台 CLI 命令。

## Phase 退出条件

本工作在 CircuitikZ roadmap 中新增 Phase F。只有在 UI 可探测可选环境、受支持托管资产可经过完整性校验与取消流程安装、真实 common-source fixture 能通过所选环境编译、真实预览中的历史抽屉可以滚动、文档同步、全部门禁通过、`main` 已推送且工作区 clean 时，Phase F 才算完成。

## 实现进度

- 代码已完成：编译器发现与偏好顺序、按所有权精确管理的托管安装/删除、只读恢复发现、规范路径 containment、token 隔离式过期锁恢复、六 fixture 验收、桌面进程取消/超时、环境设置与面板、命令面板入口、移动端延迟加载边界、历史 Grid/overflow 修复，以及 linked ancestor 外部删除和最终边界锁替换两类回归测试。
- 文档已完成：英文/简体中文用户图表指南、全部根目录 README 语言、CircuitikZ roadmap、本组双语方案/进度记录与 MDX 仓库策略分析。
- 仓库验证已完成：生产构建；233 个 Jest suite、1,977 项通过测试与 1 项仅 POSIX 测试在 Windows 跳过；i18n 与 render-host audit；VitePress 构建；34 locale Docusaurus 构建；`git diff --check`；最终独立审查未发现剩余 Critical 或 Important 问题。
- Study Vault 实机验证已完成：部署文件与仓库逐字节一致；Notemd 1.9.3 与全部图形命令已注册；托管 Tectonic 0.16.9 显示 ready；预览历史抽屉 client height 为 671 px、scroll height 为 1,139 px，可到达约 468 px 的底部偏移并显示分页器；被测流程没有出现 popup 或 notice。可选 `dev:errors` / `dev:console` 宿主命令以 code 1 且无输出结束，因此记录为宿主诊断不可用，而不是把它误判为插件错误证据。
- 严格前端法则门禁为 100/100：0 个快速门失败、0 个法则失败、0 个未知项。本次 mainline commit 在 push 完成并确认工作区 clean、`HEAD` 与 `origin/main` 相等后关闭 Phase F。
