---
date: 2026-08-14
topic: drawnix-presentation-architecture-review
status: superseded
superseded_by: ../plans/2026-08-14-diagram-type-catalog-and-drawnix-delivery-implementation.zh-CN.md
related:
  - 2026-07-22-drawnix-knowledge-map-quality-and-delivery-plan.zh-CN.md
  - 2026-08-08-diagram-platform-robustness-and-settings-integrity-plan.zh-CN.md
---

# Drawnix 演示交付架构复核

> 状态（2026-08-15）：已废弃。replay 前置校验阻断了一次真实 Vault 导出后，这个方案被移除，没有保留为可切换模式。当前产品路径是一张可编辑的文件名根节点 Drawnix 树及其单个 SVG companion。当前行为以[实施记录](../plans/2026-08-14-diagram-type-catalog-and-drawnix-delivery-implementation.zh-CN.md)为准；本文只保留被否决的分析。

## 结论

当前 `drawnixMindmap` 已经是独立图表意图，不是 Mermaid 输出格式的别名：`DiagramSpec` 进入专用投影、生成 `.drawnix`，再生成 SVG companion。标准 `mindmap` 仍走 `MermaidRenderer`，不应改变。

现有问题也不在语义容量。固定基准已经导出 8 个 root、136 个节点和 32 条关系，验证错误为 0。问题发生在把完整知识图谱直接作为单张静态 SVG 演示时：root 按源顺序分行，跨 root 关系被拉进底部通道，画布变得极宽，文字与关系的阅读顺序被削弱。

下一步不能用节点数、深度或关系数上限来换取干净截图。完整 `.drawnix` 画布必须保留语义；静态交付应从同一语义图导出概览和聚焦切片。这是两个产品边界，不是一个 `layoutMode` 参数。

## 已实现的交付选择

当前实现包含面向用户的一键选择：**全量画布** 与 **演示交付**。选择器分派独立的 host operation，不会改变共享投影函数的行为。

- 全量画布保留当前 `.drawnix` 与全铺展 SVG 契约，是 legacy setting 和 legacy artifact 的默认路径。
- 演示交付写出同一份兼容画布、overview/detail 静态切片和 fidelity ledger。
- 新 artifact 持久化经过验证的语义 replay record，用户可在不再次调用 LLM 的前提下重建另一种交付。
- 缺少该记录的旧 artifact 继续可读为全量画布；请求演示交付时必须重新生成，不执行有损重建。

设置项持久化 `drawnixKnowledgeMapDelivery`；缺失或非法的值均解析为全量画布。预览控件只重放经过验证的 `metadata.notemd.knowledgeMap.semanticSpec`，因此切换只替换内存中的预览会话，不调用 LLM、不修改设置，也不写入 artifact。保存演示交付时会写出兼容 board 和由 manifest 关联的 overview/detail SVG bundle。Plait consumer 证据通过锁定版本的公开 ESM 包在 test-only harness 中运行。

目录、兼容性、持久化与示例图库的完整设计见[图表类型目录与 Drawnix 交付设计](../plans/2026-08-14-diagram-type-catalog-and-drawnix-delivery-design.zh-CN.md)。

## 证据

| 观察 | 代码证据 | 影响 |
|---|---|---|
| 提示词要求一个 document root | `src/diagram/prompts/diagramSpecPrompt.ts:143-145` | 模型被禁止产出独立子系统 forest。 |
| source coverage 无条件合成 document root | `src/diagram/adapters/drawnix/drawnixSourceCoverage.ts:557-584` | 即使输入已有多个合法 root，进入投影前也被收束。 |
| 投影已支持多个 root | `src/diagram/adapters/drawnix/drawnixMindMapProjection.ts:796-965` | 产品能力与生成策略相矛盾。 |
| root 打包使用源顺序和固定 6400 宽度 | `drawnixMindMapProjection.ts:786-826` | 不考虑跨 root 关系权重，容易制造长关系通道。 |
| native 导出仅给 root 写 `points` | `drawnixMindMapProjection.ts:514-531` | 子节点由上游 `withMind` 布局；SVG 的子节点坐标不能视为 native board 的像素真值。 |
| SVG 外观由 depth 和 branch index 决定 | `src/rendering/renderers/drawnixMindMapSvgRenderer.ts:148-189` | `node.kind` 没有视觉语义，分支换序会改变颜色含义。 |
| 官方 Drawnix 打开文件后主动 fit viewport | `ref/drawnix/packages/drawnix/src/components/toolbar/app-toolbar/app-menu-items.tsx:75-96` | 导出 `viewport.zoom = 1` 不是官方导入后横向失控的主因；它只影响不执行 fit 的消费者。 |

基准 SVG 位于本地 `.cache/diagram-design-comparison/drawnix-knowledge-map-benchmark.svg`。它保持了所有 topology，但静态呈现为两条宽行和多条长关系隧道。这个结果支持“展示层缺失”的判断，不支持“语义需要压缩”的判断。

## 对 `diagram-design` 的取舍

本地参考仓库为 `ref/diagram-design`，提交为 `a5e3978`。它是一个 agent skill、HTML/SVG 模板和启发式检查集合，不是通用图形 IR、布局求解器或 Drawnix renderer。

可复用的原则：

* 先确定 medium、尺寸、受众和细节级别；尺寸同时决定画布和字号。
* 用语义 token 表达 paper、ink、muted、accent、link，而不是把颜色散落在模板中。
* 在静态输出中报告 fidelity ledger，明确何处合并、折叠或转为聚类。
* 将 connector、标签和节点间距作为可验证的几何约束。

不应照搬的部分：

* 其 9/12/24 节点预算适合单页演示，不适合作为知识图谱或可编辑画布的数据约束。
* draw.io/Mermaid 导入刻意重绘并丢弃源坐标；这适合 slide redesign，不适合 Notemd 的 Drawnix 互操作性契约。
* `verify-geometry.py` 主要基于 SVG 标签矩形和字符串解析，不能代替变换、字体度量、曲线路径和真实 consumer layout 的验证。

Windows 兼容性也有一个具体缺陷：`drawio_extract.py:851` 与 `mermaid_extract.py:1280` 直接写 `sys.stdout`。默认 cp1252 环境下，参考仓库的 Mermaid 和 draw.io import gates 会因为 Unicode `U+23CE` 失败；设置 `PYTHONUTF8=1` 后两套 gate 都通过。这个问题与语义解析无关，但说明它的 CLI 边界没有被跨平台测试覆盖。

## 目标边界

```text
Markdown / Mermaid / source evidence
  -> semantic knowledge graph
  -> Drawnix board projection
  -> editable .drawnix

semantic knowledge graph
  -> presentation planner
  -> overview + focused presentation slices
  -> SVG / PNG / PDF
```

两条链路共享稳定 node ID、层级 ownership、关系端点、来源引用和语义角色；不要求共享像素坐标。强制共享坐标会把上游 `withMind` 的自动布局约束泄漏到静态导出，也会阻止为投影、打印和讲解切片做适配。

建议的 owner：

| Owner | 输入 | 输出 | 不变量 |
|---|---|---|---|
| `buildDrawnixKnowledgeMapBoardProjection()` | 完整语义 forest | `.drawnix` 兼容树与关系 | 不删除节点或关系；稳定 ID；可由上游 consumer 打开。 |
| `buildKnowledgeMapPresentation()` | 完整语义 forest + delivery contract | 概览与聚焦静态切片 | 每项折叠均进入 fidelity ledger；原图仍可访问。 |
| `renderKnowledgeMapPresentationSvg()` | 已布局切片 | SVG/PNG/PDF | target size、字号、标签间距和可读视区满足约束。 |

这三个操作应是独立入口。不要用 boolean、enum 或 options bag 把 board layout、overview 和 slide layout 塞进同一个函数。

## 建议的推进顺序

### Phase 0: 修正语义策略与文档

拆开 source coverage 的两个职责：`buildSourceCoverageForest()` 只补齐来源结构；`buildDocumentRootedKnowledgeMap()` 只在明确需要文档总览时创建根。Drawnix prompt 改为允许独立子系统作为 root，并保留每个 root 的来源范围。静态概览可以选用 document root，但它不能回写为 board 的语义真值。

同时撤销“native 与 SVG 同几何”的宽泛表述。当前可证明的是 relation-label 的计算共享；完整节点坐标需要真实 Plait consumer 验证后才能声明一致。

### Phase 1: 固定 board 互操作性契约

在测试依赖中固定上游 Drawnix/Plait 版本，不进入插件生产 bundle。导入 fixture 后挂载最小只读 board，断言 root/child 树、stable ID、关系端点、关系文本和可见边界。测试应记录 consumer 得到的实际矩形，而不是比较 Notemd SVG 的坐标快照。

`viewport` 只作为建议 opening state。官方 file-open 已执行 `fitViewport`，因此不要把 viewport 调整排在 root 聚类、展示切片或 consumer 证据之前。

### Phase 2: 演示规划器

以 root cluster graph 为输入，边权来自跨 root relation 数量、方向和标签重要度。先用加权关系重排和分组 root，再在目标宽高比下打包。优化目标为关系总长度、交叉数、过大纵横比和标签净空；这些是评分项，不是拒绝复杂图的配额。

当完整树无法在指定 medium 中保持最小字号时，planner 产出：

* 一个保留 root 间关系的 overview；
* 每个重 cluster 的 detail slice；
* 一份 ledger，列出聚类、摘要和被引导到 detail 的节点。

完整 `.drawnix` 仍包含全部节点与关系，静态输出通过链接或文件命名回到它。

### Phase 3: 视觉语义与目标专用 prompt

从 `node.kind`、关系类型和来源角色生成有限的 semantic token 集。root、subsystem、component、evidence 和 cross-relation 应有稳定且可说明的处理；不能再让 `branchIndex` 循环决定业务颜色。prompt 只负责生成完整树、关系角色和简短标签；颜色、换行、聚类和路由由确定性代码负责。

为 Drawnix 单独维护 prompt 示例：多 root 架构、深层 taxonomy、跨 branch 依赖、长标签与中文/英文混排。示例应给出期望 `DiagramSpec`，而不是让模型学习 Drawnix JSON。

### Phase 4: 质量门

保留现有“无语义配额”测试，新增以下证据：

* board fixtures 检查语义完全保留与上游 consumer 导入；
* planner fixtures 比较相同输入下的新旧评分，要求无硬约束退化；
* SVG 检查实际 viewport 中的最小字号、裁剪、节点/标签相交和 connector 可追踪性；
* overview/detail ledger 覆盖测试，确保所有源节点可在输出集合中定位；
* Mermaid `mindmap` 回归套件单独运行，证明 Drawnix 改动不接管 Mermaid 路径。

不要删除已有测试来获得复杂图。应删除的只有历史上的深度、关系数量和固定 fallback 测试；当前测试若保护 ID、所有权、避障或确定性，应保留。

## 风险与取舍

* 把 `diagram-design` 的“删减优先”直接应用到 board 会损害 Notemd 的知识沉淀价值。删减只能存在于有 ledger 的 presentation slice。
* 完整上游 Drawnix host 嵌入仍然没有必要。它增加 React/Plait 生命周期和 bundle 风险，却不能替代 source provenance 与 presentation planning。
* 仅优化 relation router 不能修复宽画布。根的图论顺序和 medium-aware slicing 在 router 之前决定大部分可读性。
* LLM prompt 不能保证画面质量。它应提高语义结构质量；布局质量必须由确定性 planner 和 consumer test 兜底。

## 完成定义

Phase 1 完成后，原生 board 的可编辑语义和静态演示输出都有独立、可验证的契约。复杂 forest 不会因展示限制被截断；单张 SVG 无法承载时，会产生可追踪的 overview/detail 集合。Mermaid mindmap 的命令、渲染器和回退行为不变。
