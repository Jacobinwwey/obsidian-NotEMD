# 图表类型目录与 Drawnix 交付实施计划

> **供 agentic worker 使用：** 必须使用 `superpowers:executing-plans` 以 inline、逐任务方式实施。步骤使用 checkbox（`- [ ]`）跟踪。

**目标：** 增加可执行图表类型目录，并让 Drawnix 知识导图用户一次切换兼容的全量画布交付与独立的演示交付。

**架构：** 保持 `DiagramSpec` 为语义边界。目录把类型解析到专属 prompt 和 renderer operation。全量画布与演示交付使用独立投影和 artifact；UI 只选择其中一条操作。新的 Drawnix metadata 保存经过验证的语义 replay record，使另一种交付可在不再次调用 LLM 时重建。

**技术栈：** TypeScript、Jest、Obsidian plugin APIs、现有 Drawnix JSON 子集、SVG、Playwright consumer tests、VitePress 文档。

## 全局约束

- 保持现有 Mermaid `mindmap` 命令、renderer、prompt、cache、fallback 和 repair 行为。
- 保持合法 Drawnix 层级、stable ID、关系端点、source-visual metadata，以及无语义配额策略。
- 不向生产 plugin bundle 引入 Drawnix、Plait 或 React runtime；consumer integration 仅用于测试。
- 不为共享布局函数添加 `full`/`presentation` flag。公开独立 operation 与 result type。
- 不带新偏好的 legacy setting 默认选择全量画布。legacy `.drawnix` artifact 保持可读。
- 不在设置或 example gallery 中展示 reference-only visual type。
- `docs/` 下的文档保持中英文配对。

---

## 实施状态（2026-08-14）

下方步骤保留原始实施顺序。未勾选的 checkbox 不表示未完成；应以任务标题和本节记录为当前状态。

| 任务 | 状态 | 已交付边界 |
|---|---|---|
| 1. 可执行类型目录 | 已实现 | 目录拥有 intent、renderer、example 与兼容性解析；缺失或非法的交付设置解析为 `full-board`。 |
| 2. 语义输入拆分 | 已实现 | Drawnix 使用独立 prompt 与多 root source-coverage 策略；Mermaid `mindmap` 保持隔离。 |
| 3. 独立投影 | 已实现 | 全量画布与演示交付使用不同 projection operation；演示交付会居中可容纳的 overview grid，限制 detail 的关系上下文范围，并把超出宽度的子层级递归拆为有界 continuation slice，同时保留 fidelity ledger。 |
| 4. Replay 与持久化 | 已实现 | namespaced replay metadata 与事务化演示 bundle 保持 legacy `.drawnix` 可读。 |
| 5. 一键选择 | 已实现 | 设置项决定下一次生成的交付；预览可在不调用 LLM、不写入文件的前提下在内存中重放另一种交付。 |
| 6. Consumer 与回归门禁 | 已实现并验证 | 已加入锁定版本的 test-only Plait ESM consumer harness、CLI 覆盖、视觉不变量和 legacy/Mermaid 隔离测试。 |

### 验证记录（2026-08-14）

- `npm run build`：通过。
- `npm test -- --runInBand`：通过，251 个套件；2,201 个测试通过，1 个跳过。provider transport 的重试夹具会输出预期的 warning/error 日志。
- `npm run docs:build`：通过。
- `git diff --check`：通过。
- presentation planner 的回归用例覆盖单一深层级：它会生成有界 continuation slice，账本保留全部节点，并为 continuation anchor 渲染虚线边框。
- 本地架构演示已从基于 `docs/architecture.zh-CN.md` 的测试规格重新生成 presentation bundle：6 个 root、25 个节点、10 条关系，校验错误为 0。
- `obsidian help`：通过，已安装的 Obsidian CLI 正常列出命令面。
- `obsidian-cli help`：当前工作站不可用（`CommandNotFoundException`）。这是环境缺口，不构成 CLI 验证证据。

---

### Task 1: 建立可执行类型目录 [已实现]

**文件：**
- 新建：`src/diagram/diagramTypeCatalog.ts`
- 修改：`src/diagram/types.ts`
- 修改：`src/types.ts`
- 修改：`src/constants.ts`
- 修改：`src/diagram/diagramPreferenceCompatibility.ts`
- 测试：`src/tests/diagramTypeCatalog.test.ts`
- 测试：`src/tests/diagramOperationInput.test.ts`

**接口：**

```ts
export type DiagramCatalogTypeId =
    | 'mermaid-mindmap'
    | 'drawnix-knowledge-map'
    | 'flowchart'
    | 'sequence'
    | 'state'
    | 'class'
    | 'entity-relationship'
    | 'canvas-map'
    | 'data-chart'
    | 'circuit';

export type DrawnixKnowledgeMapDelivery = 'full-board' | 'presentation';

export interface ExecutableDiagramTypeDefinition {
    id: DiagramCatalogTypeId;
    intent: DiagramIntent;
    family: 'knowledge' | 'behavior' | 'structure' | 'quantitative' | 'engineering';
    promptProfileId: string;
    rendererOperationId: string;
    exampleFixtureId: string;
}

export function getExecutableDiagramType(id: DiagramCatalogTypeId): ExecutableDiagramTypeDefinition;
export function findDiagramTypeByIntent(intent: DiagramIntent): ExecutableDiagramTypeDefinition;
export function resolveDrawnixKnowledgeMapDelivery(settings: Pick<NotemdSettings, 'drawnixKnowledgeMapDelivery'>): DrawnixKnowledgeMapDelivery;
```

- [ ] **Step 1：先写目录与兼容性失败测试**

```ts
expect(findDiagramTypeByIntent('drawnixMindmap').id).toBe('drawnix-knowledge-map');
expect(resolveDrawnixKnowledgeMapDelivery({})).toBe('full-board');
expect(EXECUTABLE_DIAGRAM_TYPES.every(type => type.exampleFixtureId)).toBe(true);
```

- [ ] **Step 2：运行定向测试并确认缺失 catalog/default 导致失败**

运行：`rtk npx jest src/tests/diagramTypeCatalog.test.ts src/tests/diagramOperationInput.test.ts --runInBand`

预期：失败，因为 catalog 和 `drawnixKnowledgeMapDelivery` 尚不存在。

- [ ] **Step 3：实现 registry 与 setting 默认值**

新增设置作为可选持久化数据，把缺失或非法值归一化为 `full-board`，并保持 `applyDiagramIntentPreference()` 向前兼容。不要使用 `preferredDiagramRenderTarget` 选择 presentation；它仍是 legacy artifact-format preference。

- [ ] **Step 4：重跑定向测试**

运行：`rtk npx jest src/tests/diagramTypeCatalog.test.ts src/tests/diagramOperationInput.test.ts --runInBand`

预期：PASS。

- [ ] **Step 5：提交目录契约**

运行：`rtk git add src/diagram/diagramTypeCatalog.ts src/diagram/types.ts src/types.ts src/constants.ts src/diagram/diagramPreferenceCompatibility.ts src/tests/diagramTypeCatalog.test.ts src/tests/diagramOperationInput.test.ts && rtk git commit -m "feat(diagram): add executable type catalog"`

### Task 2: 将 Drawnix 语义输入与演示策略拆开 [已实现]

**文件：**
- 新建：`src/diagram/prompts/drawnixKnowledgeMapPrompt.ts`
- 修改：`src/diagram/prompts/diagramSpecPrompt.ts`
- 修改：`src/diagram/diagramGenerationService.ts`
- 修改：`src/diagram/adapters/drawnix/drawnixSourceCoverage.ts`
- 测试：`src/tests/diagramSpecPrompt.test.ts`
- 测试：`src/tests/drawnixSourceCoverage.test.ts`
- 测试：`src/tests/diagramGenerationService.test.ts`

**接口：**

```ts
export function buildDrawnixKnowledgeMapPromptRules(options: {
    sourcePath?: string;
    targetLanguage?: string;
}): string;

export function buildSourceCoverageForest(spec: DiagramSpec, sourceMarkdown: string, sourcePath?: string): DiagramSpec;

export function buildDocumentRootedKnowledgeMap(spec: DiagramSpec, sourceLabel: string): DiagramSpec;
```

- [ ] **Step 1：先写 multi-root 与 Mermaid 隔离失败测试**

```ts
expect(buildDiagramSpecPrompt({ requiredIntent: 'drawnixMindmap' }))
    .toContain('multiple independent roots');
expect(buildDiagramSpecPrompt({ requiredIntent: 'drawnixMindmap' }))
    .not.toContain('exactly one top-level document root');
expect(buildDiagramSpecPrompt({ preferredIntent: 'mindmap' }))
    .not.toContain('Drawnix knowledge-map rules');
```

- [ ] **Step 2：运行定向测试并观察强制单 root prompt 的失败**

运行：`rtk npx jest src/tests/diagramSpecPrompt.test.ts src/tests/drawnixSourceCoverage.test.ts --runInBand`

预期：旧的强制 root 契约导致失败。

- [ ] **Step 3：将 root 合成移动到显式 overview operation**

source coverage 只负责层级补齐与 ID 保留。Drawnix prompt 请求 root scope、带角色节点、简短标签与必要跨分支关系，不能出现 Drawnix JSON、颜色、坐标或 presentation layout 决策。

- [ ] **Step 4：重跑目标测试和 generation-service 回归**

运行：`rtk npx jest src/tests/diagramSpecPrompt.test.ts src/tests/drawnixSourceCoverage.test.ts src/tests/diagramGenerationService.test.ts --runInBand`

预期：PASS；Mermaid `mindmap` 断言仍通过。

- [ ] **Step 5：提交语义边界拆分**

运行：`rtk git add src/diagram/prompts src/diagram/diagramGenerationService.ts src/diagram/adapters/drawnix/drawnixSourceCoverage.ts src/tests/diagramSpecPrompt.test.ts src/tests/drawnixSourceCoverage.test.ts src/tests/diagramGenerationService.test.ts && rtk git commit -m "feat(drawnix): separate source coverage from overview policy"`

### Task 3: 创建独立的画布与演示投影 [已实现]

**文件：**
- 修改：`src/diagram/adapters/drawnix/drawnixMindMapProjection.ts`
- 新建：`src/diagram/adapters/drawnix/drawnixKnowledgeMapPresentation.ts`
- 新建：`src/diagram/adapters/drawnix/drawnixKnowledgeMapPresentationTypes.ts`
- 新建：`src/rendering/renderers/drawnixKnowledgeMapPresentationSvgRenderer.ts`
- 测试：`src/tests/drawnixMindMapRenderer.test.ts`
- 测试：`src/tests/drawnixKnowledgeMapPresentation.test.ts`
- 测试：`src/tests/drawnixMindMapLayout.playwright.test.ts`

**接口：**

```ts
export function buildDrawnixKnowledgeMapBoardProjection(spec: DiagramSpec): DrawnixMindMapProjection;

export interface DrawnixKnowledgeMapPresentation {
    overview: DrawnixKnowledgeMapPresentationSlice;
    details: DrawnixKnowledgeMapPresentationSlice[];
    ledger: DrawnixKnowledgeMapFidelityLedger;
}

export function buildDrawnixKnowledgeMapPresentation(
    spec: DiagramSpec,
    contract: DrawnixKnowledgeMapPresentationContract
): DrawnixKnowledgeMapPresentation;

export function renderDrawnixKnowledgeMapPresentationSvg(
    slice: DrawnixKnowledgeMapPresentationSlice
): string;
```

- [ ] **Step 1：新增语义保留与 ledger coverage 失败夹具**

```ts
const presentation = buildDrawnixKnowledgeMapPresentation(complexForestSpec, desktopPresentationContract);
expect(presentation.ledger.nodeLocations).toHaveLength(allNodeIds.size);
expect(presentation.ledger.relationLocations).toHaveLength(allRelationIds.size);
expect(presentation.overview.nodes.every(node => node.id)).toBe(true);
```

- [ ] **Step 2：运行目标测试并确认缺少 planner 的失败**

运行：`rtk npx jest src/tests/drawnixKnowledgeMapPresentation.test.ts src/tests/drawnixMindMapRenderer.test.ts --runInBand`

预期：失败，因为尚无 presentation planner。

- [ ] **Step 3：实现图论驱动的 presentation planning**

保留现有 board geometry 作为 full-board operation。presentation 使用跨 root relation 数量、方向和标签重要度构建 root-cluster graph，以确定性候选排序和适配宽高比的打包选取布局。仅在请求视区无法同时满足字号与净空时切分，并将每次折叠、摘要与 slice 位置记录到 ledger。

- [ ] **Step 4：实现稳定角色视觉与 SVG 渲染**

使用 `root`、`domain`、`subsystem`、`component`、`evidence`、`external`、`cross-relation` 等 node role。presentation 路径不再按 branchIndex 表达业务颜色。保留长标签换行和 CJK 度量覆盖。

- [ ] **Step 5：运行 planner、full-board 和浏览器几何测试**

运行：`rtk npx jest src/tests/drawnixKnowledgeMapPresentation.test.ts src/tests/drawnixMindMapRenderer.test.ts src/tests/drawnixMindMapLayout.playwright.test.ts --runInBand`

预期：PASS；full-board topology 与无配额测试保持通过。

- [ ] **Step 6：提交独立投影**

运行：`rtk git add src/diagram/adapters/drawnix src/rendering/renderers/drawnixKnowledgeMapPresentationSvgRenderer.ts src/tests/drawnixMindMapRenderer.test.ts src/tests/drawnixKnowledgeMapPresentation.test.ts src/tests/drawnixMindMapLayout.playwright.test.ts && rtk git commit -m "feat(drawnix): add presentation delivery projection"`

### Task 4: 持久化 replay data 并安全保存演示 artifact [已实现]

**文件：**
- 修改：`src/diagram/adapters/drawnix/drawnixExporter.ts`
- 修改：`src/rendering/renderers/drawnixRenderer.ts`
- 新建：`src/rendering/renderers/drawnixKnowledgeMapPresentationRenderer.ts`
- 修改：`src/rendering/types.ts`
- 修改：`src/operations/diagramCommandExecution.ts`
- 修改：`src/operations/diagramCommandHostAdapter.ts`
- 测试：`src/tests/drawnixExporter.test.ts`
- 测试：`src/tests/saveDiagramArtifactFile.test.ts`
- 测试：`src/tests/diagramCommandHostAdapter.test.ts`

**接口：**

```ts
export interface DrawnixKnowledgeMapReplayRecord {
    version: 1;
    catalogTypeId: 'drawnix-knowledge-map';
    semanticSpec: PersistedDrawnixKnowledgeMapSpec;
    semanticSpecHash: string;
    deliveryManifestPaths: string[];
}

export function readDrawnixKnowledgeMapReplayRecord(data: unknown): DrawnixKnowledgeMapReplayRecord | null;
export function renderDrawnixKnowledgeMapPresentationArtifact(spec: DiagramSpec): Promise<RenderArtifact>;
```

- [ ] **Step 1：先写 metadata 与事务化保存失败测试**

```ts
expect(exported.metadata?.notemd.knowledgeMap?.version).toBe(1);
expect(readDrawnixKnowledgeMapReplayRecord(legacyExport)).toBeNull();
expect(savedPaths).toEqual([
    'Architecture_diagram.drawnix',
    'Architecture_diagram.presentation/manifest.json',
    'Architecture_diagram.presentation/overview.svg'
]);
```

- [ ] **Step 2：运行目标测试并确认 replay data 缺失**

运行：`rtk npx jest src/tests/drawnixExporter.test.ts src/tests/saveDiagramArtifactFile.test.ts --runInBand`

预期：缺少 replay record 与 presentation path 时失败。

- [ ] **Step 3：新增 namespaced replay metadata，不改写 source-visual v1 语义**

在 exporter 边界验证 canonical、受体积控制的 `DiagramSpec` 子集，对 canonical JSON 计算 hash。保留未知 namespaced metadata；不保存原始 source Markdown 或含凭据的 setting。

- [ ] **Step 4：增加专用 presentation artifact bundle**

presentation renderer 写出兼容 full board，再向 `<source>_diagram.presentation/` 写入 `manifest.json`、`overview.svg` 和确定性的 detail panel。所有创建路径都进入 manifest，整包复用现有事务化写入/回滚语义。

- [ ] **Step 5：重跑持久化与 host-adapter 测试**

运行：`rtk npx jest src/tests/drawnixExporter.test.ts src/tests/saveDiagramArtifactFile.test.ts src/tests/diagramCommandHostAdapter.test.ts --runInBand`

预期：PASS；legacy export 仍能验证并加载。

- [ ] **Step 6：提交 artifact 持久化**

运行：`rtk git add src/diagram/adapters/drawnix/drawnixExporter.ts src/rendering src/operations/diagramCommandExecution.ts src/operations/diagramCommandHostAdapter.ts src/tests/drawnixExporter.test.ts src/tests/saveDiagramArtifactFile.test.ts src/tests/diagramCommandHostAdapter.test.ts && rtk git commit -m "feat(drawnix): persist replayable presentation artifacts"`

### Task 5: 增加一键选择与可执行示例图库 [已实现]

**文件：**
- 修改：`src/ui/NotemdSettingTab.ts`
- 修改：`src/ui/NotemdSidebarView.ts`
- 修改：`src/i18n/locales/experimentalDiagramPipeline.ts`
- 修改：`src/i18n/locales/en.ts`
- 修改：`src/i18n/locales/zh_cn.ts`
- 新建：`src/diagram/examples/diagramExampleCatalog.ts`
- 新建：`src/diagram/examples/drawnixKnowledgeMapExamples.ts`
- 测试：`src/tests/providerSettingsBehavior.test.ts`
- 测试：`src/tests/diagramExampleCatalog.test.ts`
- 测试：`src/tests/diagramCommandHostAdapter.test.ts`

**接口：**

```ts
export interface DiagramExampleDefinition {
    typeId: DiagramCatalogTypeId;
    fixtureId: string;
    title: string;
    selectionRationale: string;
    sourceIntent: DiagramIntent;
}

export function getExecutableDiagramExamples(): readonly DiagramExampleDefinition[];
```

- [ ] **Step 1：先写 UI preference 与 gallery 完整性失败测试**

```ts
expect(settings.drawnixKnowledgeMapDelivery).toBe('presentation');
expect(getExecutableDiagramExamples().map(example => example.typeId))
    .toContain('drawnix-knowledge-map');
expect(getExecutableDiagramExamples().some(example => example.typeId === 'timeline')).toBe(false);
```

- [ ] **Step 2：运行目标测试并确认 selector/gallery 缺失**

运行：`rtk npx jest src/tests/providerSettingsBehavior.test.ts src/tests/diagramExampleCatalog.test.ts --runInBand`

预期：失败，因为还没有 delivery selector 或 executable-only gallery。

- [ ] **Step 3：增加两个交付选项与命令**

仅当 Drawnix 知识导图被选中时显示紧凑的 segmented control：全量画布、演示交付。保存 host routing preference。预览工具栏提供明确的另一交付操作。缺少 replay record 时显示重新生成提示，不调用 LLM，也不覆盖文件。

- [ ] **Step 4：加入生成式示例与本地化选型文案**

每个 catalog entry 都有自己的 selection rationale 和 fixture。缩略图必须通过真实 renderer path 生成。直接补 English、Simplified Chinese 和 Traditional Chinese 文案，其余 locale 保持现有 extension fallback。

- [ ] **Step 5：重跑 UI 与 command 测试**

运行：`rtk npx jest src/tests/providerSettingsBehavior.test.ts src/tests/diagramExampleCatalog.test.ts src/tests/diagramCommandHostAdapter.test.ts --runInBand`

预期：PASS。

- [ ] **Step 6：提交面向用户的目录**

运行：`rtk git add src/ui src/i18n src/diagram/examples src/tests/providerSettingsBehavior.test.ts src/tests/diagramExampleCatalog.test.ts src/tests/diagramCommandHostAdapter.test.ts && rtk git commit -m "feat(diagram): add Drawnix delivery selection and examples"`

### Task 6: 增加 Consumer 证据与回归门禁 [已实现并验证]

**文件：**
- 修改：`package.json`
- 新建：`src/tests/drawnixConsumerImport.test.tsx`
- 新建：`src/tests/drawnixKnowledgeMapPresentationVisual.test.ts`
- 修改：`src/tests/drawnixMindMapLayout.playwright.test.ts`
- 修改：`src/tests/diagramArtifactExportCli.test.ts`
- 修改：`src/tests/drawnixExportDocsContract.test.ts`

- [ ] **Step 1：新增 consumer 与视觉不变量失败测试**

```ts
expect(consumerNodeIds).toEqual(expect.arrayContaining(expectedNodeIds));
expect(consumerRelationEndpoints).toEqual(expectedRelationEndpoints);
expect(visualReport.clippedLabels).toEqual([]);
expect(visualReport.nodeLabelIntersections).toEqual([]);
expect(visualReport.missingLedgerEntities).toEqual([]);
```

- [ ] **Step 2：运行定向 consumer test 并确认 integration 缺失**

运行：`rtk npx jest src/tests/drawnixConsumerImport.test.tsx src/tests/drawnixKnowledgeMapPresentationVisual.test.ts --runInBand`

预期：在 test-only consumer harness 和 report 出现前失败。

- [ ] **Step 3：固定 test-only Drawnix/Plait consumer，并实现几何报告**

挂载只读 fixture，断言 hierarchy、ID、relation endpoint、relation text 与 visible bounds。consumer rectangle 是 consumer 证据，不能与 Notemd 静态坐标作像素比较。SVG test 要考虑 transform、CJK label 和真实 text bounds，而不是原始字符串长度。

- [ ] **Step 4：增加 Mermaid 隔离与 legacy artifact 测试**

断言 Drawnix 改动不影响 `mindmap` prompt 内容、Mermaid target selection 或 fallback traversal。断言 legacy metadata 可加载、解析为全量画布，并在请求 presentation 时返回明确的重新生成条件。

- [ ] **Step 5：运行完整验证集**

运行：`rtk npm run build`

运行：`rtk npm test -- --runInBand`

运行：`rtk npm run docs:build`

运行：`rtk git diff --check`

预期：全部通过；没有测试重新引入按深度、节点数或关系数拒绝的配额。

- [ ] **Step 6：提交验证与文档更新**

运行：`rtk git add package.json package-lock.json src/tests docs && rtk git commit -m "test(drawnix): verify presentation and compatibility contracts"`

## 覆盖复核

| 要求 | 计划任务 |
|---|---|
| 只展示可执行的类型分类与示例 | Tasks 1、5 |
| 独立 Drawnix prompt、projection、rendering | Tasks 2、3 |
| 一键切换全量画布/演示交付 | Task 5 |
| setting 与 artifact 的向前兼容 | Tasks 1、4 |
| 复杂图不使用语义配额 | Tasks 3、6 |
| Mermaid 思维导图稳定性 | Tasks 2、6 |
| 真实 consumer 导入证据 | Task 6 |
| 双语文档 | Task 6 |

## 计划复核

- 没有 task 依赖尚未实现类型的 UI 表达。
- board 与 presentation 有独立 owner、result type、持久化语义和测试。
- replay record 是增量 namespaced 数据，不重解释 legacy data。
- 计划不会把参考项目的预算写成验证限制。
- 每个运行时 task 都从失败的 focused test 开始，并以有意义的验证周期结束。
