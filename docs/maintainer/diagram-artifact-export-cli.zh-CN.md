---
date: 2026-07-05
topic: diagram-artifact-export-cli
---

# Diagram Artifact Export CLI

## 契约

`scripts/export-diagram-artifact.js` 是图形扩展工作的离线 CLI 边界，覆盖 Cloudy 风格技术图参考与 Drawnix 参考 spike 产生的 artifact 导出需求。

它读取已验证结构的 `DiagramSpec` JSON 文件，并写出一个 artifact；不需要 Obsidian、`obsidian-cli`、diagrams.net Desktop、Drawnix 或 Plait。SVG 与 source targets 是纯 TypeScript 导出；PNG 与 PDF targets 使用 Playwright Chromium 把同一个 standalone SVG 渲染成固定尺寸的视觉证据。输入文件可以是带 BOM 或不带 BOM 的 UTF-8，这样 Windows PowerShell 生成的 JSON 不需要额外归一化也能直接使用。

推荐直接入口：

```bash
node scripts/export-diagram-artifact.js --input spec.json --target editable-html-svg --output figure.html
node scripts/export-diagram-artifact.js --input spec.json --target drawio --output figure.drawio --preview-svg-output figure.drawio.svg --preview-png-output figure.drawio.png --preview-pdf-output figure.drawio.pdf --ppi 300
node scripts/export-diagram-artifact.js --input spec.json --target drawnix --output figure.drawnix --preview-svg-output figure.drawnix.svg --preview-png-output figure.drawnix.png --preview-pdf-output figure.drawnix.pdf --ppi 300
node scripts/export-diagram-artifact.js --input circuit-spec.json --target circuitikz --output circuit.tex --preview-svg-output circuit.svg --preview-png-output circuit.png --preview-pdf-output circuit.pdf --ppi 300
node scripts/export-diagram-artifact.js --input spec.json --target svg --output figure.svg
node scripts/export-diagram-artifact.js --input spec.json --target png --output figure.png --ppi 300
node scripts/export-diagram-artifact.js --input spec.json --target pdf --output figure.pdf --ppi 300
```

为了兼容既有自动化，package script 仍然可用：

```bash
npm run diagram:export-artifact -- --input spec.json --target drawio --output figure.drawio
```

在 npm 11，尤其是 Windows 上，npm 可能会把 `npm run ... --` 后面的长选项重写为按顺序排列的位置参数，并打印 warning。该 CLI 因此同时接受显式 flag 形态以及这个位置参数 fallback：`input target output previewSvg previewPng previewPdf ppi`。维护者 smoke 脚本如果需要无 warning 输出，应优先使用直接 `node` 入口。

`--ppi` 控制 PNG/PDF 输出的栅格密度。默认值是 `300`；超过 `600` 的值会被夹到 `600`。SVG 保持矢量尺寸，不受该值影响。

PNG 输出还会写入或替换 `pHYs` 物理像素密度 chunk，因此所选 PPI 不只体现在像素尺寸上，也能被图片查看器和排版工具读取。

## Targets

| Target | 输出 | Source model | CLI 内验证 |
|---|---|---|---|
| `editable-html-svg` | 自包含 `.html`，包含 inline SVG | `DiagramSpec -> SemanticFigureModel -> EditableHtmlSvgRenderer` | `collectEditableSvgAnnotationGaps()` 必须为空 |
| `drawio` | 未压缩 diagrams.net `mxfile` XML，可通过 `--preview-svg-output`、`--preview-png-output` 与 `--preview-pdf-output` 同步写出 companion | `DiagramSpec -> SemanticFigureModel -> exportSemanticFigureModelToDrawioXml()` 加 `renderSemanticFigureSvg()` | visible label mismatch 必须为空 |
| `drawnix` | 原生 `.drawnix` 知识导图，可通过 `--preview-svg-output`、`--preview-png-output` 与 `--preview-pdf-output` 同步写出 companion | `DiagramSpec(intent: "drawnixMindmap") -> DrawnixMindMapProjection -> DrawnixRenderer` 加 `notemd-drawnix-mindmap-svg@1.0.0` | 原生层级与关系校验错误必须为空 |
| `circuitikz` | 受约束 `.tex` circuitikz 源文件，可同步写出 SVG/PNG/PDF 预览 companion | `DiagramSpec(intent: "circuit") -> CircuitSpec -> CircuitikzRenderer -> exportCircuitSpecToCircuitikz()` 加 `renderCircuitSpecPreviewSvg()` | 写出 TeX 或 companion 前必须通过 `CircuitSpec` 校验 |
| `svg` | Obsidian 可直接查看的 `.svg`；当 `intent` 为 `circuit` 时来自电路预览 companion | `DiagramSpec -> SemanticFigureModel -> renderSemanticFigureSvg()` 或 `CircuitSpec -> renderCircuitSpecPreviewSvg()` | 必须保留 semantic node/edge annotations，或保留已验证电路预览元数据 |
| `png` | 从同一个 standalone SVG 或电路预览 SVG 渲染出的 `.png` 视觉证据 | `DiagramSpec -> SemanticFigureModel -> renderSemanticFigureSvg() -> Playwright screenshot`，或 `CircuitSpec -> renderCircuitSpecPreviewSvg() -> Playwright screenshot` | 输出尺寸按 SVG CSS 尺寸与所选 PPI 对齐，并写入匹配所选密度的 `pHYs` 元数据 |
| `pdf` | 从同一个 standalone SVG 或电路预览 SVG 渲染出的单页 `.pdf` 视觉证据 | `DiagramSpec -> SemanticFigureModel -> renderSemanticFigureSvg() -> Playwright PDF`，或 `CircuitSpec -> renderCircuitSpecPreviewSvg() -> Playwright PDF` | 页面尺寸按 SVG CSS 尺寸对齐；`--ppi` 控制栅格 companion |

## Obsidian 预览 companion 契约

Draw.io、Drawnix 与 circuitikz source files 是有用的交换格式，但 Obsidian 默认不会把 `.drawio`、`.drawnix` 或 raw `.tex` 渲染成图形。因此插件保存路径在 renderer 能提供 SVG 时，会把 SVG 当作可审查的 companion artifact：

```text
Topic_diagram.drawio
Topic_diagram.drawio.svg
Topic_diagram.drawio.md
```

Markdown wrapper 使用 `![[Topic_diagram.drawio.svg]]` 嵌入 SVG，并链接回 source artifact。Preview diagram 命令在当前 source note 没有 inline diagram fence 时，也会查找这些已生成的 wrapper/source/SVG 路径，因此维护者可以直接验证本地已生成 artifact，而不必重新生成。

对于 circuitikz，SVG companion 是从同一份已验证 `CircuitSpec` 派生出的语义预览，不是 LaTeX/TikZJax 编译结果。它的作用是让 Obsidian 即使无法默认渲染 raw `.tex`，也能查看并导出可审查的 SVG/PNG/PDF 证据。真实 LaTeX/TikZJax 编译证据仍属于 `scripts/export-circuitikz.js` 与 circuitikz smoke runner 的职责边界。

## 为什么放在这个边界

这个 CLI 刻意采用 artifact-first：

- 它证明 figure exporters 能在 Obsidian UI 之外工作。
- 它避免把 Drawnix、Plait、diagrams.net Desktop 依赖带进插件 runtime。
- `drawnixMindmap` 直接进入原生 Drawnix projection；只有其他通用目标才构建 `SemanticFigureModel`，两条路径没有共享前置模型。
- 它通过临时 `esbuild` bundle 复用同一套 TypeScript exporter，而不是维护重复 JS 逻辑。
- 它给 CI 与维护者一个明确命令，可以从同一个 `DiagramSpec` 生成所有 Cloudy 风格与 Drawnix relevant artifact。

临时 bundle 位于操作系统 temp 目录，导出后会删除。no Obsidian runtime is required。

## 支持证据

规范回归测试：

```bash
npm test -- --runInBand src/tests/diagramArtifactExportCli.test.ts --runTestsByPath
```

测试会写入一份 `DiagramSpec`，并验证：

- `editable-html-svg` 包含语义化 `data-drawio-*` 注解。
- 节点 id 在空白归一化后仍保持唯一。
- `drawio` XML 保留可见节点与边 label。
- `drawnix` JSON 包含 `mindmap` root、嵌套 `mind_child` elements 和通过校验的 `arrow-line` 跨关系。
- Drawnix projection 的布局是确定性的，最大深度为 3，最多 4 条跨分支关系，并生成专用 SVG companion。
- `drawio`、`drawnix` 与 `circuitikz` 可以写出用于 Obsidian 预览验证的 SVG companion 文件。
- `circuitikz` 只有在 `DiagramSpec.circuitSpec` 通过校验后才会写出受约束 TeX，并可从同一份电路 payload 导出 SVG/PNG/PDF 预览 companion。
- `svg` 可以直接输出同一个 annotated semantic figure sheet；当 `intent: "circuit"` 时，则输出已验证的电路预览 companion。
- `png` 与 `pdf` 属于公开 CLI target，支持 `--ppi`，默认值为 `300`，并会把过大的 PPI 值夹到 `600`。
- 不支持的 target 会在写输出前失败。

## 非目标

这个 CLI 不运行完整 Drawnix Web App import，也不自动化 diagrams.net Desktop。这两者属于独立的本地视觉/import runbook。CLI 证明 deterministic artifact generation 与结构验证；它不证明每个编辑器 UI 行为。标准 Mermaid `mindmap` 仍走独立路径，Drawnix 路由不会改写它。
