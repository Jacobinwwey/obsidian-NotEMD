---
date: 2026-07-22
version: 1.9.4
topic: drawnix-knowledge-map-quality-and-delivery
status: planned
---

# Drawnix 知识导图质量与交付方案

## 决策

当前 Drawnix renderer 交付的是文件格式 spike，不是 Drawnix 画布投影。它之所以能被导入，原因是 Drawnix 接受较宽松的 JSON 外壳；当前实现没有保留层级，也没有使用上游思维导图元素模型。

下一轮 Drawnix 工作只交付一条有边界的 `mindmap -> 可编辑 .drawnix` 路径。Obsidian bundle 不嵌入 Drawnix 应用壳、工具栏、持久化层或浏览器文件 API。架构画布和只读 Plait 预览属于后续独立决策，各自需要验收门槛。

## 证据与当前状态审计

| 表面 | 当前代码 | 后果 | 必须修正 |
|---|---|---|---|
| 语义投影 | `buildSemanticFigureModel()` 会拍平 `DiagramNode.children`，并把所有节点排到固定三列 | 父子关系在导出前已经丢失 | 从 `DiagramSpec.nodes` 直接建立 Drawnix 专用层级投影 |
| 几何 | 所有节点都是 240 x 104 矩形；边只取最近矩形侧边 | 跨行长边会穿过卡片并相互交叉 | 思维导图投影负责分支位置、节点尺寸和关系路由 |
| Drawnix 数据 | exporter 只允许 `geometry` 矩形和 `arrow-line` | 文件没有上游思维导图元素或分组语义 | 先完成兼容性探针，再导出受控且可测试的 `MindElement` 兼容子集 |
| 预览 | `DrawnixRenderer` 调用通用 editable-SVG renderer | 预览与导入 Drawnix 后的画板属于两套渲染系统 | SVG companion 使用同一个 Drawnix 投影；首批不引入真实 Plait 预览 |
| 提示词 | `buildDiagramSpecPrompt()` 只有 CircuitikZ profile | 即使请求 Drawnix，模型也可能输出扁平图 | 增加目标专用的思维导图提示词和层级契约校验 |
| 校验 | 上游 `isValidDrawnixData()` 只做外壳校验 | JSON 可通过但视觉上不可用 | 分别测试层级、布局约束、SVG 几何和真实导入证据 |

由 `docs/architecture.zh-CN.md` 生成的产物已经证明问题：其中有 18 个同尺寸矩形，固定落在三个 x 坐标上，并有 17 条两点箭头线。它来自共享网格模型，不是 Drawnix 内部布局失败。

## 与先前方案的对比

2026-05-03 的 Drawnix 审计正确排除了完整宿主嵌入，也正确排除了 Mermaid/Markdown 字符串 round trip 作为生产架构。该审计没有评估已交付最小子集是否适合作为面向用户的 Drawnix 目标。

2026-07-04 的参考集成方案正确保留了 `DiagramSpec -> target-specific adapter -> artifact` 边界。状态描述需要校正：Drawnix 已经是公开目标，但目前的质量契约低于“可编辑画布”的合理预期。

原 phase-2 要求仍有效：

1. 复用 `DiagramSpec`、`RendererService` 和 target-aware artifact 保存路径；
2. 重型运行时隔离仍是独立的打包决策；
3. 不向 `src/main.ts` 追加目标专用编排；
4. 不因 importer 能容忍文件就宣称行为稳定。

因此，旧路线图的顺序是细化而非推翻。完整 Drawnix 宿主继续延期；有边界的导出质量修正先于 Drawnix 意图范围扩张。

## 已比较的方案

### 1. 将 `DiagramSpec` 转为 Markdown 或 Mermaid，再调用上游 converter

原型实现快，但会丢失源级角色信息，把现有语义模型降级成字符串 round trip，并使质量依赖两个 parser 和未固定的 converter 包。生产路径不采用。隔离的兼容性探针可以使用 converter 生成上游 golden fixture。

### 2. 将 Drawnix 应用整体打包为 Obsidian 预览宿主

这会直接使用上游 board renderer，但也会引入 React、Plait、Slate、DOM overlay、浏览器存储和文件选择器假设。插件内会出现第二个应用，release 体积还会绑定到 Notemd 不拥有的编辑器 UI。排除。

### 3. 创建原生的目标专用投影

从 `DiagramSpec` 建立 `DrawnixMindMapProjection`，序列化为受约束的 `MindElement` 兼容子集，并用相同投影渲染 SVG companion。上游 JSON fixture 与导入验证作为兼容性证据。该路径保留规格优先边界，也不向主 bundle 引入生产依赖。采用。

## 目标架构

```text
DiagramSpec
  -> DrawnixMindMapProjectionBuilder
  -> DrawnixMindMapLayout
  -> DrawnixMindMapExporter (.drawnix)
  -> DrawnixMindMapSvgRenderer (preview companion)
```

投影 builder 负责层级与视觉角色；layout 负责坐标；exporter 只序列化已经完成布局的元素；SVG companion 消费同一份已布局投影。思维导图路径不允许再使用通用 `SemanticFigureModel`。

### 首批交付范围

- `DrawnixRenderer` 只接受 `intent: "mindmap"`。
- `DiagramNode.children` 保留为主树，不把父子关系重新编码为普通 edges。
- 树布局完成后，支持少量跨分支关系。它们是注释，不是主结构。
- 相同 `DiagramSpec` 必须生成确定性输出。
- 从已布局的思维导图投影生成独立 SVG companion。
- 使用固定上游 Drawnix 基线手工打开 `.drawnix`，作为维护者验证。

### 明确不做的事

- 不在 Obsidian 内嵌完整 Drawnix editor 或工具栏。
- 首批不加入 React/Plait/Slate 生产依赖。
- 不宣称 sequence、ER、class、state 或任意 flowchart 已经有 Drawnix 原生输出。这些图在拥有专用投影前继续走 Mermaid 或 Draw.io。
- 不新增 public CLI command。现有 Obsidian command 调用只用于端到端验收。

## 提示词与语义契约

Drawnix profile 位于 `diagramSpecPrompt.ts`，只在 Drawnix 思维导图路由启用。它要求 LLM 输出既有结构化字段，不要求 LLM 直接输出 Drawnix JSON。

```text
Target: editable Drawnix knowledge map.
Required intent: mindmap.
Create one root node and 3-6 first-level branches.
Each branch has 2-5 children; maximum hierarchy depth is 3.
Use node.children for ownership and taxonomy.
Do not duplicate parent-child relationships in edges.
Use edges only for cross-branch runtime dependencies; emit at most 4.
Use concise labels. Keep operational detail in leaves, not in the root.
For architecture notes, organize the tree by subsystem first. Treat request/data flow as cross-branch relationships.
```

parser 与 validator 必须承担能机械验证的部分：唯一 root、受限深度、唯一 id、合法子节点引用和跨关系数量。无效的思维导图投影需要拒绝并回退到原请求目标，不能静默拍平为旧网格。

## 交付顺序

### 阶段 0：兼容性探针与 fixture

检查固定 `ref/drawnix` 基线，在上游编辑器中创建最小思维导图 fixture，记录精确 element shape、theme object、viewport 语义与导入行为。将 fixture 和来源信息加入受跟踪测试夹具。`ref/` 继续是本地分析材料，不能成为测试依赖。

### 阶段 1：思维导图投影与导出

实现投影、确定性分支布局、受限关系路由、exporter、SVG companion renderer 和目标专用 prompt profile。将 `DrawnixRenderer.supports()` 收窄到已交付的 `mindmap` 契约。保留其它 render target 与默认 best-fit 行为。

### 阶段 2：产品暴露与 CLI 验证

仅在阶段 1 通过后，把 `mindmap` 作为一等图表选择暴露。通过现有 Obsidian CLI command bridge，使用显式 mind-map intent 从 `docs/architecture.zh-CN.md` 生成 `.drawnix`。它验证真实 command/artifact 链路，不把该桥接器夸大为 public CLI API。

### 阶段 3：架构画布决策

只有在思维导图质量验收后，再评估独立的 `DrawnixArchitectureProjection`。它需要模块分组、正交路由、边标签位置和碰撞处理；不得通过一个 mode flag 复用思维导图 adapter。若没有足够证据支撑，应让架构 flowchart 继续使用 Draw.io 或 Mermaid，并把 Drawnix 聚焦于知识导图。

### 阶段 4：可选只读 Plait 预览

只有重型运行时打包隔离已经存在，才考虑独立 bundle、按需加载的只读 Plait 预览。这是预览增强，不是可编辑 `.drawnix` 导出的前置条件。

## 测试与验证矩阵

| 层级 | 必需证据 |
|---|---|
| 投影 | 保留树、分支顺序稳定、每个节点只布局一次、矩形不重叠 |
| 布局 | root/branch 间距、标签宽度上限、跨边数量与路由断言 |
| 导出 | JSON 符合固定思维导图 fixture 契约；不再出现通用矩形网格标记 |
| SVG companion | 使用与导出相同的 node id 与坐标；包含 architecture note fixture snapshot |
| Prompt/parser | 目标 profile 请求合法树；畸形树或超量跨关系在渲染前失败 |
| 集成 | 既有 command 路线从 `docs/architecture.zh-CN.md` 生成 `.drawnix` 和 SVG companion |
| 消费端检查 | 固定上游 Drawnix 可打开产物，保存 screenshot 或 import log 作为 maintainer-local evidence |

实现时先跑定向 Jest，再运行 `npm run build`、`npm test -- --runInBand`、`npm run audit:render-host`、`git diff --check`、`obsidian help` 与 `obsidian-cli help`。后两项只确认文档化 CLI 表面，不能独自证明 Drawnix 渲染。

## 风险与约束

- 上游 JSON 校验很宽松。上游导入是互操作性检查，不是质量判定。
- `theme: "default"` 不是 `PlaitTheme` object。阶段 0 必须先固定已导入 theme fixture，exporter 才能宣称主题对齐。
- LLM 常输出扁平图。提示词改善输入，确定性投影校验才是实际 guardrail。
- 多语言标签需要宽度处理。分支布局应确定性测量/换行，不能再用固定卡片尺寸。
- 跨分支边会破坏思维导图可读性。必须限量，层级优先于关系边。
- 不要引入把两种无关算法藏起来的通用 `layoutMode`。思维导图和未来架构画布应由独立 owner 实现。
- 不要只为了导入类型就添加 Plait 依赖。初始路径不会执行该 runtime，依赖会扩大 bundle 耦合。

## 完成标准

初始交付完成的条件：导出的架构知识导图有可见 root、稳定的子系统分支、未拍平的父子结构、无重叠节点框，也不再使用通用三列布局。`.drawnix` 能导入固定上游基线，SVG companion 几何一致，公开目标文档明确 Drawnix 当前支持可编辑知识导图，不再宣称覆盖所有图意图。
