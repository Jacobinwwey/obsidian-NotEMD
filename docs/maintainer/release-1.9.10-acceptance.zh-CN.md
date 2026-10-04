# 1.9.10 候选验收 — 更新于 2026-10-05

## 范围

社区扫描分诊和 ponytail 架构审查从已交付 PNG 兼容基线 d99309780679 接续，不重复既有工作、不覆盖用户产物。社区扫描包含 646 项发现，按规则与描述归为 108 组；已确认问题与被否定假设见[完整审查](../audits/2026-10-04-community-ponytail.zh-CN.md)。

## 已完成实现

浏览器 SVG 净化与各面板 CSS 隔离、父桥安全 SVG 返回、桌面依赖懒加载与真实浏览器移动 bundle 加载、Vault 本地 provider 存储及显式旧版导入/失败拒绝、local-only 设置正常显示、收藏回滚与等待复制结果、FileManager 删除偏好、loopback 服务 Host/Origin/路径控制及并发/待启动生命周期、修补版 Mermaid 与直接依赖缩减。复杂度保留在拥有边界的模块内，演示与图表流程继续独立。

翻译全部直接编写：新持久化消息覆盖 21 种 UI 语言、31 份根 README、34 种网站语言的发布/配置/图表页面，以及独立完整中英文审查、计划、发布说明。website/i18n/source-review.json 记录原文与译文哈希，不声称独立母语审阅。旧 1.9.9 发布资产和原始历史指南保持不变。

## 验证

- 生产构建通过。
- 最终源码 fresh 全量回归：304 个 suite、2,954 项测试通过，1 项既有跳过（总计 2,955 项）。结果：.cache/obsidian-png-compatibility/audit-delivery-tests.json，耗时 268.878 秒；覆盖父桥安全边界与重复 CSS 导出稳定性。
- 真实 Chromium 回归复现并移除 SVG 活动内容和宿主 CSS 污染，保留渐变/marker/内部引用，检查组合面板计算颜色与隔离、重复 scope 互不影响、foreignObject 中文转换后可见。
- 实际 HTTP 监听测试覆盖精确 Host/Origin、UTF-8、编码路径包含检查、并发获取、共享释放、待启动取消和端口占用。
- 网站 34 种语言构建成功；build 审计通过，导航与可访问性审计检查 96 页、零失败。
- UI 字符串和自包含 render-host 审计通过。Lint ratchet 无回归，最终父桥检查日志保存在本地；diff 检查通过。

接续检查：最终三个已安装文件的 SHA-256 仍与仓库一致。README/版本和网站文档契约检查通过（2 个 suite、14 项测试），随后 git diff --check 通过。当前手册已统一 Vault 删除偏好、仅本地 provider 存储归属和无固定配额的 Drawnix 关系说明。有超时限制的 CLI 连通性探测再次返回“The CLI is unable to find Obsidian.”。证据：.cache/obsidian-png-compatibility/audit-resume-checkpoint.json。

## 接续验证 — 2026-10-05

从会话 01a0f563-c6c7-78f0-940b-e783d1fe8a9b 的候选 ef197278 接续，针对 d99309780679 的 Git diff 核对 SVG、provider 存储、预览/导出和服务器生命周期边界。本次接续无需修改产品源码。

- 重新执行生产构建与全量回归：**304 个 suite、2,954 项通过、零失败、1 项既有跳过**，耗时 521.871 秒。报告：.cache/obsidian-png-compatibility/resume-regression-tests.json。
- Provider 传输、工作流、输出偏好、导出恢复、浏览器 SVG 安全、移动端 bundle 加载与真实 HTTP 服务器测试全部通过。UI 字符串、render-host 审计通过；lint ratchet 在 **31 个改动 TypeScript 文件中发现零回归**。
- 重建的 main.js 仍与已安装 bundle 一致；三个插件文件的哈希与 audit-installed-bundle-hashes.json 一致。官方 CLI 已重载最终插件，并通过重载前后实例身份变化确认。

## 已通过的真实 Vault 验收

官方 CLI 在 1Knowledge 报告 **Obsidian 1.13.7（安装器 1.12.7）**。user-agent 中的版本属于安装器，旧记录仅据此判断应用版本并不充分。独立 obsidian-cli 可执行文件未安装。

真实验收 fixture：Notemd CLI Tests/Audit-1.9.10-native-1791156334109。报告：.cache/obsidian-png-compatibility/resume-native-acceptance.json。

- 源 .drawnix 的伴随 SVG 在真实预览中打开；事件属性、外部及可执行 URL 被移除，宿主外部 UI 保持可见，foreignObject 和向量中文文字保留。
- SVG、HTML 图形、PNG、PDF 均成功输出到 fixture 源文件旁。300 × 140 CSS 像素的测试图按 72 PPI 输出为 225 × 105 像素 PNG，在 Obsidian 中成功解码。HTML 嵌入净化后且保留中文的 SVG，PDF 文件头有效。
- 测试用 local-only provider 可经 Vault 本地存储保存和重新加载；注入本地写失败后明确拒绝。在标记通过之前，内存设置、持久化设置和原有本地记录均精确恢复，包括原本不存在记录的情况。
- 两个真实预览窗口缩放互不影响：一处从 1:1 调至 125%，另一处保持不变。已有 architecture.zh-CN_drawnix-6_obsidian_87ppi.png 成功解码为 4325 × 15179 像素。报告：.cache/obsidian-png-compatibility/resume-native-zoom.json。
- SHA-256 检查确认 architecture.zh-CN.md、architecture.zh-CN_diagram.drawnix、原有恢复 manifest 与 architecture.zh-CN_drawnix-3/-4/-5.png 保持不变；仅创建了唯一命名的测试 fixture。

## CLI 恢复与复现方式

将旧 fixture 全文作为 Windows 原生 CLI 参数传入后，Obsidian 主进程在 fixture 执行前因请求 JSON 格式错误而拒绝解析；错误弹窗阻塞了后续 CLI 请求。用户手动关闭弹窗，未强制终止应用，后续工作仅使用 CLI。

通过 Node execFileSync 和参数数组调用已安装的 Obsidian.com，设置超时及 windowsHide:true。保持 eval 参数简短：先用 require('node:fs').readFileSync 加载已审阅的本地 fixture，再执行。除退出码外也检查语义结果，因为 CLI eval 可能以退出码零返回 Error: 文本；轮询 fixture 的明确状态，不将提交命令等同于完成。

继承的 fixture 还存在预览选择器不存在、使用不支持的 html 而非 html-diagram 输出 ID、未精确恢复原本缺失的本地记录等问题。修正这些探测假设后，验收通过，无需弱化产品行为或修改插件 bundle。

## 发布门禁

最终候选的真实宿主验收**通过**。须在对应 main 提交通过 Linux 与 Windows CI 后发布，使用数字 tag 1.9.10 和唯一 Actions publisher，验证公开四资产来源及完整双语说明，再核对 chronicle 并显式部署 Pages。发布结论以实际工作流和资产结果为证据，真实宿主验收本身不代表已经发布。
