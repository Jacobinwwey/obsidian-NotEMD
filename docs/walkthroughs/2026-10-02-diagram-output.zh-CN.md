# 图形输出实施与验证记录

[English](2026-10-02-diagram-output.en.md)

状态：实施与本地验收完成。基线提交：`eebf4fb1da8b872e40a0b996314461954b8762b9`。本次为尚未发布的 main 变更，已发布的 1.9.8 标签与附件不变；远端 Linux/Windows 验收需将交付提交与其 [Verify plugin 工作流](https://github.com/Jacobinwwey/obsidian-NotEMD/actions/workflows/verify-plugin.yml) 对照。

## 交付行为

图形偏好规划模块统一负责能力解析与选择优先级，设置和工作台复用同一控件。暂不可用的输出仍持久化，支持项优先显示，按最新显式选择协调类型与输出，不要求重置或退出。演示导出保留独立配置、依赖与执行路径。

`html-diagram` 交付可缩放图形预览；`html-summary` 从同一规格交付结构与引文。两者均不承诺嵌入原生编辑器；源文件使用对应应用编辑。每批选择一个原生渲染器与兼容派生格式，其余原生请求保留并标为暂不可用。

导出批次保存规格、产物、附件、请求/有效输出、SVG/摘要缓存与逐文件 SHA-256 收据。新文件验证后发布；部分失败或取消保留成功文件，重试在校验后跳过成功项，不调用模型。预览和历史展示实际路径、暂不可用项、降级和部分完成状态；CLI 返回相同契约。

## 修改边界

- `src/diagram/diagramOutputPreferences.ts`：版本化迁移、选择转换与有效计划。
- `src/ui/diagramOutputSelector.ts`：共用控件、支持项排序、读取当前设置、焦点保持与串行保存。
- `src/diagram/diagramExportRun.ts`：持久化批次、验证发布、缓存、取消与恢复。
- `src/operations/diagramCommandExecution.ts`、宿主适配、生成输入与 `src/main.ts`：请求快照、执行/重开/重试、共用历史写队列。
- 预览/历史界面与维护 CLI schema 展示真实交付状态，英文、简中、繁中文案表达相同语义。
- 响应解析器在输入边界规范化引文对象；Nested Scope 提示提供 levels 契约，摘要渲染器展示各层内容。

## 验证

本机 Windows 命令均通过 `rtk` 执行：

```powershell
rtk proxy npm.cmd test -- --runInBand src/tests/diagramOutputPreferences.test.ts src/tests/diagramOutputSelector.playwright.test.ts src/tests/diagramExportRun.test.ts src/tests/diagramPreviewModal.test.ts
rtk proxy npm.cmd test -- --runInBand --json --outputFile=.cache/diagram-output-jest-final.json
rtk proxy npm.cmd run build
rtk proxy npm.cmd run lint:regressions -- --base-ref origin/main
rtk proxy npm.cmd run audit:i18n-ui
rtk proxy npm.cmd run audit:render-host
rtk git diff --check
```

边界回归 103 项通过，覆盖未知版本字段保留、连续保存中的延迟/失败、设置对象重载、原生附件写入期间取消与恢复、成功文件/恢复记录被外部修改，以及历史索引写失败不影响已成功导出。最终全套：**294 套件通过；2818 测试通过、1 跳过、0 失败；耗时 557.739 秒**。构建、UI 文案审计、渲染宿主审计、lint 回归检查（40 个改动 TypeScript 文件，相对基线零新增问题）与 diff 空白检查均通过；最后的帮助元数据更新后另核对 CLI 文档/帮助一致性。远端 CI 作为独立跨平台集成门禁。

## 真实 Obsidian 证据

本机没有独立 `obsidian-cli` 可执行文件；实际通过现有 CLI 桥接调用官方 `C:/Program Files/Obsidian/Obsidian.com`，连接已打开的 `1Knowledge`。未使用 computer-use；最终恢复与历史验证前已加载最新编译插件。

本地证据位于 `.cache/diagram-output-live-20261002/`，凭据和原始配置快照不提交。以下脚本通过 CLI 执行：

```powershell
rtk proxy node .cache/diagram-output-live-20261002/final-host-verification.cjs
rtk proxy node .cache/diagram-output-live-20261002/verify-settings.cjs
rtk proxy node .cache/diagram-output-live-20261002/restore-user-settings.cjs
```

- Drawnix 批次 `5a9792d8-05f6-4f9d-adec-634dee23dabe`：原生 Drawnix、图形 HTML、SVG、PNG、PDF 全部成功。
- Nested Scope 批次 `ddd0cd5e-531e-4c3f-8285-b413b13dd515`：图形 HTML、结构化摘要 HTML、SVG 成功；由于保留不兼容的 `source:drawnix` 请求，整体状态按设计保持 `partial`。
- 两批产物位于 Vault 的 `Notemd Verification/diagram-output-20261002/`。最终恢复能从历史重开预览，显示全部成功文件链接，模型查询次数为零，所有成功产物哈希不变。
- 真实 DOM 设置测试验证双向协调、暂不可用请求保留、支持项排序、多选保存重载，以及演示设置保持不变。
- 此前对同批产物的检查已验证 HTML 离线缩放/适应窗口、Unicode 与零脚本错误；PDFium 从一页 Drawnix PDF 提取 286 个字符，其中 193 个汉字、零替换字符。这不代表对所有字体或原生编辑器作普遍保证。
- 两份原始 `full_processed*.md` 保持不变。确认配置仅新增验证历史和空偏好字段后，按字节恢复原始 `data.json`，原历史及无关设置未变；保留当前开发版插件和生成样例。

## 限制与上线

依赖不可用不会抹去成功文件；全部请求失败时尝试有效渲染器的默认源输出，并保留失败状态。Vault 本身不可写时无法保证交付。未知偏好版本继续保留并隔离执行，显示版本提示，使用默认路线。恢复记录更新依赖 Obsidian adapter 的串行比较更新契约，不是整个文件系统的事务或断电保证。

选择器、规划、执行与恢复必须作为完整链路上线，不让界面暗示尚未支持的转换，不把部分完成当成全部成功。每批保持一个原生渲染器；未来如支持多原生转换，先定义并验证跨渲染器的语义等价性。全部验证后集成远端 `main`，本次不修改 release 或标签。
