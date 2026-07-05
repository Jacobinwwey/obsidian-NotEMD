---
date: 2026-07-05
topic: diagram-artifact-export-cli
---

# Diagram Artifact Export CLI

## 契约

`scripts/export-diagram-artifact.js` 是图形扩展工作的离线 CLI 边界，覆盖 Cloudy 风格技术图参考与 Drawnix 参考 spike 产生的 artifact 导出需求。

它读取已验证结构的 `DiagramSpec` JSON 文件，并写出一个 artifact；不需要 Obsidian、`obsidian-cli`、diagrams.net Desktop、Drawnix、Plait 或浏览器运行时。

```bash
npm run diagram:export-artifact -- --input spec.json --target editable-html-svg --output figure.html
npm run diagram:export-artifact -- --input spec.json --target drawio --output figure.drawio
npm run diagram:export-artifact -- --input spec.json --target drawnix --output figure.drawnix
```

直接入口：

```bash
node scripts/export-diagram-artifact.js --input spec.json --target drawio --output figure.drawio
```

## Targets

| Target | 输出 | Source model | CLI 内验证 |
|---|---|---|---|
| `editable-html-svg` | 自包含 `.html`，包含 inline SVG | `DiagramSpec -> SemanticFigureModel -> EditableHtmlSvgRenderer` | `collectEditableSvgAnnotationGaps()` 必须为空 |
| `drawio` | 未压缩 diagrams.net `mxfile` XML | `DiagramSpec -> SemanticFigureModel -> exportSemanticFigureModelToDrawioXml()` | visible label mismatch 必须为空 |
| `drawnix` | 最小 `.drawnix` JSON subset | `DiagramSpec -> SemanticFigureModel -> exportSemanticFigureModelToDrawnixData()` | subset validation error 必须为空 |

## 为什么放在这个边界

这个 CLI 刻意采用 artifact-first：

- 它证明 figure exporters 能在 Obsidian UI 之外工作。
- 它避免把 Drawnix、Plait、diagrams.net Desktop 依赖带进插件 runtime。
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
- `drawnix` JSON 包含支持的 `geometry` 与 `arrow-line` element。
- 不支持的 target 会在写输出前失败。

## 非目标

这个 CLI 不运行完整 Drawnix Web App import，也不自动化 diagrams.net Desktop。这两者属于独立的本地视觉/import runbook。CLI 证明 deterministic artifact generation 与结构验证；它不证明每个编辑器 UI 行为。
