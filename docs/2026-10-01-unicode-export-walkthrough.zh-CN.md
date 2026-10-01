# Unicode 传输修复与真实 Vault 导出验证

[English](2026-10-01-unicode-export-walkthrough.en.md)

## 范围与结果

接续已完成的 1.9.8 文档/发布工作，没有重做旧阶段。通过官方 Obsidian CLI 将当前插件加载到已打开的 `1Knowledge`。独立命令 `obsidian-cli` 不存在，实际使用 `C:/Program Files/Obsidian/Obsidian.com`。应用交互均通过 CLI 求值执行，没有使用桌面 computer-use 自动化。

使用已配置提供者为两份指定的 `full_processed` Markdown 笔记生成 Drawnix 知识图，再从对应 Slidev 演示稿导出各格式。产物位于原文所在目录的 `notemd-export-demo-20261001/{zh-CN,en}/`：

| 产物 | 中文 | 英文 |
| --- | --- | --- |
| Drawnix 源文件、SVG、HTML 浏览版 | 24 节点、10 关系 | 24 节点、4 关系 |
| PDF 与含可编辑文本的 PPTX | 22 页 | 20 页 |
| PNG 序列 | 22 张 | 20 张 |
| 独立 HTML 演示 | 离线资源验证通过 | 离线资源验证通过 |
| H.264/yuv420p MP4，每页 5 秒 | 110.04 秒 | 100.04 秒 |

原文是首尾均在讨论中截断的历史科学教材片段，整理后的演示稿附有历史语境说明，保留源稿供编辑。没有重写原始输入笔记。本轮失败/中间导出已移至仓库忽略缓存，未删除。

## 真实用户链路中的修复

### 有状态 Unicode 解码

旧桌面 HTTP 流对每个 Buffer 单独调用 `toString('utf8')`。TCP 分块落在汉字或 emoji 内部时，SSE/JSON 解析器接收文本前就产生替换字符。受影响的是用户通过 `callLLM` 正常生成内容的路径，不仅是某份示例产物。

`src/llmUtils.ts` 的两条桌面传输路径现在为每个响应保留一个流式 `TextDecoder`，完成时刷新尾部。`scripts/lib/llm-provider-diagnostic.js` 使用对应的有状态 `StringDecoder`。浏览器 fetch 原已使用流式解码，本次补充回归覆盖。

测试将 OpenAI、DeepSeek、Anthropic、Google、Azure OpenAI、Ollama 及 JSON 回退响应逐字节发送，并覆盖浏览器 fetch、中断诊断文本和提供者主动返回 U+FFFD 的情况。主动返回的原文保持不变，修复不会删除或替换可疑字符。受影响的中文演示稿在插件加载修复后重新生成，没有靠替换输出文件中的乱码解决。

### 独立 HTML 样式资源

锁定版本的 Slidev 打包器将 CSS 提升到 HTML 后，KaTeX 相对字体 URL 仍指向 HTML 同级，而字体实际位于 `assets/`。`src/slideExport/slidevExporter.ts` 现在在生产独立导出边界内嵌本地样式资源，同时检查词法路径和真实路径边界，对缺失或越界文件明确报错。已有内嵌、远程及片段引用保持不变。

已安装插件的真实 `exportSlidesCommand` 导出 HTML 含 60 个内嵌字体资源。该应用内运行报告 Playwright 不可用而跳过布局审查；完整逐页渲染检查由独立仓库验证器完成，证据中保留这一区别。

### 中文字形布局测量

较高的中文字形可以超出 CSS 行盒，同时仍然完整可见。旧审查将任何滚动尺寸差异当作裁切。`slidevLayoutWorkflow.ts` 现在采集每个轴的 computed overflow，`slidevLayoutAudit.ts` 区分可见文本和裁切/滚动容器。超出幻灯片边界的文本仍失败；缺少新字段的旧测量继续采用保守检查。

### 外部 Vault 验证

`scripts/verify-slidev-export-workflow.cjs` 不再要求仓库 Git 忽略规则对外部 Vault 文件生效，而是单独记录外部输出，同时继续拒绝仓库内未忽略的输出。回归测试覆盖内外路径混合情况。

## 验证证据

本地证据保存在 `.cache/export-demo-20261001/`。运行备份包含私密提供者设置，因此刻意不提交这些缓存。

- 新鲜 `rtk proxy npm.cmd run build` 成功。已安装的 `main.js`、`manifest.json`、`styles.css` 与当前仓库文件哈希一致。
- 最终 `rtk proxy npm.cmd test -- --runInBand`：**290 套件通过，2731 测试通过，1 项跳过**，记录在 `full-tests-final.log`。
- `audit:i18n-ui`、`audit:render-host` 通过；lint 回归比较覆盖全部 9 个变更的 TypeScript 文件，新增违规为零，暂存差异格式检查通过。
- 两份 Drawnix 源文件通过生产验证，离线 HTML 缩放/下载检查通过，见 `map-browser-checks.json`。
- 中文 22 页、英文 20 页的逐页布局检查通过。PowerPoint 原生视觉检查及可编辑文本检查通过。
- 中文原生检查原始报告的 `ok:false` 仅由旧外部 Git-ignore 检查引起。`zh-CN-verification-reassessment.json` 保留这一事实，使用修复后的验证器复查仓库归属，并结合原报告已通过的功能门槛，不冒充重新进行原生渲染。英文原生验证器整体 `ok:true`。
- 产物检查覆盖 PDF 页数、PNG 尺寸/非空、PPTX 可编辑文本、视频编码/时长、视频每页与 PNG 的对照、HTML 离线资源及 SHA-256。最大归一化视频帧 RMSE：中文 **0.019049**、英文 **0.0187318**，均低于 **0.08** 阈值。
- 已目视检查全部页面缩略图和实际 PDF 渲染页。无界面浏览器可能报告非阻断的“Wake Lock permission request denied”，报告单独保留；没有残留资源请求失败或渲染错误。
- 插件用户偏好保持一致；持久化状态仅新增预期的两条 `diagramHistoryEntries`。临时宿主环境变量已恢复，最终运行时检查插件空闲。

生产与诊断回归测试均先在旧行为上失败，再在对应修复后通过。源代码变更仅限上述传输/导出边界及相应测试。

## 边界与后续设计

本次解决已复现的分块边界乱码，不能还原上游提供者已经损坏的文本。离线公式资源已内嵌，普通文本仍使用演示稿配置的系统字体回退。Drawnix 验证证明源文件序列化及静态关系，不证明任意编辑后原生应用中的箭头自动附着行为。本次使用仓库锁定的独立打包 Slidev 分支，该模式不能直接用通用上游 Slidev 替代。

所要求的双向兼容与多格式输出已写入[设计方案](plans/2026-10-01-diagram-output-compatibility-design.zh-CN.md)，属于后续 UI/执行层设计，不是本次已实现功能。不创建新发布版本、标签，也不替换已发布的 1.9.8 资产。
