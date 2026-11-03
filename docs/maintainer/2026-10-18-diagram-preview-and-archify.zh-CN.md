# SVG 预览兼容性验收与 Archify 对照

[English](./2026-10-18-diagram-preview-and-archify.md)

## 范围与恢复的检查点

日期：2026-10-18。仓库基线：`84338108`。本轮从旧会话 `01a10926-6bdc-7691-a4f5-5a14c40900fe` 已完成的 1.9.14 发布及原生 PDF 验收之后继续，不重做此前的 PDF 高清细节、独立视口、Alt 选字或多格式导出实现。见[双语执行计划](../plans/2026-10-18-diagram-preview-and-archify-follow-through.zh-CN.md)与[上轮验收](./2026-10-07-pdf-preview-native-acceptance.zh-CN.md)。

本轮包括基线恢复、所选图表类型预览故障修复、真实消费端验证，以及基于源码的 Archify 对照。下文增强路线图是未来建议，不代表已经实现新的布局引擎。本轮没有提交、推送、打标签、提升版本号或公开发布。

## 根因与已实现修复

当前宿主自报 Obsidian 1.14.4，插件 manifest 仍为 1.9.14。Drawnix 示例成功生成 32,529 字符的 SVG，随后在已挂载呈现检查中失败。大约 0.16 倍显示时，标题与摘要实际相隔约 0.483 CSS 像素；检查器使用屏幕坐标的 DOM 矩形，却保留了固定、未经缩放的 0.5 单位间距，因此把适应缩略图后的有效布局误判为重叠。目前证据不能证明缺陷由 Obsidian 升级引入。

`src/rendering/preview/svgSafety.ts` 现在通过根 SVG 的 `getScreenCTM()` 投影源 SVG 安全间距：水平方向使用 `|a| + |c|`，垂直方向使用 `|b| + |d|`。0.5 单位的文字间距及 1 单位的形状间距随场景一起缩放；DOM 测试替身仍采用恒等变换回退。真实相交和后绘制形状遮挡仍会失败，不改变 SVG 安全清理、缩放控件、PPI 或导出路径。T 个标签、S 个形状时，复杂度仍为 `O(T² + T·S)`，收集几何的存储量为线性。这是轴对齐矩形检查，不是精确的旋转字形求交，也不是通用布局求解器。

产品及测试修改：

- `src/rendering/preview/svgSafety.ts`：修正安全间距的坐标归属。
- `src/tests/svgSafety.test.ts`：新增等比及非等比缩放回归，并保留真实重叠检测。
- `src/tests/svgPresentationSafety.playwright.test.ts`：在真实 Chromium 中测试 0.05、0.16、1、4 倍下的正常文字、真实重叠及形状遮挡。

回归测试在产品修复前已观察到预期失败，修复后通过。这里建立源坐标不变量，而不是针对屏幕宽度打补丁；没有 Drawnix 特例、宿主版本判断或验证旁路。它避免依赖固定宿主尺寸，但并不保证未经测试的未来宿主版本一定兼容。

## 基线恢复

本地 `src/tests/diagramHistoryRepository.test.ts` 原本包含截断的输出选择器界面代码，而非已跟踪的历史测试，普通 Git 状态却没有报告差异。先备份到 `.cache/preview-20261018/diagramHistoryRepository.test.before-recovery.ts`，再通过补丁恢复 HEAD 内容；该恢复不是本轮 diff 中的历史功能变更。覆盖机制未知，不归因于 Obsidian。

额外执行了针对索引 blob 的内容审计，覆盖 634 个已跟踪源码／构建辅助文件。十处表面上的 shell／PowerShell 差异均仅为换行符差异，没有重写。回执位于 `.cache/preview-20261018/tracked-content-audit.json`。恢复后生产构建通过。

## 验证证据

命令从仓库根目录运行。本机直接通过 RTK 解析 npm 不成功，因此使用 `rtk proxy powershell -NoProfile -Command "npm ..."` 启动 npm 命令。子代理因配置的模型不可用而未能启动，后续由主代理内联完成。

| 检查 | 实际结果 |
| --- | --- |
| `npm run build` | 基线恢复后通过 |
| 定向 SVG 安全／浏览器／示例／安全清理测试 | 修复后 4 套件、27 项测试通过 |
| `npm test -- --runInBand` | 315 套件通过、2 套件失败；3085 项通过、5 项失败、1 项跳过；共 317 套件／3091 项 |
| `npm run lint:regressions -- --base-ref origin/main` | 三个修改的 TypeScript 文件零新增回归；记录的基线为 `ba2399097204` |
| `npm run audit:i18n-ui` | 通过 |
| `npm run audit:render-host` | 通过 |
| Obsidian 官方 CLI help、version、eval | 产生可用输出，宿主版本 1.14.4 |
| `obsidian-cli help` | 不可用：未安装独立可执行文件／ENOENT |
| 生产版所选类型原生预览矩阵 | 全部 33 个注册示例就绪，已挂载 SVG 几何均为正 |
| Archify 十类示例验证 | 十条命令均退出 0，均报告 `ok: true` |

文档更新后的最终验证：新生产构建通过，十个选定的 SVG／安全／示例／文档套件全部通过（76 项），包含真实浏览器回归。界面与 render-host 审计再次通过，lint 增量仍为零回归；`git diff --check` 通过。定向回执位于 `.cache/preview-20261018/final-targeted.json`，不替代全量失败记录。

不使用定向通过结果掩盖全量失败：

- `src/tests/githubReleaseWorkflow.test.ts`：四项进程边界测试的子进程超过夹具内 20 秒限制，status 为 null；部分清理钩子还报告 EBUSY。这些测试使用本地模拟远端传输，没有尝试真正公开发布。
- `src/tests/localServerSecurity.test.ts`：忙端口重试用例遇到 `listen EACCES: permission denied 127.0.0.1:6643`。

这两个模块不在 SVG 补丁范围内。隔离复测结果在下文单独记录；重试不抹除第一次失败，也不能冒充一次干净的全量通过。没有为了让本轮看似全绿而修改无关的发布／服务器实现。

### 隔离复测

`npm test -- --runInBand --runTestsByPath src/tests/githubReleaseWorkflow.test.ts src/tests/localServerSecurity.test.ts --json --outputFile=.cache/preview-20261018/isolated-recheck.json` 执行完成：1 套件通过、1 套件失败，44 项通过、7 项失败，共 51 项。六项本地服务器安全测试在重试中全部通过；发布流程的七项进程测试仍出现 null status 及 EBUSY 清理错误。保留的夹具调用停在不同的本地模拟传输阶段（API、创建草稿、上传或下载），不能将其解释为某个 SVG 渲染失败，也不足以把超时归因于机器上的特定组件。两个测试文件及发布器／服务器源码均未修改。

### 原生消费端与保全边界

已把基于 1.9.14、尚未公开发布的工作构建安装到 `E:/1Knowledge/.obsidian/plugins/notemd`，并通过官方 CLI 重载。原有 main.js、manifest.json、styles.css 备份在 `.cache/preview-20261018/installed-before/`。安装及最终完整性回执确认三份安装文件与仓库候选构建逐字节相同。main.js SHA-256 为 `cb92f97ee9267c3d73fff1323ad1100a610c95a647178eb3349d643193c3d8a7`。

原生矩阵使用现有 `notemd-sidebar-view` leaf 的真实预览控制器和生产渲染器，逐一测试 `EXECUTABLE_DIAGRAM_TYPES`，最后恢复初始 Drawnix 预览。33 项全部到达 `ready`，没有缺失正宽高的 SVG。文档自然报告 `visible`，没有伪造可见性。矩阵紧邻的前后内存设置和持久化设置字节均相同。夹具不调用 LLM／翻译 API，不写入 Vault 笔记或导出文件。

早先矩阵错误地使用设置页控制器；控制器脱离 DOM 后几何为零并超时。该次证据已作废，不作为产品通过结果；修正后的侧栏回执替换了失败尝试的输出。矩阵验证的是随附示例，不是任意用户生成文档、所有导出格式或 Drawnix 应用中的连线附着行为。

最初完整性快照包含 **67 个 Vault 根目录文件及插件设置文件**，共 68 个路径。67 个原有笔记／产物的哈希全部相同。设置文件哈希与更早的整轮会话快照不同，但在修正后的矩阵执行前后保持一致。观察到的设置文件修改时间为 2026-10-18 08:29:59 +08:00，早于该矩阵；实时截图也显示存在交互预览活动。这些事实不能确定写入者或变化字段。最初记录仅保留哈希而未保留原始设置字节，因此不能认证整轮会话设置完全未变。没有用猜测的默认值或旧配置覆盖当前设置，回执不包含凭据。

本地证据（忽略的缓存，不是发布资产）：

- `.cache/preview-20261018/before.json` 与 `drawnix-before.svg`：初始故障与几何。
- `.cache/preview-20261018/catalog-native.json`：33 类结果及恢复／设置检查。
- `.cache/preview-20261018/verify-catalog.cjs`：正确处理控制器生命周期的 CLI 夹具。
- `.cache/preview-20261018/installation.json`、`vault-before.json`、`final-integrity.json`：安装及保全回执。
- `.cache/preview-20261018/native-sidebar.png`：官方 CLI 的真实窗口截图；现有预览弹窗遮挡部分侧栏，不能作为矩阵每项视觉质量的证明。

## Archify 参考版本与方法

重新完整克隆到 `E:/convert/undo/archify-reference-20261018`。本轮固定审阅提交 `9c4985a68b52ec7b54476d1ce5ab2192cc737ace`，作者时间为 2026-10-18 01:52:30 +08:00。仓库包含 `v3.1.0` 标签，CHANGELOG 标注发布日期 2026-10-14。报告针对固定源码，并不声称它永远是上游最新状态。尤其应注意：当前 Lifecycle 示例／schema 使用版本 **3**，不能把较早 3.0.0 日志中 v2 的描述当成当前契约。

已验证十类示例：Architecture、Workflow、Sequence、Dataflow、Lifecycle、ERD、Class、Tree、Timeline、Waterfall。具体输入、候选哈希、检查详情及退出码保存于 `.cache/preview-20261018/archify-validate.json`。上游检查通过不等于感知质量通过、NoteMD 宿主兼容通过，也不等于验证了上游全部示例和发布版本。

有价值的对照是语义覆盖与布局职责，而非简单比较“10 类对 33 类”。NoteMD 的 33 个目录项包括独立语义类型、定量变体和共用渲染器；Archify 的重点是更细的创作／阅读契约，可用于增强既有类别，不必引入十套新后端或整套 Viewer。

### 跨类别发现

本节上游路径均相对于固定的 Archify 克隆。

| 源码 | 值得借鉴的机制 | NoteMD 落点／限制 |
| --- | --- | --- |
| `archify/renderers/dataflow/joint-label-routing.mjs:24` | 标签、所属桥接线及受影响的阻塞路线组成一个完整候选；通过场景检查后才应用，保持端点、固定几何和其他标签不变，明确搜索上限。 | 优先用于密集拓扑／数据流与 Drawnix 关系标签；不要把上游阈值照搬为本项目任意的关系数量配额。 |
| `archify/renderers/workflow/workflow-placement-repair.mjs:3` | 生成隔离的布局提案，克隆作者输入，由编译器检查完整图形。 | 派生布局修复归布局模块所有，不暴露让调用方管理的零碎变更步骤；显式坐标保持权威。 |
| `archify/renderers/shared/automatic-labels.mjs:6` | 依据障碍物边界寻找贴近所属路线的空位，其他标签释放空间后再试未解决标签。 | 改进 `src/diagram/adapters/editableSvg/referenceLayoutRenderer.ts:86`：当前候选耗尽后回到原本可能冲突的位置。本轮仅识别该弱点，没有修改。 |
| `archify/renderers/shared/route-quality.mjs` | 有界正交搜索，以及绕行／净空检查。 | 在呈现前协调标签与路线，而不是压制最终诊断；保留真实跨分支关系。 |
| `archify/renderers/shared/spatial-grid.mjs:7` | 保守的空间粗筛；巨大／非安全整数网格范围回退到完整候选集合。 | 可降低实际碰撞候选成本，但最坏情况仍为平方级；先与穷举结果比对，再用真实夹具测量收益。 |
| `archify/renderers/shared/layout-report.mjs:45` | 修复输入保留精确小数端点，避免取整后虚构斜线路径点。 | 后续诊断应包含稳定语义 ID、源坐标矩形／路线、渲染器标识及变换元数据，呈现层 CSS 像素单独记录。 |

### 按本项目图表类别的建议

NoteMD 类型归属见 `src/diagram/diagramTypeCatalog.ts`；参考布局归 `src/diagram/adapters/editableSvg/referenceLayoutRenderer.ts` 所有。沿用已有渲染适配器及 payload 校验边界扩展。

| NoteMD 当前类别 | 上游参考 | 推进方向与验收 |
| --- | --- | --- |
| architecture、current-state、integration-topology、high-level；data-flow、process、swimlane | Architecture 路由、Workflow 布局提案、Dataflow 联合提案 | 按拓扑区分主路径／返回／扇出，协调标签与走廊，保护容器和固定几何。密集中文、双向关系夹具必须保留所有作者节点／边，未解决碰撞不能被认定为干净布局。 |
| drawnix-knowledge-map、mermaid-mindmap、tree、org-chart、canvas-map | Tree 子树尺寸、Architecture 端口／路线诊断 | 分离层次结构与实质跨分支关系，为子树分配边界，准确说明拥挤及可编辑性限制。Archify 的纯 Tree 没有跨分支语义；不能把 Drawnix 关系压成装饰树，也不能声称序列化箭头编辑后始终附着。 |
| sequence | `archify/renderers/sequence/README.md` | 测试消息／注释换行、参与者宽度及长页面导航；保留顺序、同步／异步和返回语义。上游文档中的自调用限制不应自动成为 Mermaid 的限制，应保留本地能力。 |
| state、loop | `archify/renderers/lifecycle/README.md`（v3） | 从拓扑推导主路径、分支及回路嵌套，保留初始／终止及转换含义。新增布局前先补自环、跨阶段跳转、共享出口和嵌套状态夹具；阶段叙述不自动等价于 UML 状态机。 |
| class | `archify/renderers/class/README.md:49` | 保留依赖／关联／继承／实现／组合／聚合的标记语义；完整成员签名换行，不静默截断。自动继承主干与其他关系冲突时必须回退；覆盖混合实／虚线与长泛型。 |
| entity-relationship | `archify/renderers/erd/README.md:36` | 基数必须有声明依据，保留 PK／FK／UK 角色及引用；诊断端口标记容量和平行关系走廊。不能为了图更清晰而虚构缺失的 schema 事实或基数。 |
| timeline、gantt | Timeline 与 Waterfall README | 分开处理时间点里程碑与持续时间／依赖排期。未来跟踪瀑布图需要新的 span payload：统一时间原点、单位、父子时间及实测／示意来源，不能把 Gantt 或通用条形图改名成性能轨迹。 |
| data-chart、bar-chart、line-chart、scatter-plot、radar-chart、quadrant；ranked-funnel | 上游证据／可读性规范，而非图路由器 | 保留数值域、单位、数据来源及真实坐标轴／排名语义；在 Vega／Mermaid 或现有分段排名模块中补长标签、密集序列测试。路由改进不能证明统计结论正确。 |
| access-matrix、layer-stack、medallion、venn、nested | 共享边界、排版与来源诊断 | 保留矩阵覆盖、层级次序、集合成员及包含契约，不能把非网络语义强塞进架构图。多行、长文字与嵌套裁切需在多种预览倍率测试。 |
| circuit | 仅借鉴共享诊断规范 | Circuitikz 的元件／网络／端口与工具链校验保持权威；架构连线不是电气网络，保留工程语义及原生编译证据。 |

### 后续实施优先级

以下是后续提案，**不是悄然纳入本轮的未完成功能**：

1. **R1 — 可复现的布局诊断。** 在现有布局归属处提供结构化源坐标报告：稳定节点／边 ID、精确路线、碰撞、固定约束、耗尽的搜索预算。验收：夹具确定性、无凭据／源笔记泄露，失败回执区分渲染输出与已挂载呈现。
2. **R2 — 拓扑及泳道网格联合修复。** 用有界的完整场景提案替换冲突标签回退，保持作者 payload 和所有固定坐标。验收：障碍、中文、双向、扇入／扇出及密集场景；输出确定、取消／预算有限终止，不在其他位置制造新碰撞。无法解决时保留可执行诊断，不删除关系。
3. **R3 — 类别语义及阅读。** 先强化 Class／ER／Sequence／State 测试，再针对复现的缺口修改其各自适配器。增加视口可读性诊断，不强加全类别统一字号下限。验收：原生预览、相关可编辑／矢量导出语义，以及明确的不支持行为。
4. **R4 — 实测规模化与可选阅读增强。** 用穷举结果校验索引，再测性能；分支聚焦／小地图先明确缩放及无障碍行为。动效限于呈现层、支持减少动态效果，标准 SVG／PNG／PDF 几何稳定。新的跟踪瀑布图需单独确认 schema 和证据夹具。

Archify 使用 MIT 许可证，LICENSE 包含 tt-a1i 与 Cocoon AI 声明。本轮未复制上游渲染器代码。后续如复制实现，必须保留适用许可证及来源，并接入 NoteMD 现有契约，不引入仅透传的管理层、模式开关或重复校验。

## 阶段状态与剩余限制

P0 基线恢复、P1 修复已经实现，P3 源码调研及双语建议已交付。P2 已执行生产原生矩阵及完整测试集，但在全量失败和整轮设置完整性限制仍存在时，**不能标为全部验收通过**。本地已安装修复，公开 1.9.14 不变。不得把未来 R1–R4 写成已实现，也不得用缩略图矩阵证明所有生成文档、导出或 Drawnix 原生编辑能力。
