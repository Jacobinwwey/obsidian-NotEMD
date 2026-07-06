---
date: 2026-07-05
topic: circuitikz-export-prototype
---

# circuitikz 导出原型

语言: [English](./circuitikz-export-prototype.md) | **简体中文**

## 契约

`scripts/export-circuitikz.js` 是第一个强约束电路图原型的离线导出边界。

它接收经过校验的 `CircuitSpec` JSON 文件，并写出确定性的 `circuitikz` LaTeX；不需要 Obsidian、TikZJax、LaTeX 安装或浏览器 runtime：

```bash
npm run diagram:export-circuitikz -- --input cmos-inverter.json --output cmos-inverter.tex
```

直接入口：

```bash
node scripts/export-circuitikz.js --input common-source.json --output common-source.tex
```

输入可以是带 BOM 或不带 BOM 的 UTF-8，因此 Windows PowerShell 写出的 JSON 不需要额外归一化。

## Topology-Preserving Repair Guard

视觉修复可以改 label、title text、layout hints 和 routing coordinates，但不能改变电气拓扑。exporter 现在通过 `--topology-reference` 暴露 repair guard：

```bash
node scripts/export-circuitikz.js \
  --input repaired-cmos-inverter.json \
  --topology-reference cmos-inverter.json \
  --output cmos-inverter.tex
```

guard 会在写出任何 `.tex` output 前比较 canonical topology signatures。signature 由 `createCircuitTopologySignature` 生成，包含 `circuitKind`、`goldenReferenceId`、规范化 nets、component ids/types/terminals，以及无向 connection endpoints。它有意忽略 labels、title text、layout hints、connection ordering 和 connection labels，这样 repair pass 可以改善可读性，而不会被非电气改动阻塞。

`assertCircuitTopologyUnchanged` 会拒绝 topology signature 与 reference 不同的 candidate spec。这能捕获新增短路、删除端子连接、改变晶体管类型、把 component terminal 移到不同 net 等 repair drift，即使 template 的最小 family validation 仍然通过。CLI 会报告 `Circuit topology drift detected`，并且不会写出 output file。

当 compile 或 render diagnostics 指向视觉失败时，同一个 topology reference 也可以生成受约束的 repair brief：

```bash
node scripts/export-circuitikz.js \
  --input cmos-inverter.json \
  --topology-reference cmos-inverter.json \
  --output cmos-inverter.tex \
  --compile-log cmos-inverter.log \
  --repair-brief-output cmos-inverter.repair-brief.json
```

repair brief 使用 schema `notemd.circuitikz.repair-brief.v1`。它会记录 topology signature、source `CircuitSpec`、compile/render diagnostics、允许修改的 labels 和 layout hints，以及禁止修改的 `circuitKind`、`goldenReferenceId`、nets、component ids、component types、terminals 和 connections。它还会内嵌结构化 `repairPrompt`，role 为 `topology-preserving-circuitikz-repair`，包含从 compile/render diagnostics 派生的 `diagnosticFocus` 列表，以及要求 candidate validation、重新 compile 和 render-smoke checks 的 `acceptanceCriteria`。这是后续 topology-preserving repair loop 的 handoff format；它还不是自动视觉修复引擎。

修复后的 candidate 可以再直接对 brief 做校验，不必携带原始 reference spec：

```bash
node scripts/export-circuitikz.js \
  --input repaired-cmos-inverter.json \
  --repair-brief cmos-inverter.repair-brief.json \
  --output repaired-cmos-inverter.tex
```

`--repair-brief` 会在写出 output 前，把 candidate 的 canonical topology signature 与 brief 中的 signature 比较。它与 `--topology-reference` 互斥，避免一次运行中出现两个 topology truth source。通过这个 gate 只能证明拓扑未变；candidate 仍必须重新渲染，并通过 compile diagnostics 与 render-smoke gates 后才能被视觉接受。

使用 `--repair-brief` 时，CLI result 现在还会包含 schema 为 `notemd.circuitikz.repair-acceptance.v1` 的 `repairAcceptance`。这个 report 会把 `topology-signature`、`compile-diagnostics` 和 `render-smoke` gates 标记为 `passed`、`failed` 或 `missing`，暴露 `blockingDiagnostics`，并列出 `remainingChecks`。只有当同一次 candidate run 中 topology、compile diagnostics 与 render-smoke 全部通过时，`readyForVisualAcceptance` 才会是 `true`；只通过拓扑校验的 candidate 会被明确标记为尚未达到视觉验收条件。

如果需要为 CI 或 release 记录持久化这份 gate evidence，可以增加 `--repair-acceptance-output`：

```bash
node scripts/export-circuitikz.js \
  --input repaired-cmos-inverter.json \
  --repair-brief cmos-inverter.repair-brief.json \
  --output repaired-cmos-inverter.tex \
  --repair-acceptance-output repaired-cmos-inverter.repair-acceptance.json
```

`--repair-acceptance-output` 要求同时提供 `--repair-brief`。它只写出 acceptance evidence JSON，不改变 repair 行为，也不能替代 compile/render-smoke verification。

## Compile-Log 诊断

exporter 也可以解析已有的 LaTeX/TikZJax compile log，并在不执行本地编译器的情况下返回 machine-readable diagnostics：

```bash
node scripts/export-circuitikz.js \
  --input cmos-inverter.json \
  --output cmos-inverter.tex \
  --compile-log cmos-inverter.log \
  --diagnostics-output cmos-inverter.diagnostics.json
```

这条路径有意保持为 log-driven。它不会解析 shell command、不会 spawn `pdflatex`，也不要求 TikZJax 成为插件 runtime 依赖。如果 log 中包含 compile errors，CLI 仍会写出确定性的 `.tex` artifact，在需要时写出 diagnostics，把诊断摘要打印到 stderr，并以非零状态退出，让 automation 在 screenshot 或 visual repair gate 前停住。

当前诊断覆盖：

- `circuitikz.sty` 这类缺失 LaTeX package；
- 拼错 component name 等 unknown TikZ/circuitikz keys；
- undefined control sequences；
- generic LaTeX errors 与 emergency stops；
- 留给后续视觉审查的 advisory overfull `\hbox` warnings。

parser 位于 `src/diagram/adapters/circuitikz/circuitikzDiagnostics.ts`，这样 diagnostic rules 可以脱离 CLI wrapper 进行测试。

## 可选本地 Compile Execution

CLI 可以在写出 `.tex` 后可选运行一个本地 renderer command：

```bash
node scripts/export-circuitikz.js \
  --input cmos-inverter.json \
  --output cmos-inverter.tex \
  --compile-executable pdflatex \
  --compile-arg -interaction=nonstopmode \
  --compile-arg -halt-on-error \
  --compile-arg -output-directory={outputDir} \
  --compile-arg {tex} \
  --expected-artifact {outputDir}/{jobName}.pdf \
  --diagnostics-output cmos-inverter.diagnostics.json
```

这条路径使用直接进程执行和参数数组（`shell: false`），不会拼接 shell command，因此 Windows、Linux 与 macOS 都能避开 shell-specific quoting 和 resolution 差异。`--compile-executable` 必须只传 renderer binary 或 wrapper 路径；每个 flag 都应通过重复的 `--compile-arg` 传入。空 executable 会以 `compile-executable-invalid` 失败，找不到 binary 会以 `compile-executable-not-found` 失败，像 `pdflatex -halt-on-error` 这种 shell-command-shaped executable 会得到拆分参数而不是依赖平台 shell parsing 的建议。支持的 placeholder 是：

| Placeholder | Value |
|---|---|
| `{tex}` | 生成的 `.tex` 文件绝对路径 |
| `{outputDir}` | 生成 artifact 的绝对输出目录 |
| `{jobName}` | 生成 `.tex` 文件去掉扩展名后的 basename |

提供 `--expected-artifact` 时，runner 还会执行 render-smoke artifact 检查。对于 PDF 这类 opaque artifact，它会确认预期文件存在且非空。对于 `.svg` artifact，它还会检查 `<svg>` root、正的尺寸或 `viewBox`、至少一个可见绘图元素、重复传入的 `--expected-svg-text` tokens、明显跑出 `viewBox` 的元素，以及明显重叠的 `<text>` labels。通过 attribute 或 inline-style 设置 `display:none`、`visibility:hidden`、`visibility:collapse` 或整体 `opacity:0` 的 SVG elements 不会被计为可见输出。SVG geometry pass 现在具备 transform-aware geometry，会对常见 group 与 element `transform` 属性做组合后再检查 translated、scaled、rotated、skewed 和 matrix-transformed boxes。如果 expected text 不可搜索且 SVG 使用可复用 path glyphs，report 会记录 `pathOnlyGlyphUseCount`，并发出 `render-svg-text-path-only`，让 automation 可以把 artifact 交给后续 screenshot/OCR gate：

```bash
node scripts/export-circuitikz.js \
  --input cmos-inverter.json \
  --output cmos-inverter.tex \
  --compile-executable dvisvgm \
  --compile-arg ... \
  --expected-artifact {outputDir}/{jobName}.svg \
  --expected-svg-text v_{in} \
  --expected-svg-text v_{out}
```

对于 `.png` screenshot artifact，smoke check 会解码非交错的 1/2/4/8-bit indexed-color PNG 输出、1/2/4/8/16-bit grayscale PNG 输出，以及 8/16-bit RGB、grayscale-alpha 或 RGBA PNG 输出。indexed-color 与 sub-byte grayscale 图像支持 packed samples；indexed-color 图像还支持 PLTE palette entries 与可选 tRNS alpha；grayscale/RGB 图像支持 tRNS transparent samples。16-bit direct samples 会被归一化到 smoke check 使用的同一个 8-bit RGBA 比较空间。它会检查正的尺寸，把前景像素包围盒记录为 `foregroundBounds`，把包围盒内前景密度记录为 `foregroundDensity`，并要求至少一个不同于左上角背景色的像素。空白截图会以 `render-png-blank` 失败；前景内容贴到图像边界会以 `render-png-content-clipped` 失败；非平凡包围盒内前景像素异常密集会以 `render-png-foreground-dense` 失败；格式损坏的 PNG 会以 `render-png-invalid` 失败；不支持的 PNG 会以 `render-png-unsupported` 失败，并针对 Adam7 interlaced PNG 与 unsupported indexed-color bit depths 给出 format-specific guidance。

检查结果会记录为 `compileExecution.renderSmoke`。缺失或空 artifact 会追加 `render-artifact-missing` 或 `render-artifact-empty`；SVG 结构失败会追加 `render-svg-invalid`、`render-svg-dimension-missing`、`render-svg-no-visible-elements`、`render-svg-text-missing`、`render-svg-text-path-only`、`render-svg-out-of-bounds`、`render-svg-text-overlap`、`render-svg-label-overlap` 或 `render-svg-path-glyph-overlap` 等 diagnostic；PNG screenshot 失败会追加 `render-png-blank`、`render-png-content-clipped` 或 `render-png-foreground-dense` 等 diagnostic。

SVG bounded-canvas、path-only label classification、path-only glyph placement、text-overlap 与 label-vs-drawing overlap 检查有意保持保守。它们会解析 `path`、`line`、`polyline`、`polygon`、`rect`、`circle`、`ellipse`、带位置的 `text`、带位置的 `tspan` 以及 `<use href="#...">` 元素中的常见 SVG 坐标，并在检查 boxes 前组合常见 group 与 element transforms。hidden groups 与 hidden elements 会在 visible-element counting 和 box collection 中被一致跳过。path parser 会覆盖 line-style commands、`Z/z` close-path current-point resets、A/a arc extrema，以及针对 C/S/Q/T curve extrema 的 exact Bezier curve bounds，因此 curved circuit symbols 的 arc interior geometry 也能参与 bounded-canvas checks，closed subpath 后的 relative commands 也不会产生 false out-of-bounds boxes。geometry pass 也会按 presentation attributes 与 inline `style` 中的 `stroke-width` 扩展几何盒，因此粗线或元件轮廓的可见 stroke 被裁剪时会以 `render-svg-out-of-bounds` 失败，覆盖标签时也会参与 `render-svg-label-overlap`。`<defs>` 内的 definition-only glyph paths 不会被计为可见绘图元素；被引用的 glyph uses 会参与 bounded-canvas 检查，因此 path-only labels 的放置几何跑出 `viewBox` 时仍会以 `render-svg-out-of-bounds` 失败。path-only glyph definitions 也会先应用自身 definition-local `transform` 再参与 `<use>` placement，因此 dvisvgm 风格的缩放或镜像 glyph geometry 不会在 bounded-canvas 与 overlap checks 中被低估。同一个 `<text>` parent 下的多个 positioned `tspan` labels 会被当作独立 label boxes，因此 LaTeX-style SVG output 仍能触发 `render-svg-text-overlap`。label-vs-drawing overlap 会在 drawing boxes 周围使用很小的 stroke tolerance，因此细导线与 polygonal component outlines 也能作为潜在 label legibility failure 被发现。通过 `<use href="#...">` 解析出的 path-only glyph labels 会作为独立 legibility gate 与 drawing boxes 比较；当可复用 glyph geometry 压到导线或器件时，会以 `render-svg-path-glyph-overlap` 失败。path-only label classification 只检测可复用 glyph paths，不识别这些 glyph shape 编码的文本值。它们用于在 screenshot review 之前捕获明显 fixture failure，但不能替代 OCR、精确 pixel-level overlap detection、完整 SVG path coverage 或最终 image-based visual inspection。

path-only glyph definitions 现在既可以是 `<defs>` 中的 direct paths，也可以是 grouped/symbol containers。smoke pass 会在 `<use>` placement 前解析 `<g id="...">` 与 `<symbol id="...">` 的 child path geometry，因此 renderer 包装可复用 glyph paths 后，仍会进入 `pathOnlyGlyphUseCount`、bounded-canvas diagnostics 与 `render-svg-path-glyph-overlap`。

runner 位于 `src/diagram/adapters/circuitikz/circuitikzCompileRunner.ts`。它会从 `{outputDir}` 读取生成的 `{jobName}.log`，复用同一个 diagnostics parser，并在 CLI JSON result 中返回 `compileExecution` 与 `compileDiagnostics`。artifact 检查位于 `src/diagram/adapters/circuitikz/circuitikzRenderSmoke.ts`，这样 SVG 结构规则可以在不 spawn renderer 的情况下单独测试。diagnostic report 非 ok 时，CLI 仍会以非零状态退出。

如果传入 `--repair-brief-output`，它必须同时配合 `--topology-reference`，并且需要 `--compile-log` 或 `--compile-executable` 提供 diagnostics 来源。brief 会在 diagnostics 可用之后写出，并在写出任何 repair handoff 前复用同一套 topology signature check。如果传入 `--repair-brief`，candidate spec 会先与 brief 中嵌入的 topology signature 比较，之后才允许写出 output。

内嵌的 `repairPrompt` 是 schema-level guidance，不是 LLM 调用。它要求输出 revised `CircuitSpec` JSON object，而不是 free-form TikZ；要求精确保留 `topologySignature`；要求只在同一个 golden template 内修改 presentation fields；并要求对每个 `diagnosticFocus` 项做最小局部修复。`acceptanceCriteria` 会把 automation 明确带回 `assertCircuitikzRepairCandidateMatchesBrief`、单次运行中的一个 topology guard（`--repair-brief` 或 `--topology-reference`）、compile diagnostics 和 render-smoke diagnostics，之后才允许接受修复 artifact。

补充：SVG geometry parser 现在按 SVG number grammar 解析已支持元素，覆盖 leading-dot decimals 与 explicit plus signs，因此 dvisvgm 输出中的 `.5`、`-.5` 或 `+.5` 不会在 bounded-canvas checks 中被误读为整数坐标或被静默跳过。

## Maintainer Smoke Fixtures

仓库现在为每个已支持的 golden family 都提供 maintainer fixture：

| Fixture | Circuit family |
|---|---|
| `docs/maintainer/fixtures/circuitikz/common-source-nmos-v1.json` | `common-source-amplifier` |
| `docs/maintainer/fixtures/circuitikz/cmos-inverter-v1.json` | `cmos-inverter` |

使用同一套显式 renderer 配置跑完两个 fixture：

```bash
npm run diagram:smoke-circuitikz -- \
  --output-dir docs/export/circuitikz-smoke \
  --compile-executable pdflatex \
  --compile-arg -interaction=nonstopmode \
  --compile-arg -halt-on-error \
  --compile-arg -output-directory={outputDir} \
  --compile-arg {tex} \
  --expected-artifact {outputDir}/{jobName}.pdf
```

runner 是 `scripts/run-circuitikz-smoke-fixtures.js`。它会发现 fixture JSON 文件，为每个 fixture 写出一个 `.tex` artifact，逐个调用 `scripts/export-circuitikz.js`，并返回包含 `fixtureCount`、每个 fixture 的 `compileExecution` 和 `compileDiagnostics` 的聚合 JSON report。

对于输出 SVG 的 renderer 或 wrapper executable，可以继续使用同样的 expected-artifact 与 text-token gates：

```bash
npm run diagram:smoke-circuitikz -- \
  --output-dir docs/export/circuitikz-smoke \
  --compile-executable <explicit-renderer-or-wrapper> \
  --compile-arg ... \
  --expected-artifact {outputDir}/{jobName}.svg \
  --expected-svg-text v_{in} \
  --expected-svg-text v_{out}
```

这是第一条真实环境 smoke 边界。它仍然不会让 LaTeX 或 TikZJax 成为普通 CI 或插件启动的硬依赖；它给维护者提供一个在本地安装 renderer 后可重复执行的 release evidence 命令。命令保持跨平台，因为 fixture runner 继续委托给现有 shell-free compile runner，而不是解析平台 shell。

## 已支持的电路族

这不是通用 TikZ 生成器。当前原型只支持能够在导出前验证拓扑与布局约束的 golden-reference families：

| `circuitKind` | `goldenReferenceId` | Template |
|---|---|---|
| `common-source-amplifier` | `common-source-nmos-v1` | 带 `R_D`、`VDD`、`vin`、`vout` 和源极接地的 NMOS 共源放大器 |
| `cmos-inverter` | `cmos-inverter-v1` | PMOS 在上、NMOS 在下，共用 gate 输入、共用 drain 输出的 CMOS 反相器 |

adapter 会先验证结构 invariant，再输出固定布局。例如 CMOS 反相器要求：

- `MP` 是 `pmos`，`MN` 是 `nmos`；
- `VDD -> MP.S`；
- `MN.S -> GND`；
- `vin -> MP.G` 且 `vin -> MN.G`；
- `MP.D` 与 `MN.D` 位于共享输出 drain path；
- 两个晶体管 drain 都连接到 `vout`。

## 为什么 `CircuitSpec` 独立存在

当前不会为了电路图过早扩展 `DiagramSpec`。电路图需要拓扑、terminal references、layout lanes 和 package conventions；这些字段并不属于普通 flowchart 或 data chart。

当前边界是：

```text
CircuitSpec
  -> topology/template validation
  -> deterministic golden-reference circuitikz adapter
  -> .tex artifact
```

这能让 model-facing contract 保持窄边界，并让拓扑漂移可测试。exporter 会在写出文件前拒绝无效拓扑。

对于当前 golden templates，`layoutHints.inputSide` 与 `layoutHints.outputSide` 现在会被投影为确定性的 input/output port placement。topology-preserving repair 可以通过 layout hints 把 `v_{in}` 或 `v_{out}` 移到另一侧，同时保持同一个 `topologySignature`；exporter 只会改 presentation route 和 node anchor。这不是通用 autorouter，而是面向已支持 `common-source-amplifier` 与 `cmos-inverter` families 的受约束 layout projection。

## 验证

标准回归命令：

```bash
npm test -- --runInBand src/tests/circuitikzExporter.test.ts src/tests/circuitikzCompileDiagnostics.test.ts src/tests/circuitikzRenderSmoke.test.ts src/tests/circuitikzCompileRunner.test.ts src/tests/circuitikzExportCli.test.ts --runTestsByPath
```

测试覆盖：

- 确定性的 common-source LaTeX；
- 强约束 CMOS inverter 输出；
- 针对已支持 templates 的确定性 `layoutHints.inputSide` 与 `layoutHints.outputSide` projection；
- 导出前拒绝拓扑错误；
- `package.json` 中的 CLI 暴露；
- UTF-8 BOM 输入处理；
- 通过 `--topology-reference`、`createCircuitTopologySignature` 和 `assertCircuitTopologyUnchanged` 执行 topology-preserving repair 检查；
- 针对 missing packages、unknown keys、undefined control sequences 和 overfull layout warnings 的 compile-log diagnostics；
- compile log 包含 errors 时写出 diagnostics JSON，并让 CLI 以非零状态退出；
- 使用 placeholder-expanded argument arrays 的 shell-free compile execution；
- 通过 `--expected-artifact` 执行 render-smoke artifact 存在与非空检查；
- 通过 `--repair-brief-output` 与 schema `notemd.circuitikz.repair-brief.v1` 写出 topology-preserving repair brief；
- repair brief 内的 `repairPrompt`、`diagnosticFocus`、`acceptanceCriteria` 与 `topology-preserving-circuitikz-repair` handoff 内容；
- 通过 `--repair-brief` 校验 repair candidates 时输出的 `repairAcceptance`、`notemd.circuitikz.repair-acceptance.v1`、`readyForVisualAcceptance` 与 `remainingChecks` 证据；
- 通过 `--repair-acceptance-output` 持久化 repair acceptance evidence；
- 通过 `--repair-brief` 校验 repair candidate 是否匹配已有 brief；
- 对 SVG artifact 执行结构检查，并通过重复的 `--expected-svg-text` 执行可选文本 token 检查；
- 对 visible-output smoke 排除 hidden 与 transparent SVG elements；
- 通过 `pathOnlyGlyphUseCount` 与 `render-svg-text-path-only` 分类 path-only SVG labels；
- 为 `<use href="#...">` placement、bounded-canvas checks 与 `render-svg-path-glyph-overlap` 解析 grouped/symbol path-only glyph definitions；
- 为 `Z/z` 后的 bounded relative commands 增加 SVG close-path current-point handling；
- 检查 bounded SVG viewBox、针对 A/a arc extrema 的 exact arc bounds、针对 C/S/Q/T curve extrema 的 exact Bezier curve bounds、stroke-width-aware SVG bounds 与 label overlap checks、明显 text-overlap、positioned `tspan` label overlap、path-only glyph label overlap 和 label-vs-drawing overlap，包括常见 SVG transforms 的 transform-aware geometry；
- 对 PNG screenshot 执行正尺寸、非背景像素、前景包围盒、前景密度、贴边裁剪与异常密集前景块 smoke 检查；
- 通过 `src/tests/circuitikzSmokeFixturesCli.test.ts` 验证 maintainer fixture discovery 与聚合 smoke execution；
- 无效拓扑不会写出 output file。

## 非目标

这个原型不捆绑 LaTeX、不把 TikZJax 作为 Obsidian runtime 依赖调用、不 OCR 识别 path-only glyph text、不做精确 pixel-level overlap detection、不覆盖尚未支持的 SVG path geometry，也不使用渲染图像反馈进行自动修复。这些是后续 gate。它也不接受任意自然语言电路请求。当前重要声明更窄：经过验证的 `CircuitSpec` 输入可以为两个高价值 golden families 生成稳定、可读的 circuitikz，已有 compile logs 可以转换为 actionable diagnostics，并且显式配置的本地 renderer 可以在不走 shell-specific command parsing 的情况下执行，同时可选证明具体输出 artifact 已经创建；如果输出是 SVG 或 PNG，还能证明它具备进入后续视觉检查的基本结构。SVG 输出现在包含常见 SVG transforms 的 transform-aware geometry、针对 A/a arc extrema 的 exact arc bounds、针对 C/S/Q/T curve extrema 的 exact Bezier curve bounds、positioned `tspan` label geometry、path-only label classification、path-only glyph overlap detection 与保守 label-vs-drawing overlap detection；PNG 输出则会暴露前景包围盒、前景密度与 format-specific unsupported-export guidance，用于在 topology-preserving repair loop 之前拒绝明显画布裁剪、第一层 pixel crowding、Adam7 interlaced PNG 和 unsupported indexed-color bit depths。
