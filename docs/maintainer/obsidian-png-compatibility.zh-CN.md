# Obsidian PNG 兼容性

请求图形 PNG 保持所选的整数 72–600 PPI，默认 300。**生成图片兼容 Obsidian** 默认开启：使用宿主图片解码器检查原图；失败时保留原图，从 SVG 重新生成像素更少的独立副本，副本必须通过实际解码。关闭后跳过检查，仅输出请求原图。SVG 和矢量 PDF 的几何不受影响；演示导出继续使用独立链路。

## 命名与打开行为

300 PPI 的 Drawnix 图命名为 note_drawnix_300ppi.png；必要时追加 note_drawnix_obsidian_87ppi.png。两份文件都位于原笔记旁或明确选择的输出目录，运行记录和暂存文件仍使用配置的缓存目录。历史默认打开验证成功的兼容副本，重复导出使用碰撞后缀。特别大的图形，兼容副本可能低于 72 PPI；原图始终保留请求 PPI。

## 根因

用户报告的 architecture.zh-CN_drawnix-3/4/5.png 均为 14913 × 52341 的 8 位 RGBA PNG。编码、CRC 与 zlib 校验成功，但单帧解码需要 3,122,245,332 字节。Obsidian 1.12.7 / Electron 39.8.3 / Chromium 142.0.7444.265 的 ImageView 和 Vault 资源解码均拒绝这些图片。

匹配版本的 Chromium 源码链路为 PngImageDecoder → SkiaImageDecoderBase → ImageDecoder::SetSize；SizeCalculationMayOverflow 对解码字节数执行有符号 32 位算术检查，越界时在接受图片尺寸前标记失败。这解释了本次文件的问题；PNG 写入成功或 CLI 返回 Opened 并不能证明宿主可以查看。其他图片也可能因内存相关条件解码失败。

一手源码标签为 142.0.7444.265，目录 third_party/blink/renderer/platform/image-decoders 下涉及：

- png/png_image_decoder.cc
- skia/skia_image_decoder_base.cc
- image_decoder.cc
- image_decoder.h

## 运行与恢复

首个兼容候选使用保守的 256 MiB RGBA 解码预算和 32767 像素边长启发式；解码失败后继续降低 PPI。这些预算用于选候选，不宣称是通用 Obsidian 上限，也不保证获得最高可解码 PPI。请求原图不被替换或缩小。每个候选同时改变实际像素和 pHYs 密度；解码串行进行，有超时，完成或取消时释放 Image 与 Blob URL。

Manifest v4 保存设置快照和兼容副本 PPI，每份交付文件都有 SHA-256 凭据。部分失败重试验证已保存文件并保持冻结的副本路径；v1–v3 恢复保持旧版单图行为。所有候选失败或转换器出错时保留请求原图，报告可重试错误。整图、单面板及批量面板 PNG 导出使用同一交付操作，全部路径纳入 Vault 历史。

## 验证

使用正常插件构建及 Obsidian CLI 在 1Knowledge 测试。复用已有 architecture 产物，无需调用模型；打开交付的副本，对 ImageView 图片和独立的 Vault 资源 Image 调用 decode()，确认正数尺寸，核对 IHDR/pHYs、文件哈希及原文件未变。还需覆盖关闭模式、原图已兼容的小图、部分凭据、取消、历史记录及篡改。
