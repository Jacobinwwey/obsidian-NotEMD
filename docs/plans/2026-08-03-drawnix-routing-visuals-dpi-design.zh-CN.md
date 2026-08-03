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
- 预览光栅化接受 72 到 600 之间的任意整数 DPI，默认 300，设置提示中列出 100/300/600 常用预设；超出范围的值会被夹紧。PNG `pHYs` 元数据和 PDF 光栅尺寸使用归一化后的值；SVG 与 Drawnix 几何不受 DPI 影响。

## 验证

定向测试覆盖障碍避让、并行关系确定性、源视觉扫描/解析、安全处理、companion 持久化、缓存失效、PNG 元数据与 DPI 归一化。完整 Jest、TypeScript 构建、官方 Obsidian CLI 验证、render-host audit 以及 `git diff --check` 是发布门禁。
