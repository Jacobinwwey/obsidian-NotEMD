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

投影保留一个 root，并把 `node.children` 作为嵌套 Drawnix 元素：

- root 元素：`type: "mindmap"`
- 后代元素：`type: "mind_child"`
- 跨分支关系：`type: "arrow-line"`
- maximum depth 3
- at most 4 cross-branch relationships
- 坐标和标签换行是确定性的
- SVG renderer 版本：`notemd-drawnix-mindmap-svg@1.0.0`

导出器写入 `type: "drawnix"`、`version: 1`、`source: "web"`、固定 viewport、嵌套元素树和通过校验的跨关系箭头。生产路径不依赖 `SemanticFigureModel`，并保持 no Plait dependency。标准 Mermaid `mindmap` 仍走原有 Mermaid 路径；Drawnix 失败回退时只复制 spec 并映射为 Mermaid，不会拍平原始树。

## 自动化证据

定向回归命令：

```bash
npm test -- --runInBand src/tests/drawnixExporter.test.ts src/tests/drawnixMindMapRenderer.test.ts src/tests/drawnixExportDocsContract.test.ts --runTestsByPath
```

测试覆盖：

- `DrawnixExportedData` envelope 与 `mindmap`/`mind_child` 层级
- 确定性布局、节点矩形分离、深度限制和关系数量限制
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
