# 1.9.10 候选验收 — 2026-10-04

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

## 真实 Vault 证据与当前发布门禁

官方 Obsidian CLI 已将候选版本成功重载到已打开的 1Knowledge。随后 eval 确认版本 1.9.10、默认 PNG 兼容开关为 true、App.saveLocalStorage 存在。实测宿主报告 Obsidian 1.12.7 / Electron 39.8.3 / Chromium 142.0.7444.265。

随后已再次将最终编译的 main.js、manifest.json 和 styles.css 复制到 Vault 插件目录，仓库与 Vault 的 SHA-256 一致，记录见 .cache/obsidian-png-compatibility/audit-installed-bundle-hashes.json。该最终 bundle 的运行时重载仍待完成；较早的 eval 不能证明最终字节已在宿主运行。

接下来的多格式宿主探测没有完成：官方 CLI 传输超时，后续 help/version 短请求同样无法完成，随后明确报告无法找到运行中的 Obsidian 实例。因此源伴随文件预览、真实 SVG/HTML/PNG/PDF 交付和设置失败注入**尚未验收**。独立 obsidian-cli 可执行文件未安装。本轮没有强制结束用户应用，也未使用 computer-use。

SHA-256 检查确认 architecture.zh-CN.md、architecture.zh-CN_diagram.drawnix、既有恢复 manifest 和 architecture.zh-CN_drawnix-3/-4/-5.png 未改变。计划中的唯一审查 fixture 父目录没有创建。旧 PNG 宿主证据仅证明当时已交付基线，不能改标为新净化边界的候选证据。

远端 main 推送、数字 tag 1.9.10、公开 Release 和 Pages 部署等待真实宿主门禁。不得声称已发布，不得复用旧 CI/Pages 成功作为当前候选证据。当前宿主 CLI 恢复后，使用已有父目录和唯一 fixture 路径重跑 .cache/obsidian-png-compatibility/audit-live-code.txt，恢复设置并完成语义验收，再按唯一 publisher 工作流发布。放宽真实宿主门禁需要明确记录的发布决策。
