---
date: 2026-05-03
topic: drawnix-feasibility-integration-direction
---

# Drawnix 可行性与集成方向审计

## 审计范围

- 上游项目：`plait-board/drawnix`
- 核查基线：`develop@e28ba80`
- 目标：判断 Drawnix 对 Notemd 的可复用价值，区分“值得吸收的能力边界”与“会冲撞 Obsidian 插件边界的宿主复杂度”

## 仓库快照

Drawnix 不是一个轻量 renderer，而是一个完整白板应用栈：

- Nx monorepo
- React 19 + Vite
- `packages/drawnix`、`packages/react-board`、`packages/react-text`
- Plait 全家桶：`@plait/core`、`@plait/draw`、`@plait/layouts`、`@plait/mind`、`@plait/text-plugins`
- Slate 富文本栈
- `browser-fs-access`、`localforage`、`mobile-detect`

从定位上看，它更接近“浏览器中的产品级白板 SaaS”，不是“可直接塞进 Obsidian 插件主 bundle 的一个小功能库”。

## 已确认的强项

### 1. 数据边界清晰

`packages/drawnix/src/data/types.ts` 定义了稳定导出格式：

- `type: 'drawnix'`
- `version`
- `elements: PlaitElement[]`
- `viewport`
- `theme`

这说明 Drawnix 的价值首先在**白板数据模型**，而不是某个 UI 组件。

### 2. 转换能力是惰性加载的独立模块

`markdown-to-drawnix.tsx` 与 `mermaid-to-drawnix.tsx` 都在运行时动态导入：

- `@plait-board/markdown-to-drawnix`
- `@plait-board/mermaid-to-drawnix`

这说明它们自己也把“转换能力”视作重模块，而不是默认常驻主路径。这一点对 Notemd 很重要：如果未来要借鉴，也应该沿用“隔离、按需加载”的思路。

### 3. 分层思路值得借鉴

Drawnix 的 app shell、board、text renderer、转换弹窗是明确分层的。对 Notemd 来说，可借鉴的是：

- UI 宿主和转换逻辑分离
- 数据格式和交互宿主分离
- 重运行时能力按需引入

## 与 Notemd 的结构错位

### 1. 宿主假设是浏览器应用，不是 Obsidian 插件

Drawnix 代码中大量直接依赖：

- `window`
- `document`
- `localStorage`
- `browser-fs-access`
- `MobileDetect`

这意味着它默认运行在完整浏览器宿主中，具备文件系统选择器、DOM 覆盖层、浏览器存储和交互式菜单系统。Notemd 目前的可控边界是：

- Obsidian 插件主线程
- 有限的 iframe / srcdoc 渲染宿主
- 需要同时考虑桌面与移动端兼容性

把 Drawnix 全宿主搬进来，会把当前可控的 preview/render boundary 迅速升级为一整套前端应用托管问题。

### 2. Drawnix 的产品目标不是 Notemd 当前需求

Drawnix 的核心是交互式白板编辑：

- 思维导图编辑
- 流程图编辑
- 自由绘制
- 文件打开 / 保存
- 图片导出
- 工具栏、浮层、上下文菜单

Notemd 当前主线是：

- 从笔记语义生成结构化图表
- 保存为 Obsidian 友好的产物
- 在插件内预览 / 导出

也就是说，Notemd 缺的不是“完整白板编辑器”，而是“更稳的 spec-first 生成、运行时边界、可持续验证门”。

### 3. 直接复用转换器也不能解决核心架构问题

`mermaid-to-drawnix` 与 `markdown-to-drawnix` 确实有价值，但如果 Notemd 直接走：

`DiagramSpec -> Mermaid/Markdown 字符串 -> Drawnix converter -> PlaitElement[]`

会出现两个问题：

1. 把已经建立起来的 `DiagramSpec` 语义层重新降级为字符串中间态
2. 把转换正确性重新绑定到 Mermaid/Markdown 文本质量，而不是 spec 质量

这会削弱 Notemd 现有路线图里最重要的一步：**先让 LLM 产出结构化语义，再做 target-specific adapter。**

## 可行性矩阵

| 方向 | 可行性 | 风险 | 结论 |
|---|---|---|---|
| 整体嵌入 Drawnix 宿主/UI | 低 | 很高 | 不建议 |
| 直接把 Drawnix 当作新的预览宿主 | 低 | 很高 | 不建议 |
| 借鉴其 app/board/text 分层思想 | 高 | 低 | 建议吸收 |
| 借鉴 `.drawnix` 数据格式作为未来导出目标 | 中 | 中 | 可作为后续候选 |
| 在隔离路径中试验 `mermaid-to-drawnix` / `markdown-to-drawnix` | 中低 | 中高 | 仅限实验性原型 |
| 基于 `DiagramSpec -> PlaitElement[]` 自建 adapter | 中 | 中 | 如果未来要 board export，这是更合理的方向 |

## 对 Notemd 的建议结论

### 不应做的事

1. 不要把 Drawnix 整个宿主、工具栏、文件系统交互、白板 UI 搬进 Notemd。
2. 不要为了“支持更多图形类型”而把当前 renderer boundary 变成另一个前端应用托管层。
3. 不要让 `DiagramSpec` 再退化回 Mermaid/Markdown 作为主中间态。

### 值得做的事

1. 把 Drawnix 当作**外部参考项目**，不是直接依赖包集合。
2. 若未来需要“可继续编辑的白板导出”，优先考虑：
   `DiagramSpec -> DrawnixExportedData(.drawnix)`
3. 若未来要试验 Drawnix converter，只能放在：
   - 隔离的 experimental path
   - 按需加载
   - 不进入默认主链

## 与当前主线优先级的关系

Drawnix 分析并没有推翻现有路线图，反而强化了当前优先级排序：

1. 命令表面收口
2. 可持续 live verification runbook
3. 重运行时打包隔离
4. MermaidProcessor 拆分
5. 再考虑新的导出目标或 board-style artifact

换句话说，Drawnix 不是“下一步立刻接入”的候选，而是**证明当前路线图方向是对的：要吸收数据边界和转换边界，而不是复制整套宿主复杂度。**
