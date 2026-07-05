---
date: 2026-07-04
topic: diagram-reference-integration-and-figure-generation-plan
---

# 图形参考项目集成与 Figure 生成扩展方案

## 范围与证据

本文只回答一个窄问题：Notemd 是否可以参考 `cloudy-liu/cloudy-tech-diagrams-skill` 与 `plait-board/drawnix` 扩展 figure / diagram 生成能力；如果可以，这项工作应该进入现有架构的哪个边界。

本地已检查的参考基线：

| 参考项目 | 本地路径 | 基线 | 已读证据 |
|---|---|---|---|
| `cloudy-liu/cloudy-tech-diagrams-skill` | `ref/cloudy-tech-diagrams-skill` | `main@719a5be` | `SKILL.md`, `README*.md`, `assets/template.html`, `references/runtime-mechanism-mode.md`, Draw.io 导出测试 |
| `plait-board/drawnix` | `ref/drawnix` | `develop@9939f45` | `README_en.md`, `package.json`, `packages/drawnix/src/data/types.ts`, `packages/drawnix/src/data/json.ts`, `components/ttd-dialog/*-to-drawnix.tsx` |
| Notemd 当前 main | 仓库根目录 | `main@562074f` | `src/diagram/types.ts`, `src/rendering/rendererRegistry.ts`, `src/rendering/rendererService.ts`, roadmap 与 Drawnix 审计文档 |

结论是有条件的：扩展 figure 生成在技术上可行，但正确扩展不是“嵌入一个白板”，也不是“再加一个 Mermaid 转换器”。可持续路径是继续把 `DiagramSpec` 作为语义边界，然后为可编辑 HTML/SVG 以及后续 board export 增加明确的 target adapter。

## 当前 Notemd 架构位置

Notemd 已经拥有多数图形生成器缺少的关键部分：spec-first 语义层。`DiagramSpec` 捕获意图、标题、节点、边、分区、callout、数据序列、布局提示、语言与 evidence references。`RendererRegistry` 按 `RenderTarget` 解析 renderer，`RendererService` 负责 cache、in-flight dedupe、render-host delegation 与 preview session preparation。

当前 `RenderTarget` 取值为：

```ts
'mermaid' | 'json-canvas' | 'vega-lite' | 'html'
```

这点很关键。Cloudy 与 Drawnix 不应该被当成新的 prompt 风格。它们意味着新的 artifact target：

| 候选 target | 最佳解释 | 原因 |
|---|---|---|
| Cloudy 风格输出 | 可编辑技术 HTML/SVG 报告 target | 它是 browser-first SVG sheet，并带有语义化 Draw.io 导出元数据。 |
| Drawnix 输出 | 可选 `.drawnix` board export target | Drawnix 最干净的可复用边界是 `DrawnixExportedData`，不是它的 React host。 |
| Mermaid-to-Drawnix converter | 仅适合作为实验性桥接 | 它会把 `DiagramSpec` 降级回字符串语法，和 Notemd 当前方向冲突。 |

## 参考项目发现

### Cloudy Tech Diagrams

Cloudy 是一个 instruction-and-template system，用于生成自包含技术图：

- 浏览器产物：standalone HTML，内联 SVG 与 CSS。
- 视觉系统：暖色 editorial paper canvas、flat fills、semantic color roles、open chevron arrows、严格 spacing。
- 导出模型：Draw.io 导出是产品关键路径，基于语义 SVG 注解，例如 `data-drawio-type`、`data-drawio-role`、`data-drawio-id`、`data-drawio-source`、`data-drawio-target`。
- Runtime mechanism mode：要求抽取 trigger、participants、boundaries、carriers、transformations、state/stores、observable outputs 与 causal flow。
- 验证模型：结构化 Draw.io coverage、visible-label mismatch 检查、edge/style mapping 抽样、exporter versioning，以及可选 diagrams.net Desktop 视觉回归。

真正有价值的不是暖色配色本身，而是这条分层：

```text
semantic diagram intent -> annotated SVG sheet -> editable Draw.io-native export
```

这比把所有 explanatory diagram 都压进 Mermaid 更适合 Notemd。尤其是 architecture、runtime mechanism、security boundary、deployment、process views 这类图，SVG 布局与可编辑性通常比 Mermaid 语法兼容更重要。

### Drawnix

Drawnix 不是 renderer library。它是完整 React/Nx/Plait 白板产品：

- React 19 + Vite + Nx monorepo。
- Plait 栈：`@plait/core`、`@plait/draw`、`@plait/layouts`、`@plait/mind`、`@plait/text-plugins`。
- 浏览器产品假设：DOM、browser file APIs、local browser storage、toolbar/popover/dialog UI、mobile detection。
- 导出边界：`DrawnixExportedData` 是清晰 JSON：`type`、`version`、`source`、`elements`、`viewport`、`theme`。
- 转换 dialogs lazy-load `@plait-board/mermaid-to-drawnix` 与 `@plait-board/markdown-to-drawnix`，再把 `PlaitElement[]` 插入 live board。

可复用边界是数据形状与 layering pattern。完整 host 不适合进入 Obsidian plugin 主 bundle。转换器值得观察，但它们是 string-to-board bridge；不应成为 Notemd 主路径，因为它们会抹掉 `DiagramSpec` 的语义优势。

## 关键方向

最佳方向是两阶段扩展：

1. 先增加可编辑 HTML/SVG figure target。
2. 将 Drawnix 视为后续 board-export adapter，而不是 host embed。

这是有意保守的。figure generation 的难点不是生成更多语法字符串，而是在不让 plugin bundle 爆炸的前提下，拥有 layout、editability、validation 与 export fidelity。

## 建议架构

### 阶段 1：可编辑 HTML/SVG Figure Target

新增一个 target，输出带 annotated SVG sheet 的自包含 HTML artifact：

```text
DiagramSpec
  -> SemanticFigureModel
  -> AnnotatedSvgSheet
  -> EditableHtmlSvgArtifact
```

候选代码归属：

| 区域 | 建议 owner |
|---|---|
| 从 `DiagramSpec` 做语义投影 | `src/diagram/adapters/editableSvg/` |
| Template assembly 与 export UI | `src/rendering/renderers/editableHtmlSvgRenderer.ts` |
| Draw.io 注解校验 | `src/rendering/drawio/` 或 renderer-local validator |
| Artifact save / preview integration | 复用现有 diagram command execution 与 renderer service 路径 |

不要盲目复制 Cloudy 的整套 template。如果复制代码，必须保留 MIT attribution，并把 exporter block 隔离出来，让 version drift 可测试。更推荐抽取 contract，写 Notemd 自己拥有的 renderer，并沿用同类语义。

最小可交付产物：

- `.html` source artifact 保存到配置的 diagram output folder。
- 通过现有 HTML/iframe preview path 进行浏览器预览。
- 只有在 semantic export audit 通过后，才提供页内 PNG 与 Draw.io export actions。
- 在 export fidelity 证明之前，不默认生成 `.drawio` 文件。

### 阶段 2：Draw.io Export Contract

在承诺 Draw.io 是支持输出前，必须锁定这些检查：

- 每个有意义的可见 SVG 元素都有注解，或带原因显式 ignored。
- 可见 SVG text 不能被 `data-drawio-label` 静默覆盖。
- Open arrowheads、dashed strokes、fill/stroke、rounded corners、font size、font weight 能映射到可编辑 Draw.io cells。
- Exporter version 嵌入并被测试覆盖。
- 可选视觉回归应为 manual/release-gated，不应进入常规 CI，因为 diagrams.net / font rendering 受环境影响明显。

这里应比普通 HTML preview tests 更严格。否则功能会退化为“HTML 看起来不错，但可编辑导出不可靠”，这正是 Cloudy 在解决的问题。

### 阶段 3：Drawnix Export Target

只有阶段 1 稳定后，才增加实验性 `.drawnix` export target：

```text
DiagramSpec
  -> PlaitElementProjection
  -> DrawnixExportedData
  -> .drawnix JSON artifact
```

规则：

- 不在 Notemd 中嵌入 Drawnix React host。
- 不把 `DiagramSpec -> Mermaid -> mermaid-to-drawnix` 做成 mainline path。
- 先做小子集：mindmap、flowchart、simple architecture node/edge diagrams。
- 显式拥有 geometry generation：points、bounding boxes、viewport defaults、text wrapping、theme mapping。
- 在 heavy-runtime packaging boundary 真正成立前，不把依赖带进 `main.js`。普通 JSON writer 优先于引入 Plait runtime。

## 实施计划

### Phase A：Contract-Only Planning

- [x] 将 `cloudy-tech-diagrams-skill` clone / update 到 `ref/cloudy-tech-diagrams-skill`。
- [x] 将 `drawnix` clone / update 到 `ref/drawnix`。
- [x] 记录参考项目基线与当前 Notemd 架构适配关系。
- [x] 增加 tracked renderer contract test，保证这份方案可以从 docs hub 找到。

### Phase B：Editable HTML/SVG Prototype

- [x] 将 `SemanticFigureModel` 定义为内部 renderer model，而不是 public prompt contract。
- [x] 命名评审后新增 `editable-html-svg` target，避免与现有 `html` 含义冲突。
- [x] 基于现有 `DiagramSpec` 字段，实现 architecture / process / runtime-mechanism views 的第一版 renderer。
- [x] 增加参考 Cloudy `data-drawio-type` contract 的 annotation coverage tests。
- [x] 增加 Playwright preview checks，覆盖 nonblank render、text bounds、mobile/desktop framing。
- [x] 在 preview/export 质量被证明前，把能力放在现有 experimental diagram pipeline 后面。

Phase B 于 2026-07-05 的实现状态：`editable-html-svg` 现在是显式 render target，不是默认 planner route。原型使用 `src/diagram/adapters/editableSvg/semanticFigureModel.ts` 作为内部 renderer model，使用 `src/rendering/renderers/editableHtmlSvgRenderer.ts` 输出自包含 HTML/SVG。annotation coverage、iframe preview pass-through、源产物 `.html` 导出、desktop/mobile Playwright preview checks 已由 `src/tests/editableHtmlSvgRenderer.test.ts`、`src/tests/editableHtmlSvgPreview.playwright.test.ts`、`src/tests/diagramPreview.test.ts`、`src/tests/previewExport.test.ts` 与 semantic-verification helper tests 覆盖。

### Phase C：Draw.io Export Hardening

- [x] 增加 deterministic exporter block 或 library boundary。
- [x] 增加 visible-label mismatch tests。
- [x] 增加 edge/style mapping 抽样测试。
- [x] 增加 local-only visual regression runbook；不要让 diagrams.net Desktop 成为普通 CI 依赖。
- [x] 文档化 exporter limitations 与 supported primitives。

Phase C 于 2026-07-05 的实现状态：draw.io export hardening 以 `src/diagram/adapters/drawio/drawioExporter.ts` 落地，消费内部 `SemanticFigureModel` 并生成 deterministic uncompressed draw.io XML。`src/tests/drawioExporter.test.ts` 覆盖 XML structure、visible-label mismatch detection 与节点/边 style mapping 抽样。`docs/maintainer/drawio-export-visual-regression.md` 与 `docs/maintainer/drawio-export-visual-regression.zh-CN.md` 定义 local-only diagrams.net Desktop visual check、supported primitives 与 unsupported scope；`src/tests/drawioExportDocsContract.test.ts` 用来防止双语 runbook 边界漂移。

### Phase D：Drawnix Board Export Spike

- [x] 定义支持的 `DrawnixExportedData` 子集。
- [x] 在不导入完整 Drawnix host 的前提下实现 `DiagramSpec -> DrawnixExportedData`。
- [x] 验证 `.drawnix` JSON validity；将简单 open/import 行为记录为本地 Drawnix manual-evidence boundary。
- [x] 只有当 Task 0 packaging isolation 不再是 candidate-only 后，才判断 Plait dependency 是否值得承担 bundle 成本。

Phase D 于 2026-07-05 的实现状态：Drawnix spike 以 `src/diagram/adapters/drawnix/drawnixExporter.ts` 落地。它导出最小 `DrawnixExportedData` subset，使用顶层 `type/version/source/elements/viewport/theme`、`geometry` rectangle nodes 与 `arrow-line` edges，不导入 Drawnix、Plait 或 Plait Board packages。`src/tests/drawnixExporter.test.ts` 覆盖 JSON validity、稳定 `.drawnix` serialization、unsupported subset rejection，以及无运行时依赖的源码契约。`docs/maintainer/drawnix-export-spike.md` 与 `docs/maintainer/drawnix-export-spike.zh-CN.md` 记录通过 Drawnix 进行 manual open/import 的证据边界，以及在 bundle isolation 与 release packaging 未被证明超过 candidate-only 前不引入 Plait runtime dependency 的当前决策。

### Phase E：Offline Artifact Export CLI

- [x] 增加 repo-local CLI，从同一份 `DiagramSpec` 导出 Cloudy 风格 editable HTML/SVG、Draw.io XML 与 Drawnix JSON。
- [x] CLI 不依赖 Obsidian runtime 或 `obsidian-cli`，让 CI 与本地自动化可以直接验证 exporters。
- [x] 复用现有 TypeScript `SemanticFigureModel`、`EditableHtmlSvgRenderer`、Draw.io exporter 与 Drawnix exporter，不维护第二份 JavaScript 逻辑。
- [x] 增加 CLI contract tests，验证真实文件落盘，并确保 unsupported target 在创建输出前失败。
- [x] 增加双语 maintainer runbook 与 docs hub 入口。

Phase E 于 2026-07-05 的实现状态：`scripts/export-diagram-artifact.js` 与 `npm run diagram:export-artifact` 已提供离线 artifact exporter。CLI 读取 `DiagramSpec` JSON 文件，先验证 target，再用临时内部 `esbuild` bundle 复用现有 TypeScript exporters，写出 `editable-html-svg`、`drawio` 或 `drawnix` 输出。`src/tests/diagramArtifactExportCli.test.ts` 验证真实 HTML/XML/JSON 输出、normalized id collision handling、Draw.io visible-label preservation、Drawnix `geometry`/`arrow-line` 输出，以及 unsupported-target failure semantics。`docs/maintainer/diagram-artifact-export-cli.md` 与 `docs/maintainer/diagram-artifact-export-cli.zh-CN.md` 记录命令契约，并明确 no Obsidian runtime is required。

### Phase F：受约束 circuitikz 原型

- [x] 在 circuit-specific topology/layout 字段证明可复用前，不把电路图塞进 `DiagramSpec`。
- [x] 定义最小 `CircuitSpec`，包含 `circuitKind`、命名 nets、typed components、terminal references、layout hints、style 和 `goldenReferenceId`。
- [x] 为 `common-source-amplifier` 与 `cmos-inverter` 增加 deterministic golden-template export。
- [x] 增加离线 CLI，在不依赖 Obsidian、TikZJax、LaTeX 或 browser runtime 的情况下写出 `.tex`。
- [x] 增加 topology-rejection tests，确保无效电路在创建输出前失败。
- [x] 增加双语 maintainer docs 与 website progress notes。
- [x] 增加 compile-log diagnostics，在不 shell out 到编译器的情况下解析已有 LaTeX/TikZJax logs。
- [x] 增加可选 shell-free local renderer execution，使用 placeholder-expanded argument arrays。
- [x] 增加可选 render-smoke artifact 存在与非空检查，通过 `--expected-artifact` 启用。
- [x] 增加 SVG render-smoke 结构检查，并通过重复的 `--expected-svg-text` 执行可选 label-token 检查。
- [x] 增加 PNG screenshot smoke 检查，覆盖正尺寸、非背景像素、前景包围盒与贴边裁剪内容。
- [x] 通过 `foregroundDensity` 与 `render-png-foreground-dense` 增加第一层 pixel-level PNG crowding smoke。
- [x] 增加保守的 SVG bounded-canvas 与明显 text-overlap diagnostics。
- [x] 在 bounded-canvas/text-overlap 检查前，对常见 SVG group 与 element transforms 增加 transform-aware geometry。
- [x] 通过 `render-svg-label-overlap` 增加保守的 SVG label-vs-drawing overlap diagnostics。
- [x] 通过 `pathOnlyGlyphUseCount` 与 `render-svg-text-path-only` 增加 path-only SVG label classification。
- [x] 通过解析 `<use href="#...">` boxes 增加 path-only glyph placement checks，用于 bounded-canvas diagnostics。
- [x] 在 diagram preview modal 中增加前端 artifact diagnostics surface。
- [x] 为非 inline artifact 增加 source-only preview fallback，让未来 circuitikz、Draw.io 与 Drawnix source 可以展示内容和诊断，而不是伪装成已经完成视觉渲染。
- [x] 为两个已支持的 circuitikz golden families 增加 maintainer smoke fixtures 和聚合 runner。
- [x] 通过 `--topology-reference`、`createCircuitTopologySignature` 和 `assertCircuitTopologyUnchanged` 增加 topology-preserving repair guard。
- [x] 增加可复用的 `RenderArtifact.diagnostics` summary counts，并在 preview diagnostics panel 与 preview history entries 中显示。

Phase F 于 2026-07-05 的实现状态：`src/diagram/adapters/circuitikz/circuitSpec.ts` 与 `src/diagram/adapters/circuitikz/circuitikzExporter.ts` 已实现受约束的 `CircuitSpec -> circuitikz` 原型。`scripts/export-circuitikz.js` 与 `npm run diagram:export-circuitikz` 可以为 `common-source-nmos-v1` 和 `cmos-inverter-v1` 导出确定性 LaTeX。`src/diagram/adapters/circuitikz/circuitikzExporter.ts` 还暴露 `createCircuitTopologySignature` 与 `assertCircuitTopologyUnchanged`，`scripts/export-circuitikz.js` 通过 `--topology-reference` 暴露这个 guard，让 topology-preserving repair candidate 可以改 labels/layout，但如果新增、删除或重连电气拓扑，会在写出 output 前被拒绝。`src/diagram/adapters/circuitikz/circuitikzDiagnostics.ts` 会把已有 compile logs 解析为 actionable diagnostics，覆盖 missing packages、unknown TikZ keys、undefined control sequences、generic LaTeX errors、emergency stops 和 overfull layout warnings。`src/diagram/adapters/circuitikz/circuitikzCompileRunner.ts` 可以在不经过 shell parsing 的情况下运行显式配置的本地 renderer，把生成的 `{jobName}.log` 接回 diagnostics，并通过 `--expected-artifact` 可选要求产出具体的非空 output artifact。`src/diagram/adapters/circuitikz/circuitikzRenderSmoke.ts` 现在会对 SVG 做 root、dimensions、visible drawing elements 检查，通过 `--expected-svg-text` 执行可选文本 token 检查，通过 `pathOnlyGlyphUseCount` 和 `render-svg-text-path-only` 执行 path-only label classification，通过 `render-svg-out-of-bounds` 执行保守 bounded-canvas diagnostics，通过 `render-svg-text-overlap` 执行明显 text-overlap diagnostics，并对常见 group 与 element transforms 执行 transform-aware geometry，同时对 PNG screenshot 做尺寸、非背景像素、`foregroundBounds`、`foregroundDensity`、通过 `render-png-content-clipped` 报告的贴边裁剪内容，以及通过 `render-png-foreground-dense` 报告的异常密集前景块检查。`docs/maintainer/fixtures/circuitikz/` 现在保存两个 golden-family `CircuitSpec` fixtures，`scripts/run-circuitikz-smoke-fixtures.js` / `npm run diagram:smoke-circuitikz` 会用同一套显式 shell-free renderer 配置跑完这些 fixtures，并返回每个 fixture 的聚合证据。`src/rendering/diagnostics.ts` 现在会把 `RenderArtifact.diagnostics` 汇总为 error/warning/info 计数，`src/ui/DiagramPreviewModal.ts` 会在通用 diagnostics、diagnostics-aware preview history entries 与非 inline artifact 的 source-only fallback 中显示这些 summary counts，让 circuitikz smoke、未来 renderer checks、repair hints 和外部渲染器源码都有用户可见的前端入口，同时不把 TikZJax/LaTeX 强行塞进插件 runtime，也不假装已经完成视觉渲染。`src/tests/circuitikzExporter.test.ts`、`src/tests/circuitikzCompileDiagnostics.test.ts`、`src/tests/circuitikzRenderSmoke.test.ts`、`src/tests/circuitikzCompileRunner.test.ts`、`src/tests/circuitikzExportCli.test.ts`、`src/tests/circuitikzSmokeFixturesCli.test.ts`、`src/tests/diagramPreview.test.ts`、`src/tests/diagramPreviewModal.test.ts` 与 `src/tests/renderArtifactDiagnostics.test.ts` 验证确定性输出、拓扑拒绝、topology-preserving repair guard 行为、package-script 暴露、UTF-8 BOM 输入处理、shell-free compile execution、render-smoke artifact checks、SVG smoke diagnostics、path-only SVG label classification、transform-aware SVG geometry、PNG 空白截图 diagnostics、PNG 前景包围盒与前景密度报告、PNG 裁剪内容诊断、异常密集前景诊断、bounded SVG viewBox checks、明显 SVG text-overlap checks、maintainer fixture discovery 和聚合执行、preview diagnostics 可见性、diagnostic summary counts、source-only preview fallback、diagnostics-aware history entries、diagnostics JSON 输出，以及 compile log 或 smoke report 含错误时 CLI 非零退出。实现仍有意停在 path-only glyph text 的 OCR recognition、更精确 pixel-level overlap detection 和 automated visual repair loops 之前。

## 权衡

| 决策 | 收益 | 成本 |
|---|---|---|
| HTML/SVG target 先于 Drawnix | 最快获得更丰富 figure 与可编辑导出路径 | 必须自己拥有 SVG layout 与 text fitting |
| Drawnix 仅作为 export target | 避免完整白板 host 复杂度 | 不提供插件内 board editing |
| 保持 `DiagramSpec` 为主边界 | 保留语义质量与可测试性 | 需要编写 target adapters，不能盲目复用 converters |
| 为 circuitikz 单独使用 `CircuitSpec` | 让 terminal/topology 规则保持显式且可测试 | 在公共字段证明可复用前需要维护第二个 spec 边界 |
| manual/release visual gate | 避免 diagrams.net/font 差异导致 flaky CI | release 前维护者需要跑更重的检查 |

## 需要避免的坑

- 不要让 “supports Drawnix” 变成 “bundles Drawnix”。那是 host 归属错误，不是 renderer 改进。
- 不要为了复用 converter，把生产 `DiagramSpec` 绕回 Mermaid text。那会重新引入旧的 string-surgery failure mode。
- 不要在没有 structural coverage tests 的情况下承诺 Draw.io editability。漂亮的 SVG 下载不是可编辑 Draw.io continuation path。
- 不要在 Obsidian preview 里把 Google Fonts 做成硬运行时依赖。使用 system fallback，外部 font loading 保持可选。
- 不要在 packaging isolation 成立前，把重型导出代码放进 `main.js`。
- 不要过早扩宽 `DiagramSpec`。先使用内部 `SemanticFigureModel`；只有两个以上 target 都需要同一字段时，再提升为公共字段。
- 不要把 `diagram:export-circuitikz` 当成视觉渲染证明。它证明的是 topology-constrained LaTeX export，不是 TikZJax compilation 或 screenshot quality。

## 最佳实践边界

正确心智模型是：

```text
LLM output remains semantic.
Adapters own target-specific geometry.
Renderers own host/export behavior.
Operations own artifact save and user workflow.
Verification owns claims.
```

Cloudy 的价值在于证明严格的 HTML/SVG + Draw.io export contract 可以成立。Drawnix 的价值在于证明 board data boundary 足够清晰，未来可以作为 target。二者都不应覆盖 Notemd 当前架构方向。

## 建议的下一步

HTML/SVG、Draw.io、Drawnix 和第一个 circuitikz export 边界现在都已经存在。下一步仍然不应默认增加 runtime dependencies：

1. 随真实 renderer logs 暴露更多 failure shapes，继续扩展 compile-log diagnostics；
2. 增加超过结构化 SVG 坐标的 screenshot/OCR-level 检查，包括 path-only glyph text 的 OCR recognition，以及比当前 foreground-density 与 label-vs-drawing box heuristics 更精确的 pixel-level overlap；
3. repair prompt 中锁定拓扑，避免视觉修复改变电路；
4. 只有在 renderer evidence 可用之后，才把 source-only preview session 接到外部 artifact outputs，继续区分 raw source 与真实视觉渲染状态；
5. 只有到这一步之后，再考虑更多 circuit families 或插件侧 circuit preview target。

Drawnix 仍然是好的导出格式，不是把白板产品嵌入插件的理由。circuitikz 仍然是受约束 circuit target，不是接受 LLM 任意 TikZ 输出的理由。
