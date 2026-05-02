---
date: 2026-05-02
topic: progress-audit-next-direction
---

# 进展审计与后续方向 (v1.8.3+)

## 当前状态：代码 vs 方案要求

参考文档：
- `docs/superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap.zh-CN.md`
- `docs/brainstorms/2026-04-14-diagram-platform-phase-2-requirements.zh-CN.md`
- `docs/brainstorms/2026-05-01-llm-backward-compat-and-progress-audit.zh-CN.md`

### 路线图任务状态

| 任务 | 方案目标 | 当前实际 | 差距 |
|---|---|---|---|
| 任务 0 | 构建与打包底座 | 已交付（有限制）。`srcdoc` 宿主在 `main.js` 中。烟雾门已激活。多入口构建延期。 | 重型运行时打包未开始。无阻塞。 |
| 任务 1 | 图表领域模型 | 已交付。`DiagramIntent`、`DiagramSpec`、验证器、规划器已落地。 | 无。 |
| 任务 2 | 规格优先管道 | 部分完成。内部编排已统一（`generateDiagramCommand`）。公共命令表面仍有 3 个 ID。`promptUtils.ts` 旧版提示仍存在。 | 命令整合 + 提示退役。硬性约束：必须保留原场景可用性。 |
| 任务 3 | Mermaid 适配器 V2 | 部分完成。子类型适配器覆盖全部 6 种 Mermaid 意图。`legacyFixerUtils.ts` 已提取。`mermaidProcessor.ts` 仍承担过多。 | 硬性约束：每个子任务需真实 Obsidian 验证及图像保存。 |
| 任务 4-7 | 渲染平台/Canvas/Vega-Lite/导出 | 已交付。 | 无重大差距。 |
| 任务 8 | 高级引擎 | 按设计推迟（R10）。 | 评估门未满足。 |

### notebook-navigator 交叉参考完成情况

全部 5 项模式已实现：

| # | 模式 | 状态 |
|---|---|---|
| 1 | 服务层 + DI | 延期（架构重构，不阻塞） |
| 2 | LLM 响应缓存 | ✓ |
| 3 | 逐项设置同步开关 | ✓ |
| 4 | 批量管道含中断恢复 | ✓ |
| 5 | 架构总览文档 | ✓ |

### v1.8.3+ 额外交付

| 功能 | 状态 |
|---|---|
| 欢迎弹窗（首次安装） | ✓ 22 种语言 |
| 赞助方支持（GitHub Star + ko-fi） | ✓ |
| Cline 对齐令牌解析 | ✓ |
| 图表边缘字段规范化 | ✓ |
| 首选图表类型选择器 | ✓ 设置 + 侧边栏 |
| README i18n 对齐合约测试 | ✓ 121 项测试 |
| 全 8 种图表意图实时测试 | ✓ 全部通过 |

### 架构进展

**LLM 层：** 响应缓存、Cline 对齐令牌解析、提供商本地存储隔离。25 个提供商、5 个传输协议、22 种语言环境。

**图表平台：** 8 种图表意图通过实时验证。意图选择器覆盖设置和侧边栏。边缘规范化处理多种 LLM JSON 约定。

**基础设施：** 批量进度存储、架构文档（Mermaid 图表）、README 对齐测试（121 项）、欢迎弹窗。

## 验证门

全部 CI 等效检查通过：
- `npm run build` ✓
- `npm test -- --runInBand` ✓（110 套件，708 项测试）
- `npm run audit:i18n-ui` ✓
- `npm run audit:render-host` ✓
- `git diff --check` ✓
- 实时 DeepSeek API：全部 8 种图表意图验证通过 ✓

## 硬性约束（仍生效）

1. **MermaidProcessor 分解**：每个子任务必须在真实 Obsidian 中独立验证，图像保存核验。仅凭单元测试不足以推进。
2. **旧版提示退役**：原 `promptUtils.ts` Mermaid 提示词为原场景专门调优。扩展必须完全保留原场景可用性。
3. **向后兼容性**：现有提供商配置、传输协议和设置必须不变。

## 后续方向

### 可立即推进（无需真实 Obsidian 测试）

1. **命令表面整合** — 将三条图表命令统一为一条，旧 ID 保留为别名。
2. **运行时打包（任务 0 剩余）** — 为 Vega-Lite 重型运行时建立多入口构建。

### 受硬性约束阻塞

3. 旧版提示退役 — 需真实 Obsidian 验证原 Mermaid 场景。
4. MermaidProcessor sunset — 需真实 Obsidian 验证及图像保存。
5. PlantUML 评估 — 按 R10 推迟。
