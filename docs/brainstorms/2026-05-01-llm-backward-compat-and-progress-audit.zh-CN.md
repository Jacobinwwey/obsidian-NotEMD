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
