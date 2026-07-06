---
date: 2026-07-05
topic: circuitikz-figure-generation-roadmap
---

# circuitikz Figure Generation Roadmap

语言: [English](./circuitikz-figure-generation-roadmap.md) | **简体中文**

本文记录 Cloudy 风格 editable figure 工作和 Drawnix export spike 之后，电路图生成能力的扩展方向。

简短结论：电路图不应该以“LLM 任意写 TikZ”的方式进入 Notemd。更可靠的目标是强约束的 `CircuitSpec -> circuitikz` adapter，并配套 golden-reference templates、compile feedback 和 screenshot review。只有这个方向才可能稳定生成可读的 CMOS、模拟电路和数字电路教学图。

## 当前 Figure Stack

当前图表工作已经让 Notemd 脱离 renderer-specific prompt string：

| Area | Current state |
|---|---|
| Semantic input | 通用图表仍以 `DiagramSpec` 作为 model-facing boundary。 |
| Internal figure model | `SemanticFigureModel` 支撑 editable HTML/SVG、Draw.io XML 和 Drawnix JSON artifact export。 |
| Obsidian UI control | Developer settings 与侧边栏暴露 `preferredDiagramIntent` 和 `preferredDiagramRenderTarget`；artifact/preview 命令可以显式选择 Mermaid、JSON Canvas、Vega-Lite、HTML 或 editable HTML/SVG。 |
| CLI artifact export | `npm run diagram:export-artifact` 可在无 Obsidian runtime 的情况下导出 `editable-html-svg`、`drawio` 和 `drawnix`。 |
| Verification | 测试覆盖 semantic annotations、visible-label parity、stable IDs、Drawnix subset validity 和 CLI file output。 |

render-target override 有意只作用于 artifact 与 preview 命令。legacy Mermaid 命令继续固定为 Mermaid-compatible 输出；Draw.io 与 Drawnix 在插件 runtime 渲染和编辑契约被证明之前，仍保持为 CLI/export-boundary targets。

这套架构是电路图的正确先例：模型应该生成结构化意图，而不是直接生成最终语法；UI 应该在语义 spec 稳定之后再选择 renderer。

## circuitikz 为什么不同

在 Obsidian TikZJax 中，`circuitikz` 是电学电路更合适的语法族，尤其适用于 MOSFET、电阻、电源、地、测量点，以及模拟/数字电路教学图。

难点不是有没有语法。难点是在约束下保证布局质量：

- LLM 可能生成拓扑正确但视觉不可读的电路。
- 如果模型在后期临时发明 geometry，很容易误用 `M1.G`、`M1.D`、`M1.S` 等 anchor。
- 复杂电路需要 routing lanes，而不是临时拼接的 wire segments。
- TikZJax/LaTeX 失败通常是 compile-log failure，但可读性失败需要 rendered-image inspection。
- 一个能工作的简单例子不会自动泛化到更大的 CMOS block，除非 generator 明确拥有 placement 和 routing rules。

## 推荐架构

```text
source note / prompt
  -> CircuitSpec
  -> topology validation
  -> layout projection
  -> circuitikz template adapter
  -> TikZJax or LaTeX render
  -> compile-log + screenshot feedback
  -> constrained repair pass
```

### `CircuitSpec`

`CircuitSpec` 初期应当和 `DiagramSpec` 分开。不要过早扩展 `DiagramSpec`，除非两个以上非电路 target 也需要同一批字段。

最小有用结构：

| Field | Purpose |
|---|---|
| `circuitKind` | `cmos-inverter`、`common-source`、`logic-gate`、`rc-network` 等 |
| `nodes` | `VDD`、`GND`、`vin`、`vout`、`drain`、`source` 等具名电气 net |
| `components` | 带 id、terminal、label 和可选 model metadata 的 typed parts |
| `connections` | terminals/nets 之间的 topology edges |
| `layoutHints` | grid positions、orientation、input/output side、routing lanes |
| `style` | `american voltages`、label policy、电压/电流标注约定 |
| `goldenReferenceId` | 作为视觉与语法 baseline 的 template family |

### Golden Reference First

可靠电路生成必须先有 golden reference。它应定义：

- package preamble；
- coordinate scale；
- anchor style；
- component orientation；
- input/output side conventions；
- wire routing pattern；
- label placement rules。

例如 common-source amplifier reference 应保留这类可工作模式：

```latex
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[american voltages]
\draw
  (3,5) node[vcc]{$V_{DD}$}
  to [R, l=$R_D$] (3,3)
  to [short, *-o] (5,3) node[right]{$v_{out}$}
  (3,3) to [short] (3,2.2)
  node[nmos, anchor=D] (M1) {$M_1$}
  (M1.S) to [short] (3,0.5)
  node[ground]{}
  (M1.G) to [short, -o] (0.8,2.2)
  node[left]{$v_{in}$};
\draw
  (3,0.5) node[below right]{$S$};
\end{circuitikz}
\end{document}
```

CMOS inverter template 应进一步明确约束模型：

- `pmos` 在 `nmos` 上方；
- `VDD` 在上，`GND` 在下；
- common input gate 从左侧引入；
- common drain output 从右侧引出；
- 不使用 diagonal wires；
- 每个 transistor terminal 都使用 named anchors。

## Validation Strategy

不要把“能 compile”当成足够条件。

| Gate | What it catches |
|---|---|
| Spec validation | missing nets、disconnected terminals、impossible terminal references |
| Template validation | missing package preamble、invalid circuit kind、unsupported component |
| Compile-log parsing | LaTeX/TikZJax 语法与 package failure |
| Screenshot inspection | overlap、不可读 label、糟糕 routing、过多 whitespace |
| Golden-reference diff | 偏离已知良好的 orientation 和 routing conventions |

screenshot feedback 可以先保持人工执行。自动 screenshot 检查应从简单规则开始：nonblank render、bounded canvas、expected labels visible、无明显 label overlap boxes。

## Implementation Phases

| Phase | Scope | Exit criteria |
|---|---|---|
| A. Prompt/runbook | 记录强约束 circuit prompts 和 golden references | website 与 maintainer docs 说明 circuitikz 限制和使用方式 |
| B. `CircuitSpec` prototype | 为简单 MOS 电路添加 parser/types/tests | common-source 和 CMOS inverter specs 无需渲染即可 validate |
| C. circuitikz adapter | 为 golden templates 输出 deterministic LaTeX | generated LaTeX 匹配 stable snapshots，并包含 required anchors |
| D. render feedback | 增加可选的本地 TikZJax/LaTeX smoke path | compile failures 返回 actionable diagnostics |
| E. visual repair loop | 将 rendered image 或 overlap report 反馈给 repair prompt | 不改变拓扑的前提下修正重复 layout errors |

## 实现状态

Phase A 已经文档化。Phase B/C 现在有了受约束的仓库内原型：

- `src/diagram/adapters/circuitikz/circuitSpec.ts` 定义独立的 circuit-only spec 边界。
- `src/diagram/adapters/circuitikz/circuitikzExporter.ts` 会验证拓扑，并为 `common-source-amplifier` 与 `cmos-inverter` 输出确定性的 `circuitikz` LaTeX。
- `src/diagram/adapters/circuitikz/circuitikzExporter.ts` 现在还暴露 `createCircuitTopologySignature` 与 `assertCircuitTopologyUnchanged`，让 topology-preserving repair 可以拒绝电气拓扑漂移，同时允许 label 与 layout 变化。
- `scripts/export-circuitikz.js` 与 `npm run diagram:export-circuitikz` 提供离线导出命令，并通过 `--topology-reference` 支持 repair candidate。
- `src/diagram/adapters/circuitikz/circuitikzRepairBrief.ts` 与 `--repair-brief-output` 会生成 schema `notemd.circuitikz.repair-brief.v1`，作为 topology-preserving repair handoff，携带 source `CircuitSpec`、topology signature、compile/render diagnostics、允许修改项、禁止拓扑修改项和下一步验证步骤。
- `src/diagram/adapters/circuitikz/circuitikzDiagnostics.ts` 会把已有 LaTeX/TikZJax compile logs 解析为 actionable diagnostics，不 spawn 编译器，也不依赖 shell command resolution。
- `src/diagram/adapters/circuitikz/circuitikzCompileRunner.ts` 可以用 `shell: false`、placeholder-expanded arguments、生成 log diagnostics 和可选 `--expected-artifact` render-smoke checks 运行显式配置的本地 renderer。
- `src/diagram/adapters/circuitikz/circuitikzRenderSmoke.ts` 会检查预期 render artifact。PDF 和其他 opaque artifacts 检查存在与非空；SVG artifacts 还会检查 `<svg>` root、正的尺寸或 `viewBox`、可见绘图元素、可选重复传入的 `--expected-svg-text` tokens、用于 path-only labels 的 `render-svg-text-path-only` / `pathOnlyGlyphUseCount` 分类、通过解析 `<use href="#...">` 几何执行的 path-only glyph placement checks、通过 `render-svg-path-glyph-overlap` 执行的 path-only glyph overlap diagnostics、针对 A/a arc extrema 的 exact arc bounds、针对 C/S/Q/T curve extrema 的 exact Bezier curve bounds、stroke-width-aware SVG bounds 与 label overlap checks、`polyline` / `polygon` drawing geometry、positioned `tspan` label geometry、bounded-canvas/text-overlap diagnostics、通过 `render-svg-label-overlap` 报告的 label-vs-drawing overlap diagnostics，以及常见 group 与 element transforms 的 transform-aware geometry；PNG screenshot artifacts 会被解码并检查正尺寸、非背景像素、前景包围盒、`foregroundDensity`、通过 `render-png-content-clipped` 报告的贴边裁剪内容，以及通过 `render-png-foreground-dense` 报告的异常密集前景块。
- `src/rendering/diagnostics.ts` 会把 `RenderArtifact.diagnostics` 汇总为 error/warning/info 计数，`src/ui/DiagramPreviewModal.ts` 会在 artifact diagnostics panel 和 preview history entries 中使用同一份 summary。任意 render target 都可以把 diagnostics 挂到 `RenderArtifact.diagnostics`；preview UI 会显示 summary、severity、kind、message 和 advice，而不要求插件 runtime 内置 TikZJax 或 LaTeX。
- `src/tests/circuitikzExporter.test.ts`、`src/tests/circuitikzRepairBrief.test.ts`、`src/tests/circuitikzCompileDiagnostics.test.ts`、`src/tests/circuitikzRenderSmoke.test.ts`、`src/tests/circuitikzCompileRunner.test.ts` 与 `src/tests/circuitikzExportCli.test.ts` 验证确定性输出、拓扑拒绝、topology-preserving repair brief generation、package-script 暴露、UTF-8 BOM 处理、diagnostic parsing、shell-free compile execution、diagnostics JSON 输出、render artifact 存在/非空 smoke checks、SVG 结构检查、path-only SVG label classification、path-only glyph placement checks、path-only glyph overlap diagnostics、针对 A/a arc extrema 的 exact arc bounds、针对 C/S/Q/T curve extrema 的 exact Bezier curve bounds、stroke-width-aware SVG bounds 与 label overlap checks、`polyline` / `polygon` drawing geometry checks、positioned `tspan` label geometry checks、transform-aware SVG geometry checks、SVG label-vs-drawing overlap checks、PNG 空白截图检查、PNG 前景包围盒与前景密度报告、PNG 裁剪内容诊断、异常密集前景诊断，以及 compile log 或 smoke report 含错误时 CLI 非零退出。
- `src/tests/diagramPreviewModal.test.ts` 验证 artifact diagnostics 会显示在 diagram preview modal 中，并且 preview history 不会把 diagnostics 不同的条目错误去重。

Phase D 现在已经具备 log parsing、opt-in local renderer execution、artifact-level smoke checks、带 transform-aware geometry、path-only label classification、path-only glyph placement checks、path-only glyph overlap diagnostics、针对 A/a arc extrema 的 exact arc bounds、针对 C/S/Q/T curve extrema 的 exact Bezier curve bounds、stroke-width-aware SVG bounds 与 label overlap checks、`polyline` / `polygon` geometry coverage、positioned `tspan` label geometry、text/text 与 label/drawing overlap diagnostics 的 SVG structure smoke checks、第一层 PNG screenshot nonblank、edge-clipping 与 dense-foreground checks、topology-preserving repair guard、topology-preserving repair brief handoff，以及前端 diagnostics surface，但实现仍有意停在 required renderer availability、path-only glyph text 的 OCR recognition、精确 pixel-level overlap detection、完整 SVG path coverage 和自动化 Phase E repair execution 之前。它不会捆绑 LaTeX、不会把 TikZJax 变成插件 runtime 依赖，也不会运行视觉修复闭环。

SVG geometry smoke 也覆盖 leading-dot decimals 与 explicit plus signs 的 SVG number grammar。这是一个很小但关键的 renderer-compatibility gate，因为 dvisvgm 可能输出紧凑小数，bounds checks 中必须保留其小数语义。

## Best Current Practice

在 `CircuitSpec` 尚未存在前，使用强约束 prompt：

1. 提供一个可渲染 golden reference。
2. 请求具名 circuit family，而不是笼统说“draw circuit”。
3. 固定 orientation、anchors 和 input/output sides。
4. 在 LaTeX 前要求 topology checklist。
5. 渲染一次，然后用 screenshot 或 compile log 进行 repair pass。

这会优于不受约束的 ChatGPT/Gemini TikZ 生成，因为它把模型自由度限制在真正重要的部分：选择元件与拓扑，而不是从零发明每个坐标和 route。

## Risks

- 把 TikZJax 拉入插件 runtime 会形成对另一个 Obsidian 插件的硬依赖。集成应保持可选。
- 泛化的 “TikZ renderer” 范围过大。应先从 circuitikz 和少量 circuit families 开始。
- 没有 topology locking 的 visual feedback 可能通过改电路来修布局。repair prompt 必须把 topology 视为 invariant。
- circuitikz package 版本可能不同。golden references 必须记录预期 package behavior 和 renderer environment。
