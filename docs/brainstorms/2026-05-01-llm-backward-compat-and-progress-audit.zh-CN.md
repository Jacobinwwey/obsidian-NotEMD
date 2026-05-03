---
date: 2026-05-01
topic: llm-backward-compat-progress-audit
---

# LLM 调用向后兼容性与进展审计 (v1.8.2)

## 问题界定

LLM 调用层已完成以下更新：
1. Cline 对齐的 `KNOWN_MODEL_MAX_OUTPUT_TOKENS` 元数据表
2. 基于模型感知的 `resolveProviderTokenLimit` 令牌上限计算
3. 提供商专属 UI 控件（DeepSeek 思考开关、Azure API 版本等）
4. 图表规格解析器中的边缘字段规范化

这些变更不得破坏现有用户配置：在 v1.8.1 下配置的提供商在 v1.8.2 下必须无需重新配置即可正常工作。

## 向后兼容性审计

### `resolveProviderTokenLimit` 行为矩阵

| 场景 | v1.8.1 | v1.8.2 | 兼容？ |
|---|---|---|---|
| 已知模型 + 默认 maxTokens | 8192（全局） | 已知模型上限（如 Claude 128K） | **增强** — 更好的上限，无破坏 |
| 已知模型 + 自定义 maxTokens（低于上限） | 用户值 | 用户值（不变） | ✓ |
| 已知模型 + 提供商 maxOutputTokens 覆盖 | 覆盖值（无上限约束） | min(覆盖值, 已知上限) | **增强** — 更安全的约束 |
| 未知模型 + 默认 maxTokens | 8192 | undefined（API 自行决定，Cline 对齐） | **行为变更** — API 默认值可能与 8192 不同 |
| 未知模型 + 自定义 maxTokens | 用户值 | 用户值（不变） | ✓ |
| 连接测试 | 1 | 1（不变） | ✓ |

**"行为变更"单元格的风险评估：**
- 对未知/新模型依赖 `maxTokens: 8192` 默认值的用户，现在将获得 API 提供商自身的默认值。
- 对 OpenAI-compatible 端点，这通常意味着模型自身的默认值（通常高于 8192）。
- 这是软性改进：旧的 8192 上限是武断的，可能限制了能力。
- 用户无需做任何配置更改。

### 传输层向后兼容性

| 传输 | v1.8.1 | v1.8.2 | 变更？ |
|---|---|---|---|
| OpenAI-compatible | 通过 `callOpenAICompatibleApi` 的共享运行时 | 相同，加 `resolveProviderTokenLimit` | 仅令牌解析 |
| Anthropic | 原生 Messages API | 相同 | 仅令牌解析 |
| Google | 原生 Gemini API | 相同 | 仅令牌解析 |
| Azure OpenAI | 部署模式 | 相同 | 仅令牌解析 |
| Ollama | 原生 Ollama API | 相同 | 仅令牌解析 |

无传输路由变更。无协议变更。所有现有 API 密钥、基础 URL 和模型 ID 继续不变。

### 提供商定义向后兼容性

所有 25 个提供商定义保持不变。仅新增：
- `KNOWN_MODEL_MAX_OUTPUT_TOKENS` 表（只读查找，不影响提供商配置）
- `LLMProviderConfig` 上的 `maxOutputTokens` 字段（可选，默认 undefined — 对现有配置无影响）

### 设置标签页向后兼容性

- 提供商专属控件（DeepSeek 思考、Azure API 版本）按提供商名称管控
- 非 OpenAI 传输显示 `maxOutputTokens` 字段（新增，可选）
- 所有现有设置字段保持原位置
- 无需设置迁移

### 图表管道向后兼容性

- `diagramSpecResponseParser.ts` 中的 `normalizeSpec` 现处理 `source`/`target` → `from`/`to`
- `buildDiagramSpecPrompt` 现已明确指示 LLM 使用边缘字段名
- 现有 Mermaid 输出不变；仅 LLM 生成的规格受益于规范化
- 旧版 Mermaid 修复路径未触碰

## 当前架构进展 vs 方案要求

参考文档：
- `docs/superpowers/plans/2026-04-14-diagram-rendering-platform-roadmap.zh-CN.md`
- `docs/brainstorms/2026-04-14-diagram-platform-phase-2-requirements.zh-CN.md`

### 任务 0：构建与打包底座 — 已交付（有限制）

| 需求 | 状态 | 证据 |
|---|---|---|
| 渲染宿主自包含于 main.js | ✓ | `scripts/audit-render-host-bundle.js` 通过 |
| 烟雾门禁止外部宿主资源 | ✓ | 发布工作流包含审计 |
| 多入口构建策略 | ✗ | `esbuild.config.mjs` 仍为单入口 |

### 任务 1：图表领域模型与意图路由 — 已交付

所有类型、验证器、规划器、意图路由已落地。测试通过。

### 任务 2：规格优先管道集成 — 部分完成

| 需求 | 状态 |
|---|---|
| 共享 `generateDiagramCommand` 执行器 | ✓ |
| 旧版/兼容双轨已收敛 | ✓（内部编排已统一） |
| 公共命令表面已整合 | ✗（双命令 ID 仍共存） |
| `promptUtils.ts` 旧版 Mermaid 提示已退役 | ✗ |

**硬性约束：** `promptUtils.ts` 中的旧版 Mermaid 提示词为原场景专门调优。任何扩展或退役必须完全保留原场景的可用性。跨版本稳定性和用户体验连续性优先于清理。命令 ID 整合仍是下一目标；提示退役需先经过真实 Obsidian 验证。不阻塞 v1.8.2。

### 任务 3：Mermaid 适配器 V2 — 部分完成（按用户指令暂缓）

按用户指令，MermaidProcessor 分解为稳定性暂缓。

**硬性约束：** 每个子任务必须在真实 Obsidian 实例中独立验证后方可推进。图表输出图像必须保存、检查并确认完整正确。仅凭单元测试不足以跨越任何子任务边界。当前状态：
- 子类型适配器覆盖 mindmap、flowchart、sequence、class、ER、state
- 管道转义在适配器发射阶段处理
- `legacyFixerUtils.ts` 已从 `mermaidProcessor.ts` 提取
- 完全分解未完成 — 为 v1.8.2 稳定性有意为之

### 任务 4-7：已交付

渲染平台骨架、JSON Canvas 输出、Vega-Lite 输出（有限制）、主题/导出/发布强化均已落地。

### 任务 8：高级引擎 — 按设计推迟

PlantUML、Graphviz、Draw.io 按阶段二需求 R10 保持推迟。

## 后续方向

v1.8.2 后工作的优先级：

1. **命令收敛** — 统一 `summarize-as-mermaid` 和 `generate-experimental-diagram` 命令表面
2. **旧版提示退役** — 从 `promptUtils.ts` 移除 `mindmap` 绑定提示
3. **运行时打包** — 为重型预览运行时（Vega-Lite、未来的 PlantUML）建立多入口构建
4. **MermaidProcessor sunset** — 完成 `legacyFixerUtils.ts` 启动的分解
5. **PlantUML 评估门** — 仅在前 4 项完成后，按 R10

v1.8.2 的范围边界：
- 无命令整合（临近发布风险太高）
- 无提示退役
- 无新提供商添加
- 无构建系统变更
- 仅：LLM 令牌解析强化 + 图表边缘规范化

## 验证门

所有 CI 等效检查通过：
- `npm run build` ✓
- `npm test -- --runInBand` ✓（111 套件，592 项测试）
- `npm run audit:i18n-ui` ✓
- `npm run audit:render-host` ✓
- `git diff --check` ✓

## 决策

1. **Cline 对齐的未知模型行为**：当 `maxTokens` 为默认值（8192）且模型未知时，返回 `undefined` → API 提供商自行决定。用户自定义值保留。
2. **边缘字段规范化**：始终在图表规格解析中将 `source`/`target` 规范化为 `from`/`to`，无论 LLM 偏好哪种约定。
3. **MermaidProcessor 暂缓**：按用户明确指令，为 v1.8.2 稳定性跳过分解。
4. **无传输变更**：全部 5 个传输运行时不变。仅令牌解析逻辑修改。

## 下一步

提交至 main。准备就绪后标记 v1.8.2。下一批次开始命令收敛。


## 交叉参考：notebook-navigator 设计模式

参考：`https://github.com/johansan/notebook-navigator` (v2.5.6)

notebook-navigator 是一个笔记浏览器插件（React、IndexedDB、虚拟滚动、10 万+ 笔记规模）。无 LLM 集成。交叉参考价值在于其**工程模式**，而非功能表面。

### 模式 1：带依赖注入的服务层

**NN 方案：** 23 个服务类组织于 `src/services/` 的子目录中。`ServicesContext` 通过 React 上下文提供单例访问。每个服务有单一所有权、明确生命周期和显式依赖。

**NotEMD 缺口：** `src/llmUtils.ts`（约 3000 行）和 `src/fileUtils.ts` 是单体工具文件，无服务边界。所有函数全局导出，无依赖注入。

**改进角度：** 提取 `LlmService`（包装 `callLLM`、`testAPI`、`resolveProviderTokenLimit`）和 `FileProcessingService`（包装 `processFile`、批量操作、概念提取）。为向后兼容保留现有导出函数签名；内部委托给服务类包装。不阻塞 v1.8.2。可维护性改进。

### 模式 2：带缓存失效的分层存储

**NN 方案：** IndexedDB（持久化）→ MemoryFileCache（同步镜像）→ LRU 缓存（预览文本、特征图像）。基于 mtime 的增量更新。vault 变更时缓存重建。

**NotEMD 缺口：** 无缓存层。每次调用重新获取 LLM 响应。图表输出从零重新生成。`RenderCache` 存在但仅限内存，会话作用域。

**改进角度：** 按 (provider, model, prompt hash, content hash) 为键缓存 LLM 响应，降低重复处理的 API 成本。按 (markdown hash, intent, target) 为键缓存图表规格。Obsidian 的 `localStorage` 或 vault 邻近 JSON 文件足够（IndexedDB 对 NotEMD 的单文件处理模型过度设计）。v1.8.2 后。

### 模式 3：逐项设置同步开关

**NN 方案：** 每个设置均有同步开关（云图标）。启用 → `data.json`（跨设备同步）。禁用 → `localStorage`（设备本地）。非全局同步标记；逐项粒度。

**NotEMD 缺口：** 所有设置存储于 `data.json`。提供商 API 密钥跨设备同步（若 vault 共享存在安全隐患）。工作流偏好也同步（可能不需要）。

**改进角度：** 在 `LLMProviderConfig` 中添加 `localOnly` 标记。设置时，提供商配置（含 API 密钥）存入 Obsidian 的 `localStorage` 而非 `data.json`。API 密钥保持设备本地，工作流设置可同步。

### 模式 4：带完成信号的管道处理

**NN 方案：** 元数据管道有 3 层（vault 同步 → 派生内容 → 树索引），带显式完成信号。后台处理带进度跟踪。

**NotEMD 缺口：** 批量处理（`processFolder`、`batchTranslate`、`batchGenerateContent`）顺序执行，基本进度报告。无管道阶段、无完成信号、无中断后恢复。

**改进角度：** 批量处理结构化为管道阶段：(1) 文件发现 + mtime 检查，(2) LLM 处理含重试，(3) 文件写入 + 元数据更新。跟踪逐文件完成状态以便中断后可恢复。添加进度存储（vault 邻近 JSON）在 Obsidian 重启间持久化批量状态。

### 模式 5：架构文档

**NN 方案：** 8 份专用架构文档，覆盖启动过程、元数据管道、存储架构、渲染架构、滚动编排、服务架构。全部含 Mermaid 图表。附日期。

**NotEMD 现状：** 36 份文档页面。计划/头脑风暴/路线图强。架构 walkthrough 弱。无单页架构总览展示全系统。

**改进角度：** 添加 `docs/architecture.md`（双语），展示：提供商注册 → 令牌解析 → 传输分发 → LLM 调用 → 响应解析，以及图表管道：spec prompt → LLM 调用 → spec 解析 → 渲染器分发 → 预览/导出。含 Mermaid 图表。使系统无需阅读源码即可理解。

### 改进优先级汇总

| # | 模式 | 优先级 | 工程量 | 阻塞 v1.8.2？ |
|---|---|---|---|---|
| 1 | 服务层 + DI | 低 | 高 | 否 |
| 2 | LLM 响应缓存 | 中 | 中 | 否 |
| 3 | 逐项设置同步开关 | 低-中 | 低 | 否 |
| 4 | 批量管道含恢复 | 中 | 中 | 否 |
| 5 | 架构总览文档 | 低 | 低 | 否 |

全部不阻塞 v1.8.2。均为发布后改进。

## 最终进展

| # | 模式 | 优先级 | 状态 |
|---|---|---|---|
| 2 | LLM 响应缓存 | 中 | ✓ |
| 4 | 批量管道含恢复 | 中 | ✓ |
| 3 | 逐项设置同步开关 | 低-中 | ✓ |
| 1 | 服务层 + DI | 低 | 延期（架构项） |
| 5 | 架构总览文档 | 低 | ✓ |
| — | 首选图表意图选择器 | — | ✓ |

notebook-navigator 交叉参考的 5 个模式现已全部完成。
服务层拆分（模式 #1）是唯一保留的后续项，作为 v1.8.x 之后的架构性重构延后处理，不应仓促推进。

## 2026-05-02 —— 全量进展审计

已完成一次端到端审计，对照当前代码、既有计划要求和硬性约束逐项核实。关键结论记录于 `docs/brainstorms/2026-05-02-progress-audit-and-next-direction.zh-CN.md`。

### 当前状态摘要

- **路线图任务**：8 项中已有 7 项已交付或部分交付；任务 8（高级引擎）按设计推迟。
- **notebook-navigator 模式**：5 项中已有 4 项实现；模式 #1（服务层）延期。
- **硬性约束**：两项仍然生效 —— MermaidProcessor 分解与 legacy prompt 退役仍需真实 Obsidian 核验。
- **测试覆盖**：110 个 suites，708 个测试（包含新的 README 对齐契约测试）。
- **实时验证**：历史上的本地 DeepSeek 验证曾覆盖全部 8 种图表意图，但这些 live tests 已不再作为 `main` 上受控的仓库级门槛。

### 下一步即时方向

1. 命令表面收口（统一 3 个图表命令）
2. 运行时打包（为重型运行时建立多入口构建）

这两项都可以在不依赖真实 Obsidian 测试的前提下推进。其余事项仍受硬性约束阻塞。

### CI 状态

本地所有 CI 等效检查均已通过。远端 release workflow 也已在 `1.8.4` 路径（`25274341984`）上完成加固并保持绿色，而 `main` 仍然是刻意不具备普通 push/PR CI 的状态。
当前剩余的 CI 相关工作，核心是澄清文档中的事实源，而不是处理一个尚未解决的分支失败流水线。
