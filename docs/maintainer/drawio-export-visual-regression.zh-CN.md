# draw.io 导出视觉回归 Runbook

语言: [English](./drawio-export-visual-regression.md) | **简体中文**

本文定义 Notemd 确定性 draw.io exporter 的维护者本地核验层。这个 exporter 是一个 library boundary：它把内部 `SemanticFigureModel` 转换为未压缩 draw.io XML，可由 diagrams.net Desktop 或 diagrams.net web app 打开。它不会把 diagrams.net、Drawnix 或 Plait 嵌入插件运行时。

`diagrams.net Desktop` is **not a normal CI dependency**。CI 应继续使用单元测试与契约测试验证 deterministic XML、visible label parity、抽样 style mapping、`data-drawio-type` 连续性，以及 `editable-html-svg` preview 行为。视觉检查仍属于维护者本地证据，因为 diagrams.net 的导入与渲染行为来自外部桌面软件。

## 何时执行

当改动触及以下任一范围时，执行本检查：

- `src/diagram/adapters/editableSvg/semanticFigureModel.ts`
- `src/diagram/adapters/drawio/drawioExporter.ts`
- `src/rendering/renderers/editableHtmlSvgRenderer.ts`
- draw.io style mappings、visible label 逻辑，或 edge/source/target 映射
- `editable-html-svg` preview 或源产物导出行为

## 仓库硬门

先执行聚焦 gate：

```bash
npm test -- --runInBand src/tests/drawioExporter.test.ts src/tests/editableHtmlSvgRenderer.test.ts src/tests/editableHtmlSvgPreview.playwright.test.ts src/tests/drawioExportDocsContract.test.ts --runTestsByPath
```

进入 release 或 mainline closeout 前，还需要执行：

```bash
npm run build
npm test -- --runInBand
git diff --check
```

## 本地视觉检查

1. 从 `exportSemanticFigureModelToDrawioXml(...)` 生成或捕获 draw.io XML artifact。
2. 将它保存为本地 `.drawio` 文件，路径放在 tracked source paths 之外，例如临时目录。
3. 用 diagrams.net Desktop 打开，或导入 diagrams.net web app。
4. 确认每个预期节点和边都可见。
5. 确认每个 visible label 与原始 `SemanticFigureModel` label 完全一致。
6. 确认节点 fill/stroke 与抽样 role mapping 一致。
7. 确认边方向、source/target anchoring、arrowheads 与 dashed async relations 视觉正确。
8. 记录截图或简短文字证据，包含文件路径、commit 与观察结果。

除非后续任务明确引入 fixture artifacts，否则不要提交生成的截图或 `.drawio` 文件。

## Supported primitives

- 带 visible labels 的圆角矩形节点。
- Node roles：`actor`、`boundary`、`processor`、`process`、`state`，以及中性 fallback style。
- 带 `source` 和 `target` 引用的有向边。
- Edge labels 来自 `SemanticFigureEdge.label`；没有 label 时回退到 relation。
- 类 async 的 edge relations 映射为 dashed draw.io edges。
- 适合 deterministic diffs 与文本 review 的未压缩 XML。
- 对 XML 敏感字符做 label escaping。

## Unsupported

- 任意 draw.io stencil libraries。
- Swimlanes、containers、collapsed groups、embedded images 与 custom icons。
- Mermaid import/export round-trips。
- 完整 diagrams.net layout engine parity。
- 与 `editable-html-svg` 的 pixel-perfect parity；两个 target 共享 semantic model data，而不是共享浏览器渲染引擎。
- 普通 CI 中的桌面自动化。

## 验收说明

最强自动化证据是：

- `collectDrawioVisibleLabelMismatches(xml, model)` 返回空 mismatch。
- XML contract tests 证明 deterministic `mxfile` structure。
- sampled style tests 证明 role 与 edge relation mappings。
- `editable-html-svg` tests 证明 `data-drawio-type` annotations 在 draw.io export hardening 消费同一个 model 前仍然存在。

最强手工证据是 diagrams.net Desktop 的本地导入结果，能够显示 visible label parity 与正确的抽样样式。
