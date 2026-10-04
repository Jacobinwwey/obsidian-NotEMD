# Obsidian PNG 兼容性验证 — 2026-10-04

## 接续范围

起点为干净的 ec4f2e7，已完成的 Drawnix 路由、PNG 流式编码和独立缩放保持不变。此前 Linux/Windows 验证与 Pages 均已成功。本次补足用户报告 architecture.zh-CN_drawnix-3/4/5.png 无法解码的实际宿主可用性缺口。

## 实现

- 添加默认开启的 diagramObsidianCompatiblePng，全部 UI 语言由本轮直接撰写翻译。
- 共用请求图/兼容图交付操作，真实重新生成较低 PPI 像素，并由 Obsidian Image 解码器验证；完整保留原图，文件名标注请求及兼容 PPI。
- Manifest v4 冻结设置与兼容密度，覆盖部分交付的 SHA-256 凭据、取消、用户编辑保护和 v1–v3 恢复。
- 自动导出、整图预览、单面板与批量面板使用同一契约，预览保存的全部路径登记至历史。
- 已更新全部 README、34 个语言的网站图表页面、双语计划与维护手册，未使用翻译 API。

## CLI 与原生证据

通过 Obsidian.com plugin:reload 将正常构建加载到已打开的 1Knowledge。原笔记和此前产物未变；复用已有 architecture 生成记录，没有调用模型。

- 开启兼容：architecture.zh-CN_drawnix-6_300ppi.png 和 architecture.zh-CN_drawnix-6_obsidian_87ppi.png；原图 SHA-256 与此前 300 PPI PNG 完全相同，两份凭据验证通过。
- ImageView 与独立 Vault 资源解码均成功，副本尺寸 4325 × 15179。
- 关闭兼容：仅保存 architecture.zh-CN_drawnix-7_300ppi.png。
- 已兼容的小图：仅保存 architecture.zh-CN_drawnix-8_300ppi.png。
- 真实预览菜单 → PNG → 原文件目录确认：保存 architecture.zh-CN_preview_300ppi.png 和 architecture.zh-CN_preview_obsidian_87ppi.png；两份均纳入历史，ImageView 解码成功。
- 根因：三个问题文件均为 RGBA8、14913 × 52341，解码需 3,122,245,332 字节，越过 Chromium 142.0.7444.265 有符号解码尺寸检查。候选预算为保守启发式；87 PPI 是本图验证结果，并非统一降级值。

本地证据保存在 .cache/obsidian-png-compatibility/，包含 live-export.json、live-manual-export.json、input-dimensions.json、匹配版本 Chromium 源码和 jest-report-final.json。测试收集器的错误已修正，没有重复生成成功的产物。

## 验证

全量 Jest：300 个套件、2922 个测试通过、1 个跳过。构建、lint 增量门禁（零回归）、UI 文案及 render-host 审计通过。网站 34 种语言构建和构建审计通过；导航检查覆盖 96 个页面，零失败。已发布的 1.9.9 资产保持不可变；本修复通过 main 与正常 Pages 部署交付。
