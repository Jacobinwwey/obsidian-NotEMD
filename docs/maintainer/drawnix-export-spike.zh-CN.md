# Drawnix 原生知识导图导出

语言: [English](./drawnix-export-spike.md) | **简体中文**

本文记录 Notemd 在不嵌入 Drawnix、Plait 或 Drawnix React host 的前提下支持的 Drawnix 路径。

参考基线是 `ref/drawnix` 的 `develop@9939f45`。上游 `DrawnixExportedData` envelope 的字段契约是 `type/version/source/elements/viewport/theme`，其中 `theme` 可选。Notemd 没有伪造未经验证的主题对象，因此当前导出省略该字段。上游 JSON 校验只检查 envelope，插件会在写文件前额外校验原生思维导图子集。

## 已实现契约

公开路径使用独立的 `drawnixMindmap` 图表意图：

```text
DiagramSpec(intent: "drawnixMindmap")
  -> DrawnixMindMapProjection
  -> DrawnixMindMapExporter (.drawnix)
  -> DrawnixMindMapSvgRenderer (SVG companion)
```

本次契约支持一个或多个顶层 root。每个顶层节点导出为 `mindmap`，其 `node.children` 保持为 `mind_child`；不同 root 之间的关系仍使用受限的 `arrow-line`。这样架构笔记可以保留相互独立的子系统，而不必人为添加容器节点或拍平层级。

投影保留一个或多个顶层 root，并把 `node.children` 作为 Drawnix forest：

- root 元素：每个顶层节点对应一个 `type: "mindmap"`
- 后代元素：`type: "mind_child"`
- 跨分支关系：`type: "arrow-line"`
- 不设固定的层级深度或关系数量配额
- 两阶段关系通道先预留水平 gutter，再在 forest 已知后安排同侧与跨 forest 关系
- 坐标和标签换行是确定性的
- 较大的 forest 会按确定性规则分行，并限制单行画布宽度
- SVG renderer 版本：`notemd-drawnix-mindmap-svg@1.0.0`

导出器写入 `type: "drawnix"`、`version: 1`、`source: "web"`、固定 viewport、一个或多个嵌套元素树和通过校验的跨关系箭头。生产路径不依赖 `SemanticFigureModel`，并保持 no Plait dependency。标准 Mermaid `mindmap` 仍走原有 Mermaid 路径；best-fit 推断可以把复制的 spec 映射为 Mermaid，但用户显式选择 Drawnix 时会 fail closed，不会在 Drawnix 操作下返回 Mermaid payload，也不会拍平原始 forest。

### 关系标签层级与路由

跨分支和同 root 关系都会把已放置的节点矩形作为路由障碍物。通道分配分为两步。节点落位前，投影按最长已测量关系标签预留水平 gutter 宽度。节点落位后，分配器按端点相对 root 的方位分类：同侧关系在该侧外部 gutter 中使用两条轨道，并在端点附近安排确定性行；跨 forest 关系使用底部通道。router 只负责通过这些轨道完成端点接入。当无关的更宽同级分支挡住第一条分支局部列时，这条设计避免同侧关系绕行整张画布。

节点、标题/摘要页眉、其他标签矩形和画布内缩范围仍是硬障碍物。如果这些约束没有留下可用几何，关系必须拒绝；分配器不会通过恢复层级或关系数量配额来回避该情况。每条带标签关系会在分配前测量并换行，原生 Drawnix 文字框与 SVG 标签使用同一矩形。标题/摘要页眉继续使用与节点相同的确定性宽度估算；长摘要会拆成显式多行，forest 下移到 `safeHeight` 之后。SVG companion 按“连接线、节点、关系标签、页眉”的顺序绘制，最后的页眉带不透明白色背景。

原生箭头现在使用与 Plait 兼容的契约：`shape: "straight"` 保留显式正交折线路径，`source`/`target` 携带原生 marker，`texts[]` 保存 paragraph 以及路径上的归一化 `position`，`strokeColor`/`strokeWidth`/`strokeStyle`/`opacity` 保存视觉样式。旧版读取器仍可使用兼容性 metadata 中的 `text` 与 `style`。由于上游连接解析器要求几何元素拥有 `points`，而原生 `mind_child` 并不拥有该字段，因此不会输出 `boundId`；这样可以避免宿主导入异常，同时保留明确的关系路径。

当源笔记包含 Mermaid fence 或 Obsidian 图片嵌入时，原生 JSON 还会携带可选的 `metadata.notemd.sourceVisuals` 索引。这里有意使用 metadata，而不是新增未经验证的 Drawnix 原生图片 element：每项记录 source hash、解析状态、源路径和 companion 名称。默认情况下，已解析 Mermaid 图会把安全 SVG 与源文本内联，已解析二进制图片使用 data-backed SVG 预览，因此不会生成独立 `.drawnix.assets` 目录。开启 **同时完整输出 Mermaid 图** 后，才会为外部交接写出 Mermaid 源码、SVG 与 manifest companion。带 companion 路径的旧 artifact 仍可读取；预览先使用内嵌数据，再尝试 companion，旧 companion 缺失时最后从 metadata 中保留的源文本重建 Mermaid 图。这样既保持已验证子集的原生 element 流兼容，又能从 `.drawnix` 文件本身发现源视觉信息。

## 自动化证据

定向回归命令：

```bash
npm test -- --runInBand src/tests/drawnixExporter.test.ts src/tests/drawnixRelationLaneLayout.test.ts src/tests/drawnixMindMapRenderer.test.ts src/tests/drawnixMindMapRouting.test.ts src/tests/drawnixExportDocsContract.test.ts --runTestsByPath
```

测试覆盖：

- `DrawnixExportedData` envelope 与 `mindmap`/`mind_child` 层级
- 确定性布局、深层分类保留，以及没有数量门槛的动态关系通道分配
- 同侧外部 gutter、跨 forest 底部通道，以及不会进入任何节点或裁剪画布的稠密端点接入
- 原生箭头文字位置规划，保证 Plait 文字框避开节点和受保护的页眉区域
- 稳定的 `.drawnix` JSON 序列化与 `arrow-line` 校验
- 专用 SVG companion 使用相同的 node id 和投影坐标
- 源码不引入 `SemanticFigureModel`、`@drawnix/*`、`@plait/*` 或 `@plait-board/*`

## manual open/import 边界

Drawnix web app 通过 `localforage` 加载 board state，通过 `loadFromBlob(...)` 导入文件。真实 manual open/import 仍需要运行 Drawnix 本身：

1. 使用 `scripts/export-diagram-artifact.js --target drawnix` 生成 `.drawnix` 文件。
2. 将生成文件放在 tracked source paths 之外。
3. 打开 Drawnix，或启动 `ref/drawnix` 中的 Drawnix web app。
4. 导入或打开该文件。
5. 确认 root、嵌套分支、跨分支箭头和可见标签都出现。
6. 在 maintainer-local evidence 中记录文件路径、Drawnix commit、Notemd commit 和结果。

Jest 只能证明已检查的契约和确定性输出，不能证明完整 Drawnix UI import。

## 依赖决策

Drawnix 保持在 adapter/data boundary。不要把 Plait 或 Drawnix packages 加入 Notemd runtime bundle，也不要在插件内嵌 Drawnix editor、toolbar、持久化层或浏览器文件 API。完整宿主或只读 Plait preview 仍是独立后续阶段，必须先具备 bundle isolation 和单独的验收证据。

## 剩余阶段决策

Architecture-canvas decision: rejected。没有独立产品需求，以及覆盖分组、路由、标签和碰撞处理的验收 fixtures 时，不新增 `DrawnixArchitectureProjection`。架构 flowchart 继续走 Draw.io or Mermaid。

Stage 4 decision: deferred。仓库没有通过验证的重型 runtime bundle isolation。在 lazy loading、失败恢复、bundle size budget 和 Obsidian 生命周期覆盖存在前，继续使用专用 SVG companion，并保持 no Plait dependency。
