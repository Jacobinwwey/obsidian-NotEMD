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
\documentclass[border=8pt]{standalone}
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[american voltages, line width=0.5pt, font=\small]
\draw
  (3,5) node[vcc]{$V_{DD}$}
  to [R, l=$R_D$] (3,3);
\draw
  (3,3) to [short, *-o] (5,3) node[right]{$v_{out}$};
\draw
  (3,3) to [short] (3,2.2)
  node[nmos, anchor=D] (M1) {$M_1$};
\draw
  (M1.S) to [short] (3,0.5)
  node[ground]{};
\draw
  (M1.G) to [short, -o] (0.8,2.2)
  node[left]{$v_{in}$};
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
| F. 桌面托管环境 | 安全发现本机编译器，并提供显式托管 Tectonic 安装 | UI 探测/安装/删除可用，golden fixtures 可编译，零依赖导出保持不变 |

## 实现状态

Phase A 已经文档化。Phase B/C 现在有了受约束的仓库内原型：

- `src/diagram/adapters/circuitikz/circuitSpec.ts` 定义独立的 circuit-only spec 边界。
- `src/diagram/adapters/circuitikz/circuitikzExporter.ts` 会验证拓扑，并为 `common-source-amplifier`、`cmos-inverter`、`cmos-buffer` / `cmos-buffer-v1`、`cmos-transmission-gate` / `cmos-transmission-gate-v1`、`cmos-nand2` / `cmos-nand2-v1` 和 `cmos-nor2` / `cmos-nor2-v1` 输出确定性的 `circuitikz` LaTeX。它现在会把 `layoutHints.inputSide` 与 `layoutHints.outputSide` 投影为这些 golden templates 的受约束 port placement，因此 layout-only repair candidates 可以移动输入/输出端口，而不改变拓扑。CMOS buffer template 会通过中间节点 `vmid` 锁定两个级联 inverter stages；CMOS transmission gate template 会锁定 `vin` 与 `vout` 之间的并联 PMOS/NMOS pass devices，并锁定互补 `phib` / `phi` controls；CMOS NAND template 会在导出前锁定并联 PMOS pull-up network、串联 NMOS pull-down stack 和双输入 nets `va` / `vb`；CMOS NOR template 会在导出前锁定互补的串联 PMOS pull-up stack 与并联 NMOS pull-down network。
- `src/diagram/adapters/circuitikz/circuitikzExporter.ts` 现在还暴露 `createCircuitTopologySignature` 与 `assertCircuitTopologyUnchanged`，让 topology-preserving repair 可以拒绝电气拓扑漂移，同时允许 label 与 layout 变化。
- `scripts/export-circuitikz.js` 与 `npm run diagram:export-circuitikz` 提供离线导出命令，并通过 `--topology-reference` 支持 repair candidate。
- `src/diagram/adapters/circuitikz/circuitikzRepairBrief.ts`、`--repair-brief-output` 与 `--repair-brief` 会生成并消费 schema `notemd.circuitikz.repair-brief.v1`，作为 topology-preserving repair handoff，携带 source `CircuitSpec`、topology signature、compile/render diagnostics、允许修改项、禁止拓扑修改项、下一步验证步骤和结构化 `repairPrompt`。prompt role 是 `topology-preserving-circuitikz-repair`；它包含从 diagnostics 派生的 `diagnosticFocus` 项，以及要求 candidate validation、重新 compile 和 render-smoke checks 的 `acceptanceCriteria`。candidate spec 可以在写出 output 前按 brief signature 执行校验，`--repair-brief` 现在还会返回 schema `notemd.circuitikz.repair-acceptance.v1` 的 `repairAcceptance` 证据，包含 `readyForVisualAcceptance`、gate-level status、blocking diagnostics 与 `remainingChecks`。`--repair-acceptance-output` 可以把同一份 evidence 持久化为 JSON 文件，供 CI 或 release 记录使用。
- `src/diagram/adapters/circuitikz/circuitikzDiagnostics.ts` 会把已有 LaTeX/TikZJax compile logs 解析为 actionable diagnostics，不 spawn 编译器，也不依赖 shell command resolution。
- `src/diagram/adapters/circuitikz/circuitikzCompileRunner.ts` 可以用 `shell: false`、placeholder-expanded arguments、针对空、缺失或无效 renderer command 的结构化 executable diagnostics、生成 log diagnostics 和可选 `--expected-artifact` render-smoke checks 运行显式配置的本地 renderer。
- `scripts/run-circuitikz-smoke-fixtures.js` 与 `npm run diagram:smoke-circuitikz` 现在也能在未配置 renderer 时生成显式 renderer availability evidence。missing-configuration 路径仍会导出确定性的 fixture `.tex` artifacts，返回 `ok: false`，并记录 `rendererAvailability.status: "missing-configuration"` 与 `compile-executable-invalid` diagnostic，而不是依赖平台 shell discovery 或静默跳过 smoke evidence。
- `src/diagram/adapters/circuitikz/circuitikzRenderSmoke.ts` 会检查预期 render artifact。PDF 和其他 opaque artifacts 检查存在与非空；SVG artifacts 还会检查 `<svg>` root、正的尺寸或 `viewBox`、排除 hidden/transparent elements 后的可见绘图元素、可选重复传入的 `--expected-svg-text` tokens、用于 path-only labels 的 `render-svg-text-path-only` / `pathOnlyGlyphUseCount` 分类、通过解析 `<use href="#...">` 几何执行的 path-only glyph placement checks、可复用 glyph path 上的 definition-local transforms、通过 `render-svg-path-glyph-overlap` 执行的 path-only glyph overlap diagnostics、针对 `Z/z` 后 relative commands 的 close-path current-point resets、针对 A/a arc extrema 的 exact arc bounds、针对 C/S/Q/T curve extrema 的 exact Bezier curve bounds、stroke-width-aware SVG bounds 与 label overlap checks、`polyline` / `polygon` drawing geometry、positioned `tspan` label geometry、bounded-canvas/text-overlap diagnostics、通过 `render-svg-label-overlap` 报告的 label-vs-drawing overlap diagnostics，以及常见 group 与 element transforms 的 transform-aware geometry；PNG screenshot artifacts 会被解码并检查正尺寸、非背景像素、1/2/4/8-bit indexed-color packed samples 与 PLTE/tRNS palette data、grayscale/RGB tRNS transparent samples、1/2/4/8/16-bit grayscale samples、8/16-bit grayscale-alpha/RGB/RGBA direct samples、前景包围盒、`foregroundDensity`、通过 `render-png-content-clipped` 报告的贴边裁剪内容、通过 `render-png-foreground-dense` 报告的异常密集前景块，以及针对 Adam7 interlaced PNG 与 unsupported indexed-color bit depths 的 format-specific `render-png-unsupported` guidance。
- SVG expected-text smoke 现在也会搜索从 `aria-label`、`<title>` 和 `<desc>` 解码出的 accessibility metadata。这可以在 renderer 保留 metadata 时证明语义 label identity，但仍不能替代后续 OCR/screenshot gate 来证明 path-only visual label 的可读性。
- SVG positioned text geometry 现在会读取 attribute 或 inline style 中的 `text-anchor` 值 `start`、`middle` 与 `end`，因此居中和右对齐的 LaTeX SVG 标签也能触发 text/text 与 label-vs-drawing overlap diagnostics。
- `<defs>` 内的 grouped 与 `symbol` path-only glyph definitions 现在会在 `<use>` placement 前被解析，因此被包裹的 glyph paths 仍会参与 `pathOnlyGlyphUseCount`、bounded-canvas checks 与 `render-svg-path-glyph-overlap`。
- `src/rendering/diagnostics.ts` 会把 `RenderArtifact.diagnostics` 汇总为 error/warning/info 计数，`src/ui/DiagramPreviewModal.ts` 会在 artifact diagnostics panel 和 preview history entries 中使用同一份 summary。任意 render target 都可以把 diagnostics 挂到 `RenderArtifact.diagnostics`；preview UI 会显示 summary、severity、kind、message 和 advice，而不要求插件 runtime 内置 TikZJax 或 LaTeX。
- `src/tests/circuitikzExporter.test.ts`、`src/tests/circuitikzRepairBrief.test.ts`、`src/tests/circuitikzCompileDiagnostics.test.ts`、`src/tests/circuitikzRenderSmoke.test.ts`、`src/tests/circuitikzCompileRunner.test.ts` 与 `src/tests/circuitikzExportCli.test.ts` 验证确定性输出、拓扑拒绝、topology-preserving repair brief generation 与 candidate validation、package-script 暴露、UTF-8 BOM 处理、diagnostic parsing、shell-free compile execution、结构化 `compile-executable-invalid` / `compile-executable-not-found` diagnostics、diagnostics JSON 输出、render artifact 存在/非空 smoke checks、SVG 结构检查、path-only SVG label classification、path-only glyph placement checks、definition-local glyph transform checks、path-only glyph overlap diagnostics、针对 A/a arc extrema 的 exact arc bounds、针对 C/S/Q/T curve extrema 的 exact Bezier curve bounds、stroke-width-aware SVG bounds 与 label overlap checks、`polyline` / `polygon` drawing geometry checks、positioned `tspan` label geometry checks、`text-anchor`-aware positioned text geometry checks、transform-aware SVG geometry checks、SVG label-vs-drawing overlap checks、PNG 空白截图检查、indexed-color 与 grayscale PNG packed sample decoding、indexed-color PNG palette decoding、grayscale/RGB PNG tRNS transparent sample handling、format-specific unsupported PNG diagnostics、16-bit direct PNG sample normalization、PNG 前景包围盒与前景密度报告、PNG 裁剪内容诊断、异常密集前景诊断，以及 compile log 或 smoke report 含错误时 CLI 非零退出。
- `src/tests/diagramPreviewModal.test.ts` 验证 artifact diagnostics 会显示在 diagram preview modal 中，并且 preview history 不会把 diagnostics 不同的条目错误去重。
- `src/latexEnvironment/` 与 `src/platform/desktopProcess.ts` 实现 Phase F，但不会把 TeX 发行版塞进插件包。桌面用户可以复用自定义/系统编译器，或显式安装固定版本 Tectonic `0.16.9`；下载经过 HTTPS 主机白名单、体积上限、SHA-256、路径穿越/链接防护，并在 staging 中编译六个确定性 fixture 后原子激活，取消和失败会清理临时状态并保留旧版本。
- `src/ui/CircuitikzEnvironmentModal.ts` 提供探测、安装/修复、取消、删除、能力摘要、进度与有限日志状态。桌面执行模块采用延迟加载；移动端继续保留零依赖预览和 SVG/PNG/预览 PDF 导出。
- 图形历史右侧抽屉现在显式建立 Grid 最小尺寸不变量 `min-height: 0`，由 body 负责 `overflow: auto` 并阻止 overscroll 传递，因此长历史可以完整滚动，不会带动底层预览。

Phase D 现在提供可操作的编译和产物诊断，包括 SVG 几何/遮挡与 PNG 非空、裁剪、密度检查。Phase E 已具备有次数上限且保持拓扑的执行闭环，并继续拒绝缺少新鲜 compile/render-smoke 证据的候选。Phase F 新增可选桌面环境发现与用户主动触发的托管安装，同时保持常规预览/导出零依赖。Notemd 仍不会把 TeX Live、MiKTeX、TinyTeX 或 Tectonic 压缩包嵌入 `main.js`。path-only glyph OCR、精确像素级遮挡、完整 SVG path 覆盖和浏览器级文字布局仍是后续证据增强项。

SVG geometry smoke 也覆盖 leading-dot decimals 与 explicit plus signs 的 SVG number grammar。这是一个很小但关键的 renderer-compatibility gate，因为 dvisvgm 可能输出紧凑小数，bounds checks 中必须保留其小数语义。

## Best Current Practice

对于已支持的电路族，使用结构化 `CircuitSpec` 链路：

1. 提供一个可渲染 golden reference。
2. 请求具名 circuit family，而不是笼统说“draw circuit”。
3. 固定 orientation、anchors 和 input/output sides。
4. 让确定性 adapter 负责 LaTeX，不要求模型直接编写 TikZ。
5. 本地 renderer 可用时，用 compile/render diagnostics 执行一次受保护的 repair attempt。

这会优于不受约束的 ChatGPT/Gemini TikZ 生成，因为它把模型自由度限制在真正重要的部分：选择元件与拓扑，而不是从零发明每个坐标和 route。

## Risks

- 把 TikZJax 拉入插件 runtime 会形成对另一个 Obsidian 插件的硬依赖。集成应保持可选。
- 泛化的 “TikZ renderer” 范围过大。应先从 circuitikz 和少量 circuit families 开始。
- 没有 topology locking 的 visual feedback 可能通过改电路来修布局。repair prompt 必须把 topology 视为 invariant。
- circuitikz package 版本可能不同。golden references 必须记录预期 package behavior 和 renderer environment。

## Phase E 执行边界

`src/diagram/adapters/circuitikz/circuitikzRepairLoop.ts` 现在提供可选启用的 Phase E 执行边界：构造专用修复 prompt，只接受一次 `CircuitSpec` JSON 候选，在导出前拒绝拓扑漂移，并用调用方提供的实际编译/渲染证据评估生成的 TeX；只有全部验收门通过才采用候选。渲染器不可用时不会调用模型。

common-source golden template 现在拆分为独立且正确终止的绘制路径，采用更轻的 `0.5pt` 线宽和较小正文字号，并移除冗余源极标签；在不改变电气拓扑的前提下消除早期的路径拥挤与标签遮挡。

Phase D 现在提供可操作的编译与产物诊断，包括 SVG 几何/遮挡以及 PNG 非空、裁剪和密度检查。Phase E 已具备有次数上限、拓扑保持的执行闭环，但启用仍是显式且依赖注入的：Notemd 不会捆绑 LaTeX，不会自动安装或发现渲染器，也不会在缺少新鲜编译与 render-smoke 证据时采用候选。path-only glyph OCR、精确像素级遮挡、完整 SVG path 覆盖和浏览器级文字布局仍是后续证据增强项。
