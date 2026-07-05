# Drawnix 导出 Spike

语言: [English](./drawnix-export-spike.md) | **简体中文**

本文记录 Notemd 在不嵌入 Drawnix、Plait 或 Drawnix React host 的前提下，可以支持的窄 Drawnix export path。

参考基线是 `ref/drawnix` 的 `develop@9939f45`。相关文件契约来自 `packages/drawnix/src/data/types.ts`：`DrawnixExportedData` 的顶层结构是 `type/version/source/elements/viewport/theme`。对应的 `packages/drawnix/src/data/json.ts` 中，`isValidDrawnixData(...)` 只校验 `type === "drawnix"`、`Array.isArray(elements)`，以及 `viewport` 是 object-like。

## 已实现子集

Notemd 从 `SemanticFigureModel` 导出最小 `.drawnix` JSON subset：

- 顶层 `DrawnixExportedData` fields：`type/version/source/elements/viewport/theme`
- `type: "drawnix"`
- `version: 1`
- `source: "web"`
- `viewport: { zoom: 1, offsetX: 0, offsetY: 0 }`
- `theme: "default"`
- 节点元素为 `geometry` rectangles
- 边元素为 `arrow-line`
- 文本 payload 使用 Slate-like `{ children: [{ text }] }`
- 面向 `.drawnix` files 的稳定 pretty JSON serialization

这个 exporter 明确保持 **no Plait dependency**，也没有 Drawnix runtime dependency。这样可以保持插件 bundle 隔离，避免一个 spike 静默演变成大型运行时集成。

## 自动化证据

不依赖 Drawnix host 能证明的部分由自动化测试覆盖：

```bash
npm test -- --runInBand src/tests/drawnixExporter.test.ts src/tests/drawnixExportDocsContract.test.ts --runTestsByPath
```

这些测试验证：

- 顶层 `DrawnixExportedData` shape
- 支持的 `geometry` 与 `arrow-line` element subset
- 稳定 `.drawnix` JSON serialization
- 对 unsupported subset drift 快速失败
- 源码层面没有 `@drawnix/*`、`@plait/*` 与 `@plait-board/*` imports

## manual open/import 边界

Drawnix web app 通过 `localforage` 加载 board state，文件导入通过 `loadFromBlob(...)`。真实 manual open/import 检查仍然需要运行 Drawnix 本身：

1. 使用 `stringifyDrawnixExportedData(...)` 生成 `.drawnix` JSON。
2. 将它保存为本地 `.drawnix` file，路径放在 tracked source paths 之外。
3. 打开 Drawnix 或 `ref/drawnix` 中的 Drawnix web app。
4. 导入或打开该文件。
5. 确认 geometry rectangles、arrow-line edges 与 visible labels 都出现。
6. 记录文件路径、Drawnix commit、Notemd commit 与结果。

不要把 Jest JSON test 当成完整 Drawnix UI import 的证明。它只证明当前数据符合已检查的参考顶层契约，以及 Notemd 支持的 subset。

## 依赖决策

当前决策：Drawnix 只作为 export target spike 保留。不要把 Plait 或 Drawnix packages 加入 Notemd runtime bundle。

只有以下条件全部成立时，才重新评估：

- 用户需要 editable board round-tripping，而不只是 `.drawnix` handoff
- heavy render runtimes 的 bundle isolation 不再只是 candidate-only
- release assets、audit logic 与 docs 能同批推进
- Drawnix supported subset 超出简单 `geometry` 与 `arrow-line` elements

在此之前，小型 deterministic exporter 是更合理的工程边界。
