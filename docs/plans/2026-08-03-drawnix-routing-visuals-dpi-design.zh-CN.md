---
topic: drawnix-routing-visuals-dpi
status: implemented
---

# Drawnix 根间路由、源视觉保真与 DPI

## 范围

Drawnix 知识图可以包含多个顶层 root。当一个无关 root 位于跨 root 关系的两个端点之间时，连线仍必须保持可读。源 Markdown 中的 Mermaid 代码块与 Obsidian 图片嵌入必须在生成 artifact 后保留，且不能把源字节塞入 LLM 语义 schema。光栅导出接受 72 到 600 之间的任意整数 DPI，100、300、600 仅作为常用预设。

## 架构

- 森林布局发布确定性的 `DrawnixRootRegion` 矩形，并为每个 placed node 提供稳定的 `rootId`。
- `DrawnixCrossRootRouter` 把无关 root 矩形作为硬障碍执行确定性正交网格路由；无内部通道时走外圈并留下显式 warning。原生 Drawnix 箭头和 SVG 路径使用同一份 relation points。
- `scanSourceVisualReferences` 是纯 Markdown 扫描器，记录顺序、源码行范围和 hash，忽略 fenced block 内的图片语法，且不会把源字节放入 `DiagramSpec` 或 LLM prompt。
- command host 通过二进制读取解析 Vault 相对图片。Drawnix 以 companion 形式输出 Mermaid 源 Markdown、安全 SVG、图片二进制和 JSON manifest；未解析项也会保留在 manifest 并产生 diagnostics。
- Render cache key 包含已解析 source visual manifest hash。
- PNG 预览光栅化接受 72 到 600 之间的任意整数 DPI，默认 300，设置提示中列出 100/300/600 常用预设；超出范围的值会被夹紧。PNG `pHYs` 元数据使用归一化后的值；SVG、矢量 PDF 与 Drawnix 几何不受 DPI 影响。
- PNG 预览光栅化会经过 Canvas 安全的 SVG 边界：Mermaid 导出关闭 HTML label，将 foreignObject 标签转换为 SVG 文本，并移除非 data URI 的外部资源。SVG 和 PDF 预览则通过 `svg2pdf.js` 直接消费原始 SVG DOM，把路径、文本、marker 和 defs 保留为可编辑的 PDF 矢量操作。
- 当预览包含多个 panel 时，顶部 SVG、PNG 和 PDF 操作都会要求选择原文件夹或自定义 Vault 相对文件夹，然后按顺序逐个写出确定性图片，并隔离报告单图失败。光栅合成会把每个 panel 的样式、defs 和 viewBox 保留在嵌套 SVG 画布中，避免 PDF/PNG 回退为黑色的无样式图元。

## 加固增量

- 跨 root 路由现在采用 fail-closed 策略。障碍路由失败后不再输出直线；路由器抛出明确的回退错误，由生成服务选择非 Drawnix 目标，避免生成一条穿过无关 root、却看起来像成功的关系线。
- 端点完全相同的并行关系会在网格路由前分配确定性的偏移车道，保证标签和箭头笔画可读，同时不改变语义边契约。
- 源视觉采用双层持久化契约。原生 `.drawnix` JSON 只保存命名空间 `metadata.notemd.sourceVisuals` 索引，包括 hash、解析状态、源路径和相对 companion 名称；Mermaid 源码、安全 SVG 与图片二进制继续保存在 scoped `.assets` 目录。Obsidian wrapper 负责嵌入这些 companion 供审阅。不向原生元素流注入 base64 或未经验证的 Drawnix 图片元素。
- artifact 保存对新建文件和已有文件都具备事务语义。文本与二进制文件在覆盖前建立快照；后续 companion、artifact 或 wrapper 写入失败时恢复原内容。

## 验证

定向测试覆盖障碍避让、并行关系确定性（含重复端点）、fail-closed 路由、源视觉扫描/解析、安全处理、原生 attachment metadata、scoped companion 路径重写、事务化 companion 持久化、缓存失效、PNG 元数据与 DPI 归一化。完整 Jest、TypeScript 构建、官方 Obsidian CLI 验证、render-host audit 以及 `git diff --check` 是发布门禁。
