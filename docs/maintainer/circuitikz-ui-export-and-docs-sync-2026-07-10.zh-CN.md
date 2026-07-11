---
date: 2026-07-11
topic: circuitikz-ui-export-and-docs-sync
---

# 图表源格式、CircuitikZ 与文档同步方案

语言: [English](./circuitikz-ui-export-and-docs-sync-2026-07-10.md) | **简体中文**

## 产品模型

前端必须把三个不同决策分开呈现：

1. **图表类型**描述语义，例如流程图、时序图、电路图或数据图表。
2. **生成格式**描述可编辑、可复用的源文件，例如 Mermaid、JSON Canvas、Draw.io、Drawnix 或 CircuitikZ。
3. **导出格式**描述视觉交付物，即 SVG、PNG 或 PDF；保存源文件作为独立操作提供。

Draw.io 和 Drawnix 是源格式，不是图表类型。CircuitikZ 是电路图的受约束源格式。PNG、PDF 不应加入 `RenderTarget`；它们继续通过共享预览导出器，从 `RenderArtifact.previewSvg` 转换得到。

## CircuitikZ 生成边界

模型不应直接生成任意 TeX，而应生成通过验证的 `DiagramSpec(intent: "circuit", circuitSpec)` JSON。随后由 `CircuitikzRenderer` 确定性地写出完整 TeX 文档，包括 `\usepackage{circuitikz}`、`\begin{document}` 和 `\begin{circuitikz}`。这样可以保留拓扑验证，并让源文件、预览和导出行为保持一致。

本次调查发现，误生成思维导图有四类独立原因：

- 旧电路 prompt 仍向模型展示全部图表 intent，且没有完整 `CircuitSpec` 示例；
- 只显式选择 CircuitikZ、但没有显式选择电路图时，兼容性错误可能一直延迟到 renderer 才暴露；
- `legacy-mermaid` 按设计与电路图输出冲突；
- 旧的“总结为 Mermaid 图表”命令始终是 Mermaid 专用操作。

因此 prompt 修复应让显式电路请求只看到 circuit intent，并提供完整 `CircuitSpec` 示例。Golden template 回退只用于六类已识别电路的有限安全兜底，不能被描述成通用自由格式 CircuitikZ 生成能力。

## UI 实施进度

| 阶段 | 状态 | 证据 |
|---|---|---|
| 重命名电路图类型 | 已在本地实现 | 选项改为“电路图”，不再附带源格式。 |
| 重命名渲染目标 | 已在本地实现 | 字段改为“首选生成格式”。 |
| 澄清源格式选项 | 已在本地实现 | Draw.io、Drawnix、CircuitikZ 均明确标注为源文件。 |
| 暴露导出能力 | 已在本地实现 | 设置页与侧栏说明可保存源文件并导出 SVG、PNG、PDF。 |
| 兼容矩阵 | 已实现 | 选择电路图会固定为 `best-fit` + CircuitikZ；离开电路图会清理遗留的 CircuitikZ 偏好；操作输入会拒绝显式的不兼容组合。 |
| Obsidian 实机运行 | 已验证 | Obsidian 1.12.7 CLI 已重新加载插件，并使用已配置 provider 将用户报告的中文共源 NMOS 请求生成完整 `.tex` 文档。 |

## 网站与 MDX 决策

本地化 MDX 当前是发布输入，不是可随意删除的构建产物。GitHub Pages 使用已跟踪的英文页面和 33 组 locale 镜像构建；如果不重构发布管线就删除 locale 文件，会导致本地化审计失败。

本功能只更新 `website/docs/features/diagrams.mdx` 及其对应本地化页面，不重生成无关路由。禁止提交 `website/build`、`website/.docusaurus`、`node_modules`、翻译调试输出或模型临时响应。

公开 diagrams 页面只保留用户帮助内容：

- 图表类型、生成格式、导出格式之间的区别；
- Mermaid、Draw.io、Drawnix、CircuitikZ 的适用场景；
- 生成、预览、保存源文件和导出 SVG/PNG/PDF 的操作步骤；
- 简短故障排查。

Schema、置信度阈值、renderer 内部实现、golden fixture、编译参数、smoke 算法和 repair contract 应迁入维护者文档。必须同步修改 `website/scripts/audit-build.cjs`，让门禁检查用户契约，而不是强迫公开页面承载维护者细节。

LM Studio `hy-mt2-7b` 仅用于受控批次的前端文档翻译。电路图生成测试使用 Obsidian 中已经配置的 provider 和模型。

## 验收矩阵

- 显式电路图 + CircuitikZ 生成格式 + best-fit；
- 自动图表类型 + 显式 CircuitikZ 生成格式；
- 电路图 + legacy Mermaid 的冲突提示；
- 与用户示例对应的中文共源 NMOS 请求；
- 生成 `.tex` 的完整文档外壳和拓扑断言；
- 同一预览中的 SVG、PNG、PDF 与源文件保存；
- `obsidian help`、插件发现能力和可用的 Obsidian CLI 插件/命令操作；
- 目标 Jest、全量 Jest、TypeScript 构建、网站构建/审计和 `git diff --check`。

## 最终验证证据

- 已在 Obsidian 中复现根因：使用 `best-fit` 时，模型返回了 circuit intent，但漏极路径无效；验证在受约束回退运行前直接抛错。
- 控制流修复：对受支持且显式选择 CircuitikZ 的请求，如果模型返回无效 CircuitSpec，现在会使用有限的确定性模板；不受支持的电路请求仍会失败，不会被静默替换。
- 实机输出：`Notemd CLI Tests/CircuitikZ common-source NMOS 2026-07-11_diagram.tex` 包含 package 声明、document 外壳、`american voltages`、VDD 到 RD 再到 M1 漏极的路径、源极接地、栅极输入和漏极输出。
- Obsidian CLI：官方 `Obsidian.com help`、插件重载、命令发现、命令执行以及开发者错误/控制台检查均成功。插件暴露 30 个 `notemd:*` 命令 ID；能力、调用契约和公共接口清单仍保存在测试 vault 中。
- 修复后的仓库门禁：216 个 Jest 套件、1,855 项测试全部通过；TypeScript/esbuild 生产构建通过；图表语义验证已执行；既有 34 语言网站构建通过，`audit:build` 通过。
- MDX 决策：在当前 Docusaurus 契约下，33 个本地化 diagrams 页面是受跟踪的发布源码。本次只同步该路由；生成的 `build/` 与 `.docusaurus/` 继续不纳入版本控制。
- 视觉审计补充：CircuitikZ SVG 预览中的文字错误继承了 stage 的描边，内部 circuit-kind 副标题又与 VDD 标签重叠。预览 renderer `0.2.0` 已移除维护者元数据、禁止文字描边、把类数学标签规范化为适合屏幕阅读的文本，并降低线条与字体字重，同时保持 TeX 源文件契约不变。300 PPI PNG 复查确认标签已分离、字形清晰。
