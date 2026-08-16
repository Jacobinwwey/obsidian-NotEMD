---
date: 2026-08-15
topic: diagram-artifact-export-cli
---

# 图表 Artifact Export CLI

## 契约

`scripts/export-diagram-artifact.js` 在不依赖 Obsidian runtime 的情况下导出已校验的 `DiagramSpec`。它是 `no Obsidian runtime` 边界，不加载 Drawnix、Plait 或 diagrams.net Desktop。source 与 SVG target 使用 TypeScript 导出；PNG 和 PDF 使用 Playwright Chromium 将同一份 standalone SVG 栅格化。输入支持带或不带 BOM 的 UTF-8。

Windows 环境建议直接调用入口，参数行为更可预期：

```bash
node scripts/export-diagram-artifact.js --input spec.json --target editable-html-svg --output figure.html
node scripts/export-diagram-artifact.js --input spec.json --target drawio --output figure.drawio --preview-svg-output figure.drawio.svg --preview-png-output figure.drawio.png --preview-pdf-output figure.drawio.pdf --ppi 300
node scripts/export-diagram-artifact.js --input rooted-drawnix-spec.json --target drawnix --output architecture.drawnix --preview-svg-output architecture.drawnix.svg --preview-png-output architecture.drawnix.png --preview-pdf-output architecture.drawnix.pdf --ppi 300
node scripts/export-diagram-artifact.js --input circuit-spec.json --target circuitikz --output circuit.tex --preview-svg-output circuit.svg --preview-png-output circuit.png --preview-pdf-output circuit.pdf --ppi 300
node scripts/export-diagram-artifact.js --input spec.json --target svg --output figure.svg
node scripts/export-diagram-artifact.js --input spec.json --target png --output figure.png --ppi 300
node scripts/export-diagram-artifact.js --input spec.json --target pdf --output figure.pdf --ppi 300
```

仍可使用 package wrapper：

```bash
npm run diagram:export-artifact -- --input spec.json --target drawio --output figure.drawio
```

`--ppi` 默认值为 `300`，最大值会夹到 `600`。PNG 会写入 `pHYs` 密度 chunk。Windows 上的 npm 11 可能在 `npm run ... --` 之后重排长参数；需要无 warning 输出时使用直接 `node` 命令。

## Drawnix 路径

离线 CLI 接受已经带根节点的 `DiagramSpec(intent: "drawnixMindmap")`，并直接调用 `DrawnixRenderer`：

```text
DiagramSpec -> DrawnixMindMapProjection -> 原生 .drawnix
                                      -> notemd-drawnix-mindmap-svg@1.0.0 SVG
```

JSON 摘要中的 `rootCount`、`nodeCount` 与 `edgeCount` 对应实际写出的原生 board。离线 CLI 不解析 Markdown，也不执行 source coverage。要走正常的文件名根节点生成链路，应通过 maintainer bridge 调用已安装的插件：

```bash
node scripts/invoke-maintainer-cli-operation.js --vault 1Knowledge --operation diagram.generate --input-json '{"sourcePath":"architecture.zh-CN.md","executionMode":"save-artifact","requestedIntent":"drawnixMindmap","requestedRenderTarget":"drawnix","targetLanguage":"zh-CN"}' --pretty
```

该路径会把源路径传给 `mergeDrawnixSourceCoverage()`，生成 `architecture.zh-CN` 根节点，保留标题分支，并将未匹配的模型分支放入 `Additional concepts`。

已废弃的 `--drawnix-delivery` 与 `--source-label` 仍可被旧脚本解析，但不会选择布局或修改输出。新 artifact 不包含 replay metadata 或 presentation bundle。

## Targets

| Target | 输出 | Source model | CLI 校验 |
|---|---|---|---|
| `editable-html-svg` | 带 inline editable SVG 的自包含 HTML | `DiagramSpec -> SemanticFigureModel` | annotation gap 必须为空 |
| `drawio` | 未压缩 diagrams.net XML，可附带 SVG/PNG/PDF companion | `DiagramSpec -> SemanticFigureModel` | 可见 label 必须一致 |
| `drawnix` | 原生 `.drawnix`，可附带 SVG/PNG/PDF companion | `DiagramSpec(intent: "drawnixMindmap") -> DrawnixMindMapProjection` | 原生层级、`arrow-line` endpoint、标签边界与 source-visual metadata 必须通过校验 |
| `circuitikz` | 受约束 `.tex`，可附带 SVG/PNG/PDF companion | `DiagramSpec.circuitSpec` | 写入前必须通过电路规格校验 |
| `svg`、`png`、`pdf` | 来自 semantic model 或电路预览的审阅 artifact | `SemanticFigureModel` 或 circuit preview | 输出尺寸与 metadata 必须匹配 target |

Drawnix 路径有意绕过 `SemanticFigureModel`。它保留嵌套 `mindmap` 与 `mind_child`，跨分支关系使用原生 `arrow-line`。

## Obsidian 预览 Companion

Obsidian 默认不会把 `.drawio`、`.drawnix` 或 raw `.tex` 渲染成图形。插件保存路径会写出可审阅的 SVG companion 与 Markdown wrapper：

```text
Topic_diagram.drawnix
Topic_diagram.drawnix.svg
Topic_diagram.drawnix.md
```

wrapper 会嵌入 SVG 并链接 source artifact。Preview diagram 命令可直接重新打开这些本地 artifact，不必再次生成。

插件保存路径会沿用既有的 Mermaid 自定义输出目录。该设置开启时，图表 artifact 也会写到那里。若维护者需要让 `.drawnix`、SVG 和 wrapper 紧邻源笔记，应关闭该设置；遗留测试目录否则会看起来像源文件旁的写入失败。

## 基准与证据

`npm run benchmark:drawnix-knowledge-map` 会在被忽略的 `.cache/drawnix-knowledge-map-benchmark/` 下写入文件。fixture 使用一个 `architecture.zh-CN` 根节点、8 个 subsystem 分支、137 个节点和 32 条带 label 的跨分支关系。它是回归负载，不是运行时预算；结构计数与零校验错误才是契约。

修改该路径后运行：

```bash
npm test -- --runInBand src/tests/diagramArtifactExportCli.test.ts src/tests/drawnixKnowledgeMapBenchmark.test.ts src/tests/drawnixMindMapRenderer.test.ts src/tests/drawnixMindMapRouting.test.ts
```

artifact CLI 证明 deterministic export。用真实 Drawnix consumer 打开 `.drawnix` 文件属于另一份本地证据。标准 Mermaid `mindmap` target 保持独立。
