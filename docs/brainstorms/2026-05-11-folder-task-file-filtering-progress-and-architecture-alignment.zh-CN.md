---
date: 2026-05-11
last_updated: 2026-05-11
topic: folder-task-file-filtering-progress-and-architecture-alignment
---

# 文件夹任务文件筛选交付：深度对比、进展评估与后续方向

## 1. 范围与需求基线

本文用于把“文件夹任务文件筛选”能力的方案与实现状态完整落盘，依据最新需求收敛如下：

1. 文件夹任务需要支持可配置文件筛选（`regex/glob/contains/no-filter`）。
2. `includeSubfolders` 必须是可选项，因为翻译任务当前行为与其他任务不同。
3. 筛选目标必须允许用户在 `relativePath` 与 `basename` 之间切换。
4. 默认情况下必须保证现有功能稳定、不回归。
5. 交付方式必须符合主线稳定化纪律（CI-safe、契约先行、已发布路径不回退）。

## 2. 改动前现状与根因分析

改动前，文件夹级文件收集逻辑分散在多个模块，任务间行为不一致：

- 大多数文件夹任务采用“路径前缀递归”。
- `batchTranslateFolder` 采用“仅当前目录子项”（`folder.children`）。

根因总结：

1. **缺少统一文件选择契约**，导致每个命令各自实现，长期易漂移。
2. **“特殊字符不能输入”并非本需求主阻塞点**；核心问题是插件侧缺少统一选择/筛选架构，而不是 Obsidian 文本输入本身。
3. **缺少兼容模式**，无法在保留翻译 legacy 范围语义的同时开放可选递归行为。

## 3. 实现映射（需求 -> 代码证据）

| 需求 | 代码证据 | 状态 |
|---|---|---|
| 引入统一文件夹任务 selector | `src/folderTaskFileSelector.ts` | 已落地 |
| 支持 `none/contains/regex/glob` | `FolderTaskFileFilterMode`、matcher 编译逻辑 | 已落地 |
| 支持 `relativePath/basename` 目标切换 | `FolderTaskFileFilterTarget`、target resolver | 已落地 |
| 支持可选 `includeSubfolders` 且保留兼容默认 | `FolderTaskIncludeSubfoldersMode` + `legacy` 任务映射（翻译默认非递归） | 已落地 |
| 默认行为保持稳定 | `DEFAULT_SETTINGS` 中 `folderTaskIncludeSubfoldersMode = "legacy"`、`folderTaskFileFilterMode = "none"` | 已落地 |
| regex 失败不静默 | regex 编译 `try/catch`，显式报错 | 已落地 |
| 覆盖主要文件夹任务路径 | `noteProcessingCommandHostAdapter.ts`、`fileUtils.ts`、`translate.ts`、`formulaFixer.ts` | 已落地 |
| 设置页可配置 | `NotemdSettingTab` 新增筛选区块 + EN/ZH-CN/ZH-TW i18n | 已落地 |
| 回归测试锁定行为 | `folderTaskFileSelector.test.ts`、`translateContract.test.ts`、host/contract 测试 | 已落地 |
| 增加 operation 级可选覆盖（不改变全局默认行为） | `applyFolderTaskSelectionOverride`、host adapter 覆盖参数打通、operation 输入 schema 扩展 | 已落地 |

## 4. 架构推进评估

本次改动符合既有“先稳定再扩展”的推进路线：

1. **从分散逻辑收敛到统一契约**
   文件选择规则提升为共享工具，降低任务间长期语义漂移。
2. **兼容优先迁移**
   `legacy` 子目录模式保证翻译默认行为不变，同时允许显式开启递归。
3. **边界加固而非能力泛化**
   这是任务编排一致性升级，不是运行时打包路线偏航。
4. **错误语义收紧**
   无效 regex 现在显式失败，避免静默误筛选导致批处理范围失控。

## 5. 与先前方案轨道的深度对比

### 5.1 对齐 `mainline-stabilization-next-batch` 方向

一致点：

- 用共享契约提升命令/任务行为可预测性。
- 延续 CI-safe 的增量交付方式。
- 不重开无关的 renderer/runtime packaging 范围。

差异点：

- 本切片主要作用于设置项与任务编排层，而非图表命令表面本身。
- 但其推进哲学与边界治理方式与主线稳定化方案一致。

### 5.2 对齐 packaging/semantic convergence 轨道

一致点：

- 同样遵循“集中真值 + 回归锁定 + 文档同批更新”的反漂移模式。
- 同样执行完整门禁（`build`、全量测试、audits、diff-check、Obsidian CLI 检查）。

差异点：

- 本切片关注内容处理范围选择，不属于 release packaging 边界语义层。

## 6. 风险清单与控制措施

1. **风险：** regex 配置错误导致处理范围异常放大。
   **控制：** 编译失败显式报错，不做静默降级。
2. **风险：** `invert` + 空 pattern 导致“全排除”误行为。
   **控制：** 空 pattern 被定义为 no-op，即使 invert=true 也不改变文件集合。
3. **风险：** mock/边界文件对象缺失 `extension` 时筛选异常。
   **控制：** 当 `file.extension` 缺失时回退到 `name/path` 推导扩展名。
4. **风险：** 翻译任务因递归默认改变产生回归。
   **控制：** 翻译在 `legacy` 下仍默认非递归，仅在用户显式设为 include 时递归。

## 7. 本次交付验证证据

已执行且通过：

1. `npm run build`
2. `npm test -- --runInBand`（全量绿）
3. `npm run audit:i18n-ui`
4. `npm run audit:render-host`
5. `git diff --check`
6. `obsidian help`
7. `obsidian-cli help`

## 8. 增量进展更新（operation 级覆盖切片）

在全局筛选能力落地后，本轮后续切片也已完成：

1. 文件夹范围 operation 输入 schema 已支持可选覆盖字段：
   `includeSubfoldersMode`、`fileFilterMode`、`fileFilterPattern`、`fileFilterTarget`、`fileFilterCaseSensitive`、`fileFilterInvert`。
2. note-processing 与 utility 两条 host adapter 路径已打通覆盖参数，并统一通过共享 helper（`applyFolderTaskSelectionOverride`）合成有效设置，避免多处重复合成逻辑漂移。
3. 未传覆盖参数时行为与原来完全一致；翻译任务在 `legacy` 下仍保持默认非递归。
4. 回归覆盖已扩展到 selector helper、CLI contract、operation registry 元数据和 host adapter 行为层。
5. sidebar/workflow 在已有上下文 folder 时，已对更多文件夹动作完成覆盖透传对齐（`extract-concepts-folder`、`batch-extract-original-text`、`batch-fix-formula`），避免同一工作流中出现“部分动作沿用上下文、部分动作重新弹选择器”的语义割裂。

## 9. 后续推进方向（具体）

1. 在更多反馈/观测到位前保持 `legacy` 兼容默认，避免默认语义大迁移风险。
2. 若后续扩展外部自动化调用面，优先把覆盖字段直接映射到 canonical operation 执行路径，不绕过 host adapter 的 guard/校验层。
3. 为 regex/glob 增加更聚焦的示例提示与非法 pattern 指引，不阻断高级语法输入。
4. 按既定路线继续推进 packaging / semantic-verification convergence，不重开无关 runtime 范围。

## 10. 增量进展更新（批量提取指定原文 operation 契约）

本切片补齐了此前识别出的“文件夹级提取指定原文”在 operation 层的契约空缺：

1. 在 `src/operations/registry.ts` 中新增 operation `content.batch-extract-original-text`。
2. 命令绑定统一为 `batch-extract-original-text`，并复用工作流动作元数据语义（`interactive-ui`、`folder-selection`、`batch-write`）。
3. 输入 schema 已支持文件夹筛选覆盖字段：
   `includeSubfoldersMode`、`fileFilterMode`、`fileFilterPattern`、`fileFilterTarget`、`fileFilterCaseSensitive`、`fileFilterInvert`。
4. 结果 schema 已对齐 `BatchExtractOriginalTextResult` 结构：
   `folderPath`、`processedFileCount`、`extractedCount`、`cancelled`、`fileResults`、`errors`。
5. 回归测试已扩展并锁定该 operation 在以下层面的可见性与契约稳定性：
   `operationsRegistry`、`cliContracts`、`cliCapabilityManifest`。

## 11. 增量进展更新（筛选语法指引与 Regex 早期提示）

按既定路线的下一步低风险 UX 加固切片已落地：

1. 在文件夹任务筛选区域新增“模式语法指引”设置行，提供 regex/glob 规范示例与匹配目标对齐提醒。
2. 当筛选模式为 `regex` 时，用户在设置页修改模式串或切换到 regex 模式会触发非阻塞编译校验。
3. 若 regex 无效，设置页立即给出本地化提示；但仍保留保存行为，不阻断高级用户的连续编辑流程。
4. 该改动不改变任务运行时默认语义，仅把错误暴露时机前移，降低“执行批处理后才发现 pattern 错误”的延迟成本。
5. i18n 与回归覆盖已同步更新，锁定新增 key 与设置页对 key 的使用。

## 12. 增量进展更新（共享 Regex 校验收敛 + Adapter 覆盖锁定）

又一个稳定化增量切片已落地，用于降低设置页与运行时校验语义漂移风险：

1. regex 语法预检已收敛到 `src/folderTaskFileSelector.ts` 的共享 helper（`getFolderTaskRegexValidationError`），不再由设置页本地重复实现。
2. 运行时 regex matcher 编译与设置页预检现在复用同一套校验语义，降低后续维护中“提示可过但运行时报错”或反向漂移的概率。
3. host-adapter 回归已锁定 `runBatchExtractOriginalTextCommandWithHost` 的覆盖行为，包括：
   - `folderPathOverride + fileSelectionOverride` 的执行语义
   - base settings 对象不被 override 流程污染的保证
4. 该改动不改变命令默认语义，仅增强契约到执行层的一致性与可回归性。

## 13. 主线落盘与工作区卫生结论

该切片已具备主线落盘条件：

- 具体方案已文档化。
- 进度对比与架构推进评估已文档化并可追溯。
- 后续方向明确且可执行。
- 计划在 `main` 上提交推送后执行 clean 状态复核。

## 14. 1.8.7 发布收敛评估（深度对比 + 后续方向）

本次 `1.8.7` 发布切点补齐了“功能已落地”到“发布真值完全收敛”之间的最后差距。

### 14.1 现有代码与先前方案差异对比

对照本文前述方案要求，当前状态如下：

1. **共享 selector 契约要求** 不仅已实现，还已同步到欢迎弹窗摘要、release notes、change log，形成发布层可见真值。
2. **`includeSubfolders` 可选且兼容要求** 继续保持：`legacy` 默认兼容行为未变化，并在发布文档中显式固化。
3. **`relativePath`/`basename` 目标切换要求** 继续维持设置驱动与回归锁定，未被发布流程或打包边界改动打断。
4. **稳定性要求** 在本轮新增一层反漂移保障：
   regex 预检与运行时编译统一复用 `getFolderTaskRegexValidationError`。
5. **CI-safe 纪律要求** 仍通过完整门禁验证后再发布，未出现“先发后补测”的逆序风险。

### 14.2 架构推进状态评估

相对既有架构方向，本轮推进状态为：

1. **契约层收敛：本阶段完成**
   selector 语义、host-adapter 覆盖合成、operation 契约注册、设置页提示已对齐。
2. **跨层一致性：显著提升**
   设置页校验与运行时行为共享 regex 校验真值，减少双实现漂移面。
3. **发布面一致性：本阶段完成**
   包元数据、文档、变更记录、欢迎弹窗摘要、双语 release notes 在同一版本边界上同步。

### 14.3 剩余风险与控制

1. **风险：** regex/glob 对非技术用户仍有理解门槛。
   **控制：** 继续保持轻量语法指引与非阻塞编辑，不牺牲高级语法。
2. **风险：** 后续新 operation 可能绕过共享覆盖 helper，导致漂移回归。
   **控制：** 新文件夹 operation adapter 强制复用 `applyFolderTaskSelectionOverride`，并通过契约测试锁定。
3. **风险：** 未来若调整 `legacy` 默认语义，兼容风险仍高。
   **控制：** 将默认语义迁移单独作为兼容性专项交付，配套显式回归矩阵与分阶段说明。

### 14.4 后续推进方向（1.8.7 之后）

1. 按既定 Stage-B2 路线继续推进 packaging / semantic-verification convergence，不把 runtime-boundary 拓扑改造混入文件夹任务切片。
2. 对新增文件夹动作默认补齐 `operationsRegistry` + `cliContracts` + `cliCapabilityManifest` 三层契约对齐检查。
3. 在不改变行为契约前提下，做一次聚焦的筛选预设/示例 UX 强化实验。
