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

这条路径使用直接进程执行和参数数组（`shell: false`），不会拼接 shell command，因此 Windows、Linux 与 macOS 都能避开 shell-specific quoting 和 resolution 差异。支持的 placeholder 是：

| Placeholder | Value |
|---|---|
| `{tex}` | 生成的 `.tex` 文件绝对路径 |
| `{outputDir}` | 生成 artifact 的绝对输出目录 |
| `{jobName}` | 生成 `.tex` 文件去掉扩展名后的 basename |

提供 `--expected-artifact` 时，runner 还会执行 render-smoke artifact 检查。对于 PDF 这类 opaque artifact，它会确认预期文件存在且非空。对于 `.svg` artifact，它还会检查 `<svg>` root、正的尺寸或 `viewBox`、至少一个可见绘图元素、重复传入的 `--expected-svg-text` tokens、明显跑出 `viewBox` 的元素，以及明显重叠的 `<text>` labels。SVG geometry pass 现在具备 transform-aware geometry，会对常见 group 与 element `transform` 属性做组合后再检查 translated、scaled、rotated、skewed 和 matrix-transformed boxes。如果 expected text 不可搜索且 SVG 使用可复用 path glyphs，report 会记录 `pathOnlyGlyphUseCount`，并发出 `render-svg-text-path-only`，让 automation 可以把 artifact 交给后续 screenshot/OCR gate：

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

对于 `.png` screenshot artifact，smoke check 会解码非交错的 8-bit grayscale、RGB、grayscale-alpha 或 RGBA PNG 输出，检查正的尺寸，把前景像素包围盒记录为 `foregroundBounds`，把包围盒内前景密度记录为 `foregroundDensity`，并要求至少一个不同于左上角背景色的像素。空白截图会以 `render-png-blank` 失败；前景内容贴到图像边界会以 `render-png-content-clipped` 失败；非平凡包围盒内前景像素异常密集会以 `render-png-foreground-dense` 失败；格式损坏或不支持的 PNG 会以 `render-png-invalid` 或 `render-png-unsupported` 失败。

检查结果会记录为 `compileExecution.renderSmoke`。缺失或空 artifact 会追加 `render-artifact-missing` 或 `render-artifact-empty`；SVG 结构失败会追加 `render-svg-invalid`、`render-svg-dimension-missing`、`render-svg-no-visible-elements`、`render-svg-text-missing`、`render-svg-text-path-only`、`render-svg-out-of-bounds`、`render-svg-text-overlap` 或 `render-svg-label-overlap` 等 diagnostic；PNG screenshot 失败会追加 `render-png-blank`、`render-png-content-clipped` 或 `render-png-foreground-dense` 等 diagnostic。

SVG bounded-canvas、path-only label classification、path-only glyph placement、text-overlap 与 label-vs-drawing overlap 检查有意保持保守。它们会解析 `path`、`line`、`rect`、`circle`、`ellipse`、带位置的 `text` 以及 `<use href="#...">` 元素中的常见 SVG 坐标，并在检查 boxes 前组合常见 group 与 element transforms。`<defs>` 内的 definition-only glyph paths 不会被计为可见绘图元素；被引用的 glyph uses 会参与 bounded-canvas 检查，因此 path-only labels 的放置几何跑出 `viewBox` 时仍会以 `render-svg-out-of-bounds` 失败。label-vs-drawing overlap 会在 drawing boxes 周围使用很小的 stroke tolerance，因此细导线也能作为潜在 label legibility failure 被发现。path-only label classification 只检测可复用 glyph paths，不识别这些 glyph shape 编码的文本值。它们用于在 screenshot review 之前捕获明显 fixture failure，但不能替代 OCR、精确 pixel-level overlap detection 或最终 image-based visual inspection。

runner 位于 `src/diagram/adapters/circuitikz/circuitikzCompileRunner.ts`。它会从 `{outputDir}` 读取生成的 `{jobName}.log`，复用同一个 diagnostics parser，并在 CLI JSON result 中返回 `compileExecution` 与 `compileDiagnostics`。artifact 检查位于 `src/diagram/adapters/circuitikz/circuitikzRenderSmoke.ts`，这样 SVG 结构规则可以在不 spawn renderer 的情况下单独测试。diagnostic report 非 ok 时，CLI 仍会以非零状态退出。

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

## 验证

标准回归命令：

```bash
npm test -- --runInBand src/tests/circuitikzExporter.test.ts src/tests/circuitikzCompileDiagnostics.test.ts src/tests/circuitikzRenderSmoke.test.ts src/tests/circuitikzCompileRunner.test.ts src/tests/circuitikzExportCli.test.ts --runTestsByPath
```

测试覆盖：

- 确定性的 common-source LaTeX；
- 强约束 CMOS inverter 输出；
- 导出前拒绝拓扑错误；
- `package.json` 中的 CLI 暴露；
- UTF-8 BOM 输入处理；
- 通过 `--topology-reference`、`createCircuitTopologySignature` 和 `assertCircuitTopologyUnchanged` 执行 topology-preserving repair 检查；
- 针对 missing packages、unknown keys、undefined control sequences 和 overfull layout warnings 的 compile-log diagnostics；
- compile log 包含 errors 时写出 diagnostics JSON，并让 CLI 以非零状态退出；
- 使用 placeholder-expanded argument arrays 的 shell-free compile execution；
- 通过 `--expected-artifact` 执行 render-smoke artifact 存在与非空检查；
- 对 SVG artifact 执行结构检查，并通过重复的 `--expected-svg-text` 执行可选文本 token 检查；
- 通过 `pathOnlyGlyphUseCount` 与 `render-svg-text-path-only` 分类 path-only SVG labels；
- 检查 bounded SVG viewBox、明显 text-overlap 和 label-vs-drawing overlap，包括常见 SVG transforms 的 transform-aware geometry；
- 对 PNG screenshot 执行正尺寸、非背景像素、前景包围盒、前景密度、贴边裁剪与异常密集前景块 smoke 检查；
- 通过 `src/tests/circuitikzSmokeFixturesCli.test.ts` 验证 maintainer fixture discovery 与聚合 smoke execution；
- 无效拓扑不会写出 output file。

## 非目标

这个原型不捆绑 LaTeX、不把 TikZJax 作为 Obsidian runtime 依赖调用、不 OCR 识别 path-only glyph text、不做精确 pixel-level overlap detection，也不使用渲染图像反馈进行自动修复。这些是后续 gate。它也不接受任意自然语言电路请求。当前重要声明更窄：经过验证的 `CircuitSpec` 输入可以为两个高价值 golden families 生成稳定、可读的 circuitikz，已有 compile logs 可以转换为 actionable diagnostics，并且显式配置的本地 renderer 可以在不走 shell-specific command parsing 的情况下执行，同时可选证明具体输出 artifact 已经创建；如果输出是 SVG 或 PNG，还能证明它具备进入后续视觉检查的基本结构。SVG 输出现在包含常见 SVG transforms 的 transform-aware geometry、path-only label classification 与保守 label-vs-drawing overlap detection；PNG 输出则会暴露前景包围盒与前景密度，用于在 topology-preserving repair loop 之前拒绝明显画布裁剪和第一层 pixel crowding。
