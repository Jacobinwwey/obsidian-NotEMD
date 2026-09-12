---
date: 2026-09-12
last_updated: 2026-09-13
status: current
plan: ../plans/2026-09-12-mainline-reliability-and-evidence.zh-CN.md
---

# 主线可靠性：实现与验收

Language: [English](./reliability-acceptance-2026-09-12.md) | **简体中文**

[实施计划](../plans/2026-09-12-mainline-reliability-and-evidence.zh-CN.md) 承接 `7638cec` 审计。本记录负责执行证据，[机器可读测量与产物哈希](./evidence/2026-09-12/verification.json) 分别标识各阶段实测 bundle 和最终生产 bundle。版本元数据保持 `1.9.7`，本批次不创建 release 或 tag。

## 各阶段结论

| 单元 | 实现或测量结果 | 验收边界 |
|---|---|---|
| U1 | 调度器收敛、子任务实时取消、五种传输与重试使用有效信号；保留已完成写入的计数 | 真实 Obsidian 取消通过；不可物理中止的 `requestUrl` 仍不能停止服务端工作 |
| U2 | 完整输出集合预留、Vault 内重叠写入串行化、原子文本补偿、恢复副本与显式失败 | 不承诺跨进程或崩溃事务；无法证明归属时保留新建文件和二进制输出 |
| U3 | Linux/Windows Node 20 验证及逐条诊断的 lint 门禁 | 本地门禁通过；远端正反例执行在集成时补录 |
| U4 | PNG 哈希、规范化 SVG 文本比较、结构性文档测试 | 归档完整性、像素一致性和消费端验收分别记录 |
| U5 | 明确宿主的耗时、预览循环/GC 对照、桌面与移动模拟 | 保留内联打包；物理移动设备及 Obsidian 0.15.0 未验证 |
| U6 | Drawnix、diagrams.net 编辑保存重开；六个编译样例加五个方向变体 | Drawnix 节点往返通过，跨分支箭头附着失败；运行时已提示限制 |
| U7 | 批处理不可变快照、删除/移动文件处理、冻结语料及真实 Vault 耗时 | 词法检索仍有实测漏召回，不构成语义搜索验收 |
| U8 | DrawingML 顺序、各侧透明度、折叠行分隔线、合并外边线修正 | 真实 PowerPoint 编辑保存重开通过；字体与 Chromium 不保证像素一致 |

## 取消与持久化

`callApiWithRetry` 为完整重试序列持有或继承一个信号，只清理自己创建的 controller。`requestUrl` 取消会终止逻辑调用并消化晚到的成功/失败；桌面 HTTP/fetch 在能力允许时中止连接。调度器等待所有 worker 收敛，包含第一个定时器触发前就取消的情况。批处理子 reporter 读取实时状态，不再复制布尔值。

图表保存同步预留 primary/SVG/wrapper/companion 的完整路径集合。相同 Vault 内的冲突保存串行，不同输出仍可并行。文本旧内容由 `Vault.process` 原子捕获；补偿只操作身份和当前内容仍属于本次写入的文件。旧宿主没有该原子 API 时，生成恢复副本，避免读后再覆盖的非原子回滚。

路径身份校验位于 host 原子变换内部，以及旧宿主文本／二进制快照读取之后。仅在异步 `Vault.process` 之前检查不足：排队 callback 可能作用于已移动／替换的文件。新增五项红／绿回归覆盖这些调度，且五项均在真实 Obsidian 的最终 bundle 上通过，包括恢复副本内容和队列后续可用性：[host 证据](./evidence/2026-09-12/obsidian-persistence.json)。独立的 `verify:obsidian-persistence` 探针要求 disposable-Vault 标记，不进行窗口耗时测量。

宿主没有原子二进制恢复或比较后删除 API。因此保留并报告部分新建文件及二进制输出；恢复文件名以 `.notemd-recovery-<id>` 结尾，避免进入 Markdown 批处理。旧 Drawnix 附件目录保留供检查：生成文件名和 manifest 无法证明编辑器/同步修改后的归属。快照读取之后、下一次创建目录之前再次检查动态取消状态。

真实环境：Obsidian 1.13.7、安装器 1.12.7、Electron 39.8.3 / Chromium 142.0.7444.265、Windows x64。

- 两个并发回环 provider 请求在取消发出后约 **5 ms** 收敛；生成/移动数量和活动任务均为零。随后交付两个晚到响应，源笔记保持不变。
- 注入 wrapper 写入失败，外部编辑被保留，原始内容进入恢复副本；后续保存成功，证明失败未污染输出队列。
- 官方 `obsidian` CLI 已执行，`obsidian-cli` 未安装。长多行 CLI 参数触发过宿主 JSON 解析错误；已提交的探针改用短表达式加载本地脚本，并在缺少结构化输出时失败。

## 验证与 CI

最新本地构建及全量 Jest：**282 个套件，2589 项通过，1 项跳过**；跳过项依赖 POSIX 后代进程终止行为。lint 门禁检查 25 个变化的 TypeScript 文件，**新增回归为零**。UI 字符串与渲染宿主审计、33 个 gallery 样例、33 个真实 Vault 归档样例均通过。全局 ESLint 仍有历史债务，增量门禁通过不等于全库 lint 清零。双语检查现包含尚未跟踪的仓库文档，新增 fixture 不再逃过提交前验证；Office fixture 已有独立中文配对。

工作流在 Linux/Windows 上使用 `npm ci` 和 Node 20，并安装锁文件中 `playwright` 1.61.0 与 `playwright-chromium` 1.61.1 各自对应的浏览器版本。权限只读，不传 provider 密钥，也不发布。lint 按路径、规则、严重度、消息、列和映射后的原行号匹配，重复诊断逐条消耗，处理重命名并在工具/配置失败时关闭门禁。减少旧债不能抵消另一条新错误。分支保护属于独立管理员设置。

```bash
npm run build
npm test -- --runInBand
npm run lint:regressions -- --base-ref origin/main
npm run audit:i18n-ui
npm run audit:render-host
npm run diagram:gallery:check
npm run diagram:examples:check
git diff --check
```

本 Windows 工作站使用 `rtk proxy npm.cmd` / `rtk proxy git`。跨平台判断依赖全新安装的 CI，不能由本地 Node 22 的结果代替。

VitePress 1.6.4 与 34 locale 的 Docusaurus 网站构建／审计通过。28 份变更的配对 Markdown 本地链接有效、计划／缺陷 ID 一致；登记表覆盖全部 19 份历史正式计划和 32 份 brainstorming 记录。原生证据下载按相对 URL 发布，并验证字节一致；限定目录的 Git 属性防止 Windows／POSIX checkout 改写归档字节。

## 宿主成本与打包决策

测量机器为 i5-12600K、64 GiB 内存。最终 bundle 为 **10,059,753 bytes**，gzip **3,730,433 bytes**。激活数据来自已运行 renderer 内八次禁用/启用，不等于完整操作系统进程启动耗时；性能探针与最终持久化探针各自测试的 bundle 哈希记录于证据 JSON。

| 前台路径 | 首次使用（ms） | 暖路径 p50 / p95（ms），n=8 |
|---|---:|---:|
| 插件激活 | — | 226.7 / 289.3 |
| Mermaid，5 个中英节点 | 54.8 | 23.4 / 27.4 |
| Mermaid，40 个中英节点 | 95.8 | 92.1 / 120.0 |
| Vega，8 个中文类别 | 76.4 | 29.1 / 31.0 |
| Vega，80 个中文类别 | 38.5 | 42.8 / 55.2 |
| Drawnix 架构预览 | 35.4 | 25.6 / 70.2 |

刷新 Vault 后用 CDP 显式 GC，初始堆为 62.92 MB；30 次目录预览循环后为 66.30 MB，再做 30 次为 66.58 MB，残留预览窗口为零。另有 30 次移动模拟循环通过，但这不代表物理设备验收。隐藏窗口调度不纳入耗时验收。反复开发热重载会保留明显更多内存，需要完整刷新 Vault；应单独调查其生命周期，不能直接推导为必须重写资产加载器。

**决策：保留内联打包。** 在这台明确机器上，暂定激活 p95 ≤500 ms、密集预览 p95 ≤250 ms、每 30 次预热后预览循环额外保留堆 ≤10 MB。推广到低功耗或物理移动设备前重新测量。隔离方案必须证明收益，并一并更新打包、加载器及 release 资产。

## 外部消费端

- **diagrams.net 31.4.5 / Chrome 152.0.7977.83：** 导入生产 XML exporter 输出，编辑 `API Gateway 已验证`，下载后重开，三个原生节点和两条边保留。[重开源文件](./evidence/2026-09-12/native-roundtrip-edited.drawio)、[截图](./evidence/2026-09-12/drawio-reopened.png)。
- **Drawnix 源码 commit `9939f452745c3f401766d378f98faa5d26bcc48a`，package 0.0.2、Plait 0.93.1：** 原生节点编辑保存重开后，38 个节点、12 条语义关系记录和一个根节点保留。但应用布局使固定坐标箭头脱离节点。`source.id` / `target.id` 是 Notemd 引用，并非 Plait 的 `boundId`；上游 shape 绑定契约不包含 Mind 节点，简单替换字段名无法修好。renderer 新增 `drawnix-static-cross-relations` 提示，Plait 门禁明确只验证层级/静态箭头序列化。[真实重开截图](./evidence/2026-09-12/drawnix-reopened.png) 保留了失败证据。连接关系应查看已有 SVG；可附着的原生跨分支连线需要另行评估上游能力或其他原生目标。
- **Tectonic 0.16.9** 的固定发行包 SHA 已验证；使用 **Circuitikz 1.4.6**、PGF 3.1.9a、LaTeX 2021-11-15 patch 1，六个 golden 模板及五个镜像／同侧变体均在 `--only-cached` 下通过，拓扑签名不变。PDFium（`pypdfium2` 5.12.1）复核发现并推动修复 NAND／NOR 交叉栅极布线、器件文本镜像及传输门 S/D／控制线布局。冷启动包下载需单独预热；[模板总览](./evidence/2026-09-12/circuitikz/compiled-contact-sheet.png)、[方向总览](./evidence/2026-09-12/circuitikz/orientation-contact-sheet.png)、源码／PDF／PNG 哈希和日志均已保留。Windows 输出仍有 Fontconfig 配置警告，字体渲染正常。

这些应用检查使用隔离环境中的生成样例，不推广为全部 Drawnix 布局、全部消费端版本或最老 manifest 声明范围都已经验证。

## 检索质量与批处理语义

冻结语料含 **13 个文件 / 13 条查询**，覆盖同义表达、连续中文、导航页、重名标题、长段落、混合文件/目录范围及无答案情况。语料独立于旧 fixture 编写，属于合成工程材料，不是外部标注 benchmark。未根据这些分数调整检索器。

| 配置 | 正样本查询召回率 | 来源精度宏平均，弃答计 0 | 上下文字符数 p50 / p95 |
|---|---:|---:|---:|
| Top-1 | 6/9（66.7%） | 66.7% | 272 / 566 |
| Top-3 | 7/9（77.8%） | 51.9% | 313 / 1106 |

支付同义表达和连续中文查询漏召回；导航查询及排除当前文件后仍可能返回无关来源。Top-3 的召回提升有明确的精度和上下文成本。真实 Obsidian inspect 执行 65 次重建：总耗时 p50/p95 为 **8.6/23.8 ms**，文件读取 p95 **16.5 ms**，枚举 p95 **0.1 ms**。这是使用暖 OS 缓存的小语料。正常标题批处理复用一个 retriever，不能把 inspect 重建开销重复算到每次批查询。

候选路径/标题在异步读取之前捕获。读取期间移动的文件跳过；文件消失不会丢弃其余知识，其他 I/O 错误仍传播。构建完成后，批处理保留已取得的文本，即使 Vault 随后改变；新操作重新建索引。这是逐文件读取快照，不是全 Vault 原子快照。当前优先使用窄任务范围，CJK 分词/排序优化应先建立新的验证集，再决定是否引入 embeddings。

```bash
npm run evaluate:local-kb
npm test -- --runInBand src/tests/localKnowledgeSnapshot.test.ts
```

评估器测试断言范围、预算和 schema 行为，分数报告可以包含低召回结果；测试通过不代表检索质量已经优秀。

## PowerPoint 保真度

[中英内容样例](./fixtures/pptx-office-fidelity.md) 生成十页、18 个可编辑文本框和两个原生表格。PowerPoint **16.0 build 14332** 修改原生单元格、另存 PPTX、重开并渲染全部十页；修改内容与六个含中文的表格网格单元均保留。[往返报告](./evidence/2026-09-12/office-roundtrip.json)。

本轮修复集中在表格绘制：DrawingML 边线节点位于 fill 组之前，各侧保留透明度，折叠行分隔线进入原生单元格，合并续接网格只保留外边线。表格页 RMSE 从 **0.192665 降至 0.159463**。仓库既有 visible-native profile 通过（最大 0.25、均值 0.145），额外的严格 raster 实验（0.12/0.08）仍失败，未修改阈值。字体 shaping、中文基线及复杂 CSS 在 Chromium 与 Office 中仍有差异；Mermaid/SVG 几何继续作为显式图片回退。

![修复前：Chromium 参考与 PowerPoint](./evidence/2026-09-12/office-table-before.png)

![修复后：Chromium 参考与 PowerPoint](./evidence/2026-09-12/office-table-after.png)

```bash
npm run verify:slidev-export -- --vault docs/maintainer/fixtures --source pptx-office-fidelity.md --format pptx --output-subfolder export --sample-slides all --require-pptx-visual-match --pptx-visual-renderer powerpoint --json
```

Windows 原生编辑验收运行 `scripts/verify-powerpoint-roundtrip.ps1`，传入 `-InputPptx` 与新的 `-OutputDirectory`；脚本拒绝已有 PowerPoint 会话且不覆盖输入。Obsidian 先向专用 Vault 复制构建插件并创建显式 marker，再运行 `npm run verify:obsidian-host -- --vault <disposable-vault> --cli <obsidian-cli-executable>`。已提交门禁不依赖 `.trellis/` 或未跟踪的缓存报告。

聚焦移动／替换时序验收时运行 `npm run verify:obsidian-persistence -- <disposable-vault> <obsidian-cli-executable> <report.json>`。先重载已复制的插件，要求 bundle 哈希一致；该命令独立于前台窗口性能测量，返回前恢复全部注入的 Vault 方法及内存设置。
