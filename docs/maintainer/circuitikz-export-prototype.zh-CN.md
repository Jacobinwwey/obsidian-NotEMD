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
npm test -- --runInBand src/tests/circuitikzExporter.test.ts src/tests/circuitikzCompileDiagnostics.test.ts src/tests/circuitikzExportCli.test.ts --runTestsByPath
```

测试覆盖：

- 确定性的 common-source LaTeX；
- 强约束 CMOS inverter 输出；
- 导出前拒绝拓扑错误；
- `package.json` 中的 CLI 暴露；
- UTF-8 BOM 输入处理；
- 针对 missing packages、unknown keys、undefined control sequences 和 overfull layout warnings 的 compile-log diagnostics；
- compile log 包含 errors 时写出 diagnostics JSON，并让 CLI 以非零状态退出；
- 无效拓扑不会写出 output file。

## 非目标

这个原型不执行 LaTeX、不调用 TikZJax、不做截图检查，也不使用渲染图像反馈。这些是后续 gate。它也不接受任意自然语言电路请求。当前重要声明更窄：经过验证的 `CircuitSpec` 输入可以为两个高价值 golden families 生成稳定、可读的 circuitikz，并且已有 compile logs 现在可以转换为 actionable diagnostics。
