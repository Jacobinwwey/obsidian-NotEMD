# Mermaid 导出与原生图形预览修复

[English](./2026-10-18-mermaid-and-native-preview.md)

## 已恢复的目标与约束

上一会话已修复 `svgSafety.ts` 中随缩放比例变化的碰撞间距误报，并补充单元／浏览器回归及双语 Archify 建议。已有 README、更新记录、测试与报告全部保留；本次不重做该修复，也不改变已发布的 1.9.14。

本次处理 `slidev-acceptance-fork-main-20261006` 中 Mermaid 空白、预览导出记录无法拖选、已保存 Drawnix 主图缺失，以及 Mermaid 初始适配不一致。原始笔记、旧验收导出、凭据、设置及本地 `.trellis` 状态必须保留。不需要调用 LLM／翻译 API、提交、推送、升级依赖或发布版本。

## 根因

1. **Windows 组件发现：**本地 Slidev fork 的 `unplugin-vue-components` 使用 `tinyglobby@0.2.16`。Vault 工作区与 client 目录仅共享盘符根时，遍历根被规范化成 `E:`，而不是 `E:/`；Windows 将其解析为该盘符的当前目录。编译捕获显示 `_resolveComponent("Mermaid")` 保留，自动导入扫描得到零个组件，因此生产页面留下 `<mermaid code-lz>`，没有实际图形。同一最小文档在仓库内成功、在仓库外失败；不是 MDC 或单文件打包导致。
2. **验收遗漏：**保留三个源码围栏并不代表渲染了三个图。旧记录在 Mermaid 页数为零时仍给出了成功摘要。
3. **已保存 Drawnix：**预览加载器仅查找 `filename.drawnix.svg`；缺少该 companion 时，只加入附件预览面板，遗漏原生思维导图主图。
4. **预览分发不一致：**历史 Mermaid 面板即使已有规范 SVG，也进入异步 iframe 重渲染；已保存附件则使用静态 SVG，两者初始测量边界不同。
5. **文字选择：**导出记录继承了桌面宿主禁止选字的样式；图形导航解锁不等于元信息允许选择。

## 实施阶段

1. 先复现再实现。新增预览回归最初有三处失败；源码准备与渲染存在性回归最初有两处失败。
2. 在准备工作区写入 `components/Mermaid.ts`，直接重新导出 Slidev 自身的内置组件。它适配依赖发现，不替换渲染器。保留已有用户 Mermaid 组件、配置、原始围栏和固定 fork 身份。HTML 构建与原生导出均使用准备工作区。
3. 逐页比对源码应有的 Mermaid 数量与实际非空 SVG，支持原生 shadow root；测量前等待异步图形。未解析组件和缺失图形均使验收失败。保留完整围栏长度，避免嵌套 Markdown 示例扰乱页码对应。
4. 缺少精确 SVG companion 时，使用现有投影／SVG 渲染器，从已知 Drawnix 思维导图层级和跨分支关系重建主图。主图始终排在附件前；不支持的原生数据明确显示源码主面板。未来附件元数据版本不会否定已知原生层级。诊断说明布局为派生重建，不冒充原生编辑器坐标。
5. 所有面板优先使用已有规范 SVG，再回退 iframe。保留视口默认适应窗口、缩放、平移、锁定及原始导出。图形区以外的导出记录／诊断允许直接拖选；图形区保留平移与 Alt／锁定选字的区分。
6. 运行定向／全量测试、新构建、lint 增量检查、界面与宿主审计、真实导出，以及官方 Obsidian CLI 验证；下方记录详细结果与保留边界。

## 已改文件范围

- `src/slideExport/slidevSourcePreparer.ts`：准备原生 Mermaid 组件导入，不改变用户覆盖组件及源码围栏。
- `src/slideExport/slidevLayoutAudit.ts` 与 `src/slideExport/slidevLayoutWorkflow.ts`：源码／渲染数量比对、异步 SVG 就绪等待及嵌套围栏解析。
- `src/rendering/renderers/savedDrawnixPreview.ts` 与 `src/operations/diagramCommandHostAdapter.ts`：校验并重建支持的已保存层级，主图排在附件前，保留源码预览回退。
- `src/ui/DiagramPreviewModal.ts` 与 `styles.css`：规范 SVG 优先、统一初始适配、元信息允许选字。
- 九组定向测试覆盖上述边界，包括真实浏览器拖选／适配测试；双语 README 及更新记录同步说明行为变化。前次 SVG 安全检查修复保留。

## 已跑命令与证据

Shell 命令使用仓库要求的 `rtk` 前缀；下方 npm 命令说明为简洁省略该前缀。

- 定向 Jest：预览弹窗／宿主、原生重建、真实浏览器拖选／完整适配、Slidev 源码准备、渲染测量与源码／DOM 比对门禁。
- `rtk proxy npm.cmd run build`、`rtk proxy npm.cmd test -- --runInBand --silent`、`rtk proxy npm.cmd run lint:regressions -- --base-ref origin/main`、`rtk proxy npm.cmd run audit:i18n-ui`、`rtk proxy npm.cmd run audit:render-host`、`rtk git diff --check`。本机 RTK 无法直接启动 `npm`，因此显式使用 `npm.cmd` 代理。
- `obsidian help` 成功；已尝试 `obsidian-cli help`，可选包装器未安装。
- 真实多格式重建以旧验收文档为输入，写入新目录 `slidev-mermaid-fixed-20261018`，不覆盖原验收目录。
- 本地诊断与验证日志位于 `.cache/`；提交测试不依赖这些私有夹具。

## 验证状态

- 最终定向验证：**9 组／140 项测试通过**，随后生产构建成功。
- 最后一次“不支持关系回退”调整前，全量测试已通过（321 组、3,110 项通过、一项跳过）。调整后的全量运行有 320 组通过，但未修改的发布器夹具出现四处子进程超时，并伴随 Windows `EBUSY` 清理失败；该夹具独立重跑 **45 项全部通过**。最终串行全量运行结束：**320 组通过／一组失败；3,110 项通过／一项失败／一项跳过**。剩余失败为 `src/tests/githubReleaseWorkflow.test.ts:233` 的 `does not overwrite public assets on identical retries`：夹具的子进程在 20 秒限时下返回 `status: null`。本次功能变更测试通过，但整个仓库的全量运行**并非全绿**；没有修改发布实现或放宽限时来掩盖这项无关的进程边界不稳定问题。
- Lint 增量检查：相对合并基线 `ba2399097204`，**18 个变更 TypeScript 文件、零新增问题**；界面字符串审计、渲染宿主产物审计及差异空白检查通过。这不代表历史 lint 债务已消除。
- 真实重建：**36／36 页通过**，**三个 Mermaid 图均已渲染**，三个源码围栏逐字节保留；渲染错误、溢出、不可读计数均为零。HTML、PDF、PNG、PPTX、MP4 均完成。不仅检查输出记录，也检查了浏览器实际 SVG、PNG、PDF 页面渲染、PPTX 提取媒体及 MP4 抽帧。
- 官方 Obsidian CLI 已重载最终本地插件。直接预览 `architecture.zh-CN_diagram.drawnix` 可见 **250 节点原生层级与三个附件**；指定历史任务显示其自身的 **178 节点层级与三个附件**。八个面板均初始完整适配，初始滚动偏移为零，没有 iframe 重渲染。源文件与历史内容不同，不将两者冒充为同一张图。
- 通过官方 CLI 的 CDP 鼠标按下／移动／释放，实际拖选了导出记录文本；元信息选择样式为 `text`，与图形平移／缩放保持分离。只关闭带验证标记的弹窗，保留用户原有弹窗。
- 最终安装与工作区 `main.js` 的 SHA-256 一致：`b679a559494109643ad37b73b81b69b9f2d567ce0b890c7207b000945097c6e9`。对照基线检查的 67 个 Vault 根目录原文件均未改变；安装／原生验证期间设置未改变，持久化 SHA-256 为 `615eaf9868971d85eb76aa0a9805d1af56dcea632f23cb580f5e8c5ad01ef0ee`。未覆盖旧验收导出。

## 修复产物与边界

新导出位于 `E:/1Knowledge/slidev-mermaid-fixed-20261018/`：

- `architecture.zh-CN.slidev-slides/index-standalone.html`
- `architecture.zh-CN.slidev.pdf`
- `architecture.zh-CN.slidev-slides-png/01.png` 至 `36.png`
- `architecture.zh-CN.slidev.pptx` 及其 `.report.json`
- `architecture.zh-CN.slidev.mp4`

旧 HTML／PDF／图片是已固化的导出文件，安装修复不能追溯修改其中的空白图，请使用新产物。已经打开的旧预览窗口需要关闭后重新打开，才使用更新后的代码；没有擅自关闭用户已有弹窗。支持的 Drawnix 层级重建属于派生布局，不保证还原原生编辑器坐标；不支持的原生版本／图形／关系保留源码预览，不静默丢弃，也不直接抛错。PPTX 中 Mermaid 沿用栅格图回退，并非可编辑原生节点；没有声称完成原生 PowerPoint 重开验证。可选的 `obsidian-cli` 包装器不可用，但官方 `obsidian` CLI 已实际执行验证。没有升级版本、提交、推送或发布。六个实施／验证阶段均已执行；发布夹具稳定性作为独立后续问题明确保留，不声称当前已具备发布条件。

本地证据：`.cache/diagram-mermaid-serial-final-jest-20261018.json`、`.cache/slidev-mermaid-fixed-20261018.log`、`.cache/mermaid-preview-native-20261018/{native,integrity}.json`。这些私有夹具不是运行时或 CI 依赖。
