---
date: 2026-07-22
version: 1.9.4
topic: drawnix-knowledge-map-quality-and-delivery
status: implemented
---

# Drawnix 知识导图质量与交付方案

## 当前实现

当前 Drawnix 路径已经落地为独立的 `drawnixMindmap` 图表意图。标准 Mermaid `mindmap` 保持原有生成和回退语义，不会被 Drawnix renderer 改写。

```text
DiagramSpec(intent: "drawnixMindmap")
  -> DrawnixMindMapProjection
  -> DrawnixMindMapExporter (.drawnix)
  -> DrawnixMindMapSvgRenderer (notemd-drawnix-mindmap-svg@1.0.0)
```

契约包含一个或多个顶层 root、`node.children` forest、`mindmap`/`mind_child` 元素，以及用 `arrow-line` 表示的跨分支关系。不设固定的层级深度或关系数量配额。关系通道按标签尺寸和安全画布空间计算；只有语义无效，或无法在不进入受保护区域且不裁剪画布的前提下完成路由时，投影才会拒绝。较大的 forest 会按确定性规则打包到有宽度上限的多行中，避免 root 数量增长后画布变成单行长带。CLI 会在构建通用 `SemanticFigureModel` 前进入 Drawnix 分支；完整 Drawnix 宿主和 Plait preview 继续延期。

## 路由与源覆盖更新（2026-08-14）

早期 Drawnix 策略的数值深度预算和少量关系配额会拒绝本身有效的架构导图，现已移除。当前链路把语义校验、forest 排版、通道分配和端点接入分开：

```text
语义校验
  -> forest 布局
  -> 按已测量标签预留 gutter
  -> 节点落位后的关系通道分配
  -> 端点接入路由
  -> 原生 Drawnix/SVG 标签共享几何校验
```

预分配阶段会把 forest 放在可容纳最长关系标签的水平空间中。节点获得坐标后，分配器按端点相对 root 的方位决定通道：同侧关系在该侧的外部 gutter 内使用两条轨道，并在两个端点附近安排确定性行；跨 forest 关系继续使用底部通道。这样当更宽的同级分支挡住第一条局部列时，同侧依赖不会被迫横跨整张图。

router 仍把节点、页眉保护带、其他标签矩形和画布边界当作硬障碍物。原生 Drawnix 文字与 SVG 标签共用同一矩形，几何不一致即拒绝投影。实现不会用放松这些不变量来换取可达路径。

源覆盖遵循同一语义原则。Markdown 标题链和未匹配的模型分支保留完整层级和 ID。诊断只描述实际节点合并，或无效、重复、重复层级所有权关系边的丢弃，不再承担深度压缩职责。回归夹具包含六级源标题和超过原阈值的模型分支，并检查其跨关系仍保留原始端点 ID。

回归测试按层分工。通道单测验证动态关系分配、外侧走廊选择，以及给定画布无法容纳几何时的明确失败。路由夹具覆盖多分支架构图、确定性输出、节点/页眉/画布安全，以及同侧关系的局部路径。renderer 测试覆盖原生/SVG 几何和页眉换行。源覆盖测试验证深层结构保留和关系端点有效性。测试不再编码最大深度、最大关系数、必须使用的兜底策略或历史画布宽度。

后续工作是运行层面的：为包含大量跨关系的大型 forest 增加代表性性能基准，并在发版候选中保留真实上游导入证据。性能回归应通过布局或路由优化解决，不能重新引入语义配额。

## 原始审计（历史）

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

- `DrawnixRenderer` 只接受 `intent: "drawnixMindmap"`。
- `DiagramNode.children` 保留为主树，不把父子关系重新编码为普通 edges。
- 树布局完成后，只要能分配独立通道并安全接入端点，就支持跨分支关系。它们是注释，不是主结构。
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
Required intent: drawnixMindmap.
Create one or more top-level root nodes. Keep independent subsystems as separate roots instead of inventing a container node.
Keep the hierarchy as deep as the source requires. Do not flatten a meaningful taxonomy to meet an arbitrary depth budget.
Use node.children for ownership and taxonomy.
Do not duplicate parent-child relationships in edges.
Use edges only for cross-branch runtime dependencies. Preserve every material relationship needed to explain the source; the renderer allocates adaptive relation lanes.
Use concise labels. Keep operational detail in leaves, not in the root.
For architecture notes, organize the tree by subsystem first. Treat request/data flow as cross-branch relationships.
```

parser 与 validator 只承担可机械验证的部分：至少一个 root、唯一 id、合法子节点引用、合法关系端点，以及不重复层级所有权的关系。无效或无法安全布线的投影必须拒绝；显式请求 Drawnix 时，不能静默拍平为旧网格或改为 Mermaid。

## 交付顺序

### 阶段 0：兼容性探针与 fixture

检查固定 `ref/drawnix` 基线，在上游编辑器中创建最小思维导图 fixture，记录精确 element shape、theme object、viewport 语义与导入行为。将 fixture 和来源信息加入受跟踪测试夹具。`ref/` 继续是本地分析材料，不能成为测试依赖。

### 阶段 1：思维导图投影与导出（已完成）

实现投影、确定性分支布局、自适应关系通道路由、exporter、SVG companion renderer 和目标专用 prompt profile。将 `DrawnixRenderer.supports()` 收窄到已交付的 `drawnixMindmap` 契约。保留其它 render target 与默认 best-fit 行为。

### 阶段 2：产品暴露与 CLI 验证

仅在阶段 1 通过后，把 `mindmap` 作为一等图表选择暴露。通过现有 Obsidian CLI command bridge，使用显式 mind-map intent 从 `docs/architecture.zh-CN.md` 生成 `.drawnix`。它验证真实 command/artifact 链路，不把该桥接器夸大为 public CLI API。

### 阶段 3：架构画布决策（已关闭：拒绝）

Stage 3 decision: rejected。没有独立产品需求，以及覆盖模块分组、正交路由、边标签位置和碰撞处理的验收 fixture 时，不新增 `DrawnixArchitectureProjection`。当前证据不足以支持第二套 Drawnix 算法。架构 flowchart 继续使用 Draw.io or Mermaid，Drawnix 只负责知识导图。不得给思维导图 adapter 增加 mode flag。

### 阶段 4：可选只读 Plait 预览（门禁已关闭：延期）

Stage 4 decision: deferred。仓库还没有通过验证的重型 runtime bundle isolation，因此不能安全地把 Plait preview 加入生产插件。当前继续使用专用 SVG companion，并保持 no Plait dependency。只有 bundle isolation、lazy-load 失败处理、bundle size budget 和 Obsidian 生命周期测试都存在时，才重新打开该门禁。只读预览不是可编辑 `.drawnix` 导出的前置条件。

## 测试与验证矩阵

| 层级 | 必需证据 |
|---|---|
| 投影 | 保留树、分支顺序稳定、每个节点只布局一次、矩形不重叠 |
| 布局 | root/branch 间距、标签宽度上限、通道分配与避障路由断言 |
| 导出 | JSON 符合固定思维导图 fixture 契约；不再出现通用矩形网格标记 |
| SVG companion | 使用与导出相同的 node id 与坐标；包含 architecture note fixture snapshot |
| Prompt/parser | 目标 profile 请求合法树；畸形层级、重复所有权关系或不安全几何在渲染前失败 |
| 集成 | 既有 command 路线从 `docs/architecture.zh-CN.md` 生成 `.drawnix` 和 SVG companion |
| 消费端检查 | 固定上游 Drawnix 可打开产物，保存 screenshot 或 import log 作为 maintainer-local evidence |

实现时先跑定向 Jest，再运行 `npm run build`、`npm test -- --runInBand`、`npm run audit:render-host`、`git diff --check`、`obsidian help` 与 `obsidian-cli help`。后两项只确认文档化 CLI 表面，不能独自证明 Drawnix 渲染。

## 风险与约束

- 上游 JSON 校验很宽松。上游导入是互操作性检查，不是质量判定。
- `theme: "default"` 不是 `PlaitTheme` object。阶段 0 必须先固定已导入 theme fixture，exporter 才能宣称主题对齐。
- LLM 常输出扁平图。提示词改善输入，确定性投影校验才是实际 guardrail。
- 多语言标签需要宽度处理。分支布局应确定性测量/换行，不能再用固定卡片尺寸。
- 跨分支边共享几何时会破坏可读性。层级仍优先于关系边；每条关系分配独立通道，只有不存在安全几何时才拒绝。
- 不要引入把两种无关算法藏起来的通用 `layoutMode`。思维导图和未来架构画布应由独立 owner 实现。
- 不要只为了导入类型就添加 Plait 依赖。初始路径不会执行该 runtime，依赖会扩大 bundle 耦合。

## 完成标准

初始交付完成的条件：导出的架构知识导图有可见 root trees、稳定的子系统分支、未拍平的父子结构、无重叠节点框，也不再使用通用三列布局。`.drawnix` 能导入固定上游基线，SVG companion 几何一致，公开目标文档明确 Drawnix 当前支持可编辑知识导图 forest，不再宣称覆盖所有图意图。
