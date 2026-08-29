# 图表示例与实机 Vault 证据实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**目标：** 建立由 catalog 驱动的双语学习目录，在运行中的 `E:\1Knowledge` Vault 中通过 provider 实测全部 33 个可执行图表类型，并保存真实 Artifact 与视觉证据。

**架构：** 保持现有静态 fixture gallery 不变，新增纯运行时库，负责 catalog 枚举、输入渲染、路径安全、脱敏、manifest 校验与清理计划。Node 编排器创建临时 Vault 笔记，通过官方 Obsidian CLI 调用现有 maintainer `diagram.generate`，只复制经过验证的输出到 `docs/diagram-examples/<type-id>/`，并在 `finally` 中删除专属临时范围。

**技术栈：** Node.js CommonJS 脚本、TypeScript/Jest 测试、现有 `src/diagram` catalog 与 fixture、官方 Obsidian CLI `create/delete/eval`、SHA-256、VitePress 导航，以及插件已有的 Playwright/导出 Artifact 路径。

## 全局约束

- 保留 dirty worktree 中所有无关用户修改，只修改本功能所需文件。
- 类型和语义只能来自运行时 catalog 与 executable fixture catalog，禁止维护第二份 33 行手工列表。
- 实机证据必须与 `docs/assets/diagrams` fixture gallery 分离。
- 只保存仓库相对 docs 路径、Vault 相对逻辑源路径、provider/model 名称、有限诊断和 SHA-256；禁止凭据、header、原始 provider response 或绝对本地路径。
- 使用专属临时 Vault 前缀，只删除该前缀下本次创建的文件；清理必须幂等并位于 `finally`。
- provider 失败或 target unavailable 必须明确记录，不能静默替换为 fixture 结果。
- 所有新增 Markdown 必须有英文和简体中文兄弟文件。
- 仓库命令使用 `rtk` 前缀；手工编辑使用 `apply_patch`。
- 遵循 TDD：每个纯行为先写失败测试，再实现、跑 focused tests，最后跑完整回归/build/docs 门禁。

---

### Task 1：建立纯证据运行时契约

**文件：**
- 创建：`scripts/lib/diagram-examples-runtime.js`
- 测试：`src/tests/diagramExamplesRuntime.test.ts`

**接口：**
- 消费：catalog 摘要、fixture 元数据、文件系统路径、CLI 结果元数据。
- 产出：`buildExamplePlans()`、`renderExampleInput()`、`sanitizeDiagnostic()`、`resolveSafeVaultPath()`、`collectCleanupPaths()`、`buildManifestEntry()`、`validateManifest()`。

- [ ] **步骤 1：先写失败测试**，覆盖 catalog 到目录规划、双语输入标题、绝对路径拒绝、secret 脱敏、清理范围、manifest 哈希/路径校验和失败聚合。

- [ ] **步骤 2：运行 focused test 确认 RED。**

运行：`rtk npm.cmd test -- --runInBand src/tests/diagramExamplesRuntime.test.ts`

预期：因 `scripts/lib/diagram-examples-runtime.js` 不存在而失败。

- [ ] **步骤 3：实现最小纯函数。**

使用 POSIX 规范化仓库路径；拒绝重复 catalog ID；由稳定 `typeId` 派生两个输入路径；用 `path.relative` 将路径限制在目标根目录。脱敏 `api_key`、`apikey`、`token`、`secret`、`authorization`、Windows drive 路径和 POSIX 绝对路径，诊断最多 500 字符。`validateManifest()` 校验 schema version、expected count、唯一 ID、状态值、根目录内路径、文件存在性和调用方提供的 SHA-256。

- [ ] **步骤 4：重跑 focused test 并补边界。**

运行：`rtk npm.cmd test -- --runInBand src/tests/diagramExamplesRuntime.test.ts`

预期：通过重复 ID、缺失文件、旧哈希和清理前缀案例。

- [ ] **步骤 5：提交纯契约。**

```bash
rtk git add scripts/lib/diagram-examples-runtime.js src/tests/diagramExamplesRuntime.test.ts
rtk git commit -m "feat(diagrams): add real-vault evidence runtime contract"
```

### Task 2：增加 catalog 提取与双语输入生成

**文件：**
- 创建：`scripts/diagram-examples-catalog-entry.ts`
- 创建：`scripts/lib/diagram-examples-catalog.js`
- 测试：`src/tests/diagramExamplesCatalog.test.ts`

**接口：**
- 消费：`getExecutableDiagramExamples()`、`getExecutableDiagramType()` 和 Task 1 输入渲染。
- 产出：`loadExecutableDiagramExampleSummaries(repoRoot)`、稳定的中英文源笔记内容，以及不含手工 ID 列表的 33 个 catalog 摘要。

- [ ] **步骤 1：写失败测试**，断言 bundle catalog 返回 33 个唯一行、fixture ID 与运行时 type ID 一致、target 与 descriptor 一致，中英文输入拥有相同的类型/target 和语义事实 token。

- [ ] **步骤 2：运行测试确认 RED。**

运行：`rtk npm.cmd test -- --runInBand src/tests/diagramExamplesCatalog.test.ts`

预期：因 catalog entry 和 loader 不存在而失败。

- [ ] **步骤 3：实现 Node 可读取的 catalog bundle。**

创建极小 TypeScript entry，导入现有 fixture catalog，并导出 JSON-safe 摘要：`typeId`、`fixtureId`、`title`、`selectionRationale`、`sourceIntent`、`target` 和从 `spec` 归一化得到的语义事实摘要。使用仓库已有 `esbuild` 将其 bundle 成临时 CommonJS 文件，放在 `.cache/diagram-examples`，不得写入 `docs`。

- [ ] **步骤 4：实现双语输入渲染。**

渲染稳定 Markdown 模板，包含标题、用途、requested type、requested target、源事实和两到三个阅读线索。两种语言保留 fixture 中的标识符/数值不变；通过运行时库中的 33 项标题/说明词典翻译说明文字，缺失翻译时直接失败，不静默混用语言。

- [ ] **步骤 5：重跑 focused tests 并确认 GREEN。**

运行：`rtk npm.cmd test -- --runInBand src/tests/diagramExamplesCatalog.test.ts src/tests/diagramExamplesRuntime.test.ts`

预期：恰好 33 个 catalog 摘要及等价的双语事实 token 全部通过。

- [ ] **步骤 6：提交 catalog/input 边界。**

```bash
rtk git add scripts/diagram-examples-catalog-entry.ts scripts/lib/diagram-examples-catalog.js src/tests/diagramExamplesCatalog.test.ts scripts/lib/diagram-examples-runtime.js src/tests/diagramExamplesRuntime.test.ts
rtk git commit -m "feat(diagrams): derive bilingual example inputs from catalog"
```

### Task 3：实现真实 Vault 生成器与清理

**文件：**
- 创建：`scripts/generate-diagram-examples.js`
- 修改：`package.json`
- 测试：`src/tests/diagramExamplesGenerator.test.ts`

**接口：**
- 消费：Task 1 运行时函数、Task 2 catalog 摘要、`scripts/invoke-maintainer-cli-operation.js` 约定和 Obsidian CLI。
- 产出：`npm run diagram:examples`、`npm run diagram:examples:check` 以及完整的 `docs/diagram-examples/manifest.json`。

- [ ] **步骤 1：写失败编排测试**，注入 `createVaultFile`、`invokeDiagramGenerate`、`readVaultFile`、`copyFile` 和 `deleteVaultFile`。覆盖成功输出发现、target 不匹配、provider 错误、超时、旧输出拒绝和 `finally` 清理。

- [ ] **步骤 2：运行 focused test 确认 RED。**

运行：`rtk npm.cmd test -- --runInBand src/tests/diagramExamplesGenerator.test.ts`

预期：因生成器编排函数不存在而失败。

- [ ] **步骤 3：实现无副作用的 batch runner。**

从脚本/库边界导出 `runExampleBatch(dependencies)`。每个 plan 创建临时英文笔记，用 `{ sourcePath, executionMode: 'save-artifact', requestedTypeId, requestedRenderTarget: target, compatibilityMode: 'best-fit', targetLanguage: 'en' }` 调 maintainer operation；读取返回的 `outputPath`、`followThrough.artifactTarget`，再读取 Artifact、`.svg` companion 和可用 `.png` 导出；复制到类型目录，计算字节哈希，写 `machine-test.json`。复制前验证返回 target 等于 plan target。单类失败后继续下一个类型；任一条目不是 `passed` 时进程返回非零。

- [ ] **步骤 4：实现 CLI adapter 与受保护清理。**

通过 `spawnSync`/`spawn` 调用 `node scripts/invoke-maintainer-cli-operation.js --vault "E:\\1Knowledge" --operation diagram.generate --input-file <request> --pretty`，解析 JSON stdout；仅使用 `obsidian create`/`obsidian delete` 操作专属临时前缀。读取/复制前将 Vault 路径解析并限制在 `E:\\1Knowledge` 下。在 `finally` 删除 wrapper、Artifact、companion 和本次创建的空目录；本次运行前已存在的路径不得删除。

- [ ] **步骤 5：实现不调用 provider 的 `--check`。**

读取 `docs/diagram-examples/manifest.json`，重新枚举 catalog，通过 `validateManifest()` 校验已提交文件；每个 `passed` 条目至少有一个 Artifact/视觉文件；每个 machine-test 文件必须与 manifest 行一致。catalog 漂移、旧哈希、重复 ID、缺双语输入、路径逃逸或疑似 secret 元数据都必须返回非零。

- [ ] **步骤 6：增加 package scripts 并重跑 focused tests。**

增加：

```json
"diagram:examples": "node scripts/generate-diagram-examples.js",
"diagram:examples:check": "node scripts/generate-diagram-examples.js --check"
```

运行：`rtk npm.cmd test -- --runInBand src/tests/diagramExamplesGenerator.test.ts src/tests/diagramExamplesRuntime.test.ts`

预期：注入依赖测试全部通过且不修改 Vault。

- [ ] **步骤 7：提交生成器。**

```bash
rtk git add scripts/generate-diagram-examples.js scripts/lib/diagram-examples-runtime.js scripts/lib/diagram-examples-catalog.js package.json src/tests/diagramExamplesGenerator.test.ts src/tests/diagramExamplesRuntime.test.ts
rtk git commit -m "feat(diagrams): add real-vault examples generator"
```

### Task 4：增加双语 README 与导航

**文件：**
- 创建：`docs/diagram-examples/README.md`
- 创建：`docs/diagram-examples/README.zh-CN.md`
- 修改：`docs/.vitepress/config.mts`
- 修改：`docs/index.md`
- 修改：`docs/index.zh-CN.md`
- 测试：`src/tests/diagramExamplesDocs.test.ts`

**接口：**
- 消费：Task 3 manifest 路径和状态词汇。
- 产出：用户可发现的双语学习入口及全部 33 个示例链接。

- [ ] **步骤 1：写失败 docs contract tests**，检查两个 README、manifest 链接、全部 catalog ID 链接、语言路径约定，以及两套 VitePress nav/sidebar 和 index 入口。

- [ ] **步骤 2：运行测试确认 RED。**

运行：`rtk npm.cmd test -- --runInBand src/tests/diagramExamplesDocs.test.ts`

预期：新 README 和导航项缺失导致失败。

- [ ] **步骤 3：增加 README 内容。**

说明静态 fixture gallery 与实机证据的区别、输入/结果阅读方法、状态值、provider 元数据限制和清理保证。按 manifest 每行生成链接；有 `result.png` 时显示，没有 PNG/SVG 时明确说明。英文和中文必须独立可读。

- [ ] **步骤 4：增加导航和 index 链接。**

在现有 gallery 旁增加英文和简体中文 nav/sidebar 项，并在两份 docs index 中增加对应链接。遵守既有 VitePress rewrite 约定，不重命名现有页面。

- [ ] **步骤 5：重跑 docs contract 和 docs build。**

运行：`rtk npm.cmd test -- --runInBand src/tests/diagramExamplesDocs.test.ts`

运行：`rtk npm.cmd run docs:build`

预期：测试通过，VitePress 两种语言路由无 broken link。

- [ ] **步骤 6：提交双语 docs/navigation。**

```bash
rtk git add docs/diagram-examples docs/.vitepress/config.mts docs/index.md docs/index.zh-CN.md src/tests/diagramExamplesDocs.test.ts
rtk git commit -m "docs(diagrams): add bilingual real-vault examples guide"
```

### Task 5：生成证据集并执行全部门禁

**文件：**
- 创建/修改生成文件：`docs/diagram-examples/manifest.json`、`docs/diagram-examples/<type-id>/*`
- 测试：现有 focused 与完整测试套件

**接口：**
- 消费：运行中的 `E:\\1Knowledge` Vault、已启用的 `notemd` bundle、已配置 provider，以及 Task 1-4。
- 产出：33 个真实 Vault 尝试记录、复制的结果 Artifact，以及通过的 evidence check。

- [ ] **步骤 1：只读确认 Vault 和 provider。**

运行：`rtk obsidian vault=\"E:\\1Knowledge\" plugin id=notemd`

运行：`rtk npm.cmd run cli:invoke -- --vault \"E:\\1Knowledge\" --operation provider.profile.export-redacted --pretty`

预期：Vault 可解析、`notemd` 已启用，脱敏 provider profile 可用，输出不含 secret。

- [ ] **步骤 2：执行真实生成。**

运行：`rtk npm.cmd run diagram:examples`

预期：按 catalog 顺序尝试每个 ID；每项为 `passed`、`failed` 或 `unavailable`；退出前完成清理，生成记录不含绝对路径或疑似 secret 元数据。

- [ ] **步骤 3：检查生成证据和 Vault 清理。**

运行：`rtk npm.cmd run diagram:examples:check`

运行：`rtk obsidian vault=\"E:\\1Knowledge\" search query=notemd-real-diagram-examples limit=100`

预期：check 无漂移；搜索不到专属前缀下的临时源笔记或生成 Artifact。

- [ ] **步骤 4：执行 focused 与完整验证。**

运行：`rtk npm.cmd test -- --runInBand src/tests/diagramExamplesRuntime.test.ts src/tests/diagramExamplesCatalog.test.ts src/tests/diagramExamplesGenerator.test.ts src/tests/diagramExamplesDocs.test.ts`

运行：`rtk npm.cmd test -- --runInBand`

运行：`rtk npm.cmd run build`

运行：`rtk npm.cmd run docs:build`

运行：`rtk npm.cmd run diagram:gallery:check`

运行：`rtk npm.cmd run verify:vault-bundle`

运行：`rtk git diff --check`

预期：全部通过；provider unavailable 仍在 manifest 中明确表示，不能隐藏。

- [ ] **步骤 5：检查生成文件并提交证据集。**

检查 manifest 数量、33 个目录、Mermaid/Vega-Lite/editable-SVG/Drawnix/Circuitikz 代表性 Artifact，以及两种 README 路由。然后只提交生成证据和必要 docs 更新：

```bash
rtk git add docs/diagram-examples
rtk git commit -m "docs(diagrams): capture real-vault diagram examples"
```

