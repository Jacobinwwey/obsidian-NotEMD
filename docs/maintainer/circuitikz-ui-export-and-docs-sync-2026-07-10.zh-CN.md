---
date: 2026-07-10
topic: circuitikz-ui-export-and-docs-sync
---

# circuitikz UI、导出与文档同步方案

语言: [English](./circuitikz-ui-export-and-docs-sync-2026-07-10.md) | **简体中文**

本文记录 circuitikz 支持在当前 main 上的代码对照、前端可见性修正、导出边界，以及网站 MDX 同步决策。

## 当前代码证据

circuitikz 工作已经进入代码库。缺口不是 renderer 本身，而是用户发现路径。

| 需求 | 当前证据 |
|---|---|
| 前端电路图选项 | `Preferred diagram type` 包含 `Circuit (Circuitikz)`，`Preferred render target` 包含 `Circuitikz + SVG preview`。这些设置现在无需 Developer mode 也可见。 |
| 受约束生成 | `DiagramSpec(intent: "circuit", circuitSpec)` 会先验证，再由 `CircuitikzRenderer` 写出结果。任意自由 TikZ 仍不属于当前范围。 |
| 源文件 artifact | Circuitikz 输出会保存为确定性的 `.tex`。 |
| 预览 artifact | Renderer 会从已验证的 `CircuitSpec` 附加 SVG companion。 |
| 多格式导出 | 预览/导出界面可以把 companion 导出为 SVG、PNG、PDF；CLI 也可以从同一个 `DiagramSpec` 写出 circuitikz 以及 SVG/PNG/PDF review evidence。 |
| 维护者 smoke | `npm run diagram:export-circuitikz` 与 `npm run diagram:smoke-circuitikz` 提供可选 LaTeX/TikZJax 证据边界，但不会把二者变成插件运行时硬依赖。 |

## UI 决策

电路图是面向用户的图表模式，把图表类型和渲染目标藏在 Developer mode 后面会让已有实现看起来像不存在。因此设置页应向普通用户展示图表 pipeline 控制项：

- `Enable spec-first Mermaid pipeline`
- `Experimental compatibility mode`
- `Preferred diagram type`
- `Preferred render target`
- `Diagram image export PPI`

Developer mode 仍负责诊断、宽松输入开关和高级文件筛选控制。circuitikz 文案继续保持精确：产品暴露的是 `Circuitikz + SVG preview`，不是插件内 LaTeX 编译承诺。

## 网站与 MDX 同步决策

大量 `website/i18n/**/features/diagrams.mdx` 本身不应默认视为污染。网站发布策略要求每个公开文档 locale 在部署前都镜像 English docs 的每条路由。

但 review 规则要更严格：

- 先稳定 `website/docs/features/diagrams.mdx` 英文源页面，再提交本地化 MDX。
- 继续把英文源页面当作主编辑面。
- 大范围再生成使用 `website/scripts/generate-localized-docs.cjs`；已审阅的小增量可使用 `website/scripts/sync-diagrams-locale-delta.cjs` 这类聚焦脚本。
- 若使用 LM Studio 辅助翻译增量，每批最多 12 个 locale，并让估算上下文低于 32k 模型窗口；一批完成并验证后，再注入下一批。
- 不提交 debug 输出目录、半同步 locale 文件或临时模型响应。

因此，本地化 MDX 是发布 artifact，不是 build cache。只要经过 review 并通过网站契约测试，它们就属于仓库。

## 后续方向

circuitikz 剩余工作应优先提升视觉可信度，而不是扩展任意语法面：

- 继续把 `CircuitSpec` 限定在已验证 golden families。
- 只有在结构性 SVG/PNG smoke 检查稳定后，再推进 OCR 或 screenshot 级检查。
- LaTeX/TikZJax 保持可选、显式配置。
- 自动 topology-preserving repair 作为后续阶段，必须受 compile diagnostics、render smoke 和 topology signature preservation 共同约束。
- 保持文档站点与 UI 文案一致，让用户能找到 `Circuit (Circuitikz)`，并理解 SVG/PNG/PDF 导出边界。
