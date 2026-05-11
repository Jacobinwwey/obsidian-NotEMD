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

## 9. 后续推进方向（具体）

1. 在更多反馈/观测到位前保持 `legacy` 兼容默认，避免默认语义大迁移风险。
2. 若后续扩展外部自动化调用面，优先把覆盖字段直接映射到 canonical operation 执行路径，不绕过 host adapter 的 guard/校验层。
3. 为 regex/glob 增加更聚焦的示例提示与非法 pattern 指引，不阻断高级语法输入。
4. 按既定路线继续推进 packaging / semantic-verification convergence，不重开无关 runtime 范围。

## 10. 主线落盘与工作区卫生结论

该切片已具备主线落盘条件：

- 具体方案已文档化。
- 进度对比与架构推进评估已文档化并可追溯。
- 后续方向明确且可执行。
- 计划在 `main` 上提交推送后执行 clean 状态复核。
