---
date: 2026-08-16
last_updated: 2026-08-17
topic: diagram-capability-catalog-and-forward-architecture
status: active
canonical_for:
  - diagram-capability-catalog
  - diagram-rendering-forward-architecture
supersedes: []
superseded_by: null
implementation_record: null
---

# 图形能力目录与向前兼容架构推进计划

## 决策摘要

Notemd 应暴露一个由可执行运行时定义派生的能力目录。目录必须保持三个独立轴：

1. **语义类型**：读者需要理解的内容。
2. **渲染目标**：生成的可编辑或可交付产物。
3. **导出格式**：`SVG`、`PNG`、`PDF` 等交付编码。

三者不能压成一个枚举。`ref/diagram-design` 的 27 类视觉分类很有参考价值，但 Notemd 当前没有实现这些布局；参考类型只能作为 `reference-only/planned` 候选，只有具备语义契约、渲染器、fixture、预览、持久化映射、文档和自动化门禁后才能进入已发布目录。

## 当前基线与风险

当前代码已经有 `src/diagram/diagramTypeCatalog.ts` 中的 10 类可执行目录，以及 `src/diagram/examples/diagramExampleCatalog.ts` 中每类一个 fixture。设置页 gallery 可以通过生产渲染器执行预览，但当前只有预览按钮，没有在生成流程中的缩略图，也没有生成式文档 gallery。

在扩展选择器之前必须先解决这些边界缺陷：

- `src/main.ts` 连续两次 `saveData`。第二次写入可能把本应只保存在设备上的 provider 密钥重新写入 `data.json`。
- `src/diagram/diagramGenerationService.ts` 重试后可能仍返回旧 `spec`，或出现 target 与产物不一致。
- `editable-html-svg` 返回 HTML 却没有 `previewSvg`，而 README 承诺它支持 SVG/PNG/PDF 导出，导致预览和 CLI 导出 fail-closed。
- target 到 MIME、扩展名、预览和导出的决策分散在多个 switch 中；某些保存路径会把 `editable-html-svg` 回退为 `.txt`，另一路径却使用 `.html`。
- LLM cache key 缺少 endpoint、transport、采样/推理参数、配置版本和租户身份；全局 `Map` 也没有容量上限。
- `OperationSchema = Record<string, unknown>` 只是文档，不是运行时校验；registry 要求与 maintainer CLI 参数已经漂移。

这些是边界契约问题，不是表面清理。若先添加更多视觉类型，会把非法组合数量和兼容迁移成本一起放大。

## 目标契约

### 语义类型

在 `src/diagram/diagramTypeCatalog.ts` 将 `ExecutableDiagramTypeDefinition` 演进为完整 `DiagramTypeDefinition`：

```ts
interface DiagramTypeDefinition {
    id: DiagramCatalogTypeId;
    intent: DiagramIntent;
    family: DiagramTypeFamily;
    semanticPattern: string;
    promptProfileId: string;
    visualRoles: readonly string[];
    defaultTarget: RenderTarget;
    compatibleTargets: readonly RenderTarget[];
    exampleFixtureId: string;
}
```

ID 是稳定的持久化标识。可以增加显示名称或别名；重命名 ID 必须通过显式 alias/migration 完成。废弃类型仍应可读取旧产物，但不再出现在新选择器中。

### 渲染目标

新增唯一的 target descriptor，建议放在 `src/rendering/renderTargetCatalog.ts`：

```ts
interface RenderTargetDescriptor {
    target: RenderTarget;
    rendererId: string;
    mimeType: string;
    sourceExtension: string;
    previewKind: 'iframe' | 'svg-companion' | 'source-only';
    exportFormats: readonly DiagramExportFormat[];
    consumerGate: 'none' | 'manual' | 'native-compile';
    fallbackPolicy: 'strict' | 'explicit';
}
```

保存、预览、导出、CLI 和 capability manifest 都只能消费这份 descriptor。`SVG`、`PNG`、`PDF` 是导出格式，不能成为 render target。

### 示例 fixture

为 `DiagramExampleDefinition` 增加 `altText`、稳定的 `selectionRationale` 和 fixture schema 版本。fixture 仍是可执行的 TypeScript 数据，文档与缩略图都由它生成；禁止另写一套文档示例数据。

### 能力 manifest

为 UI、CLI 和文档生成带版本的 manifest：

```ts
interface DiagramCapabilityManifest {
    schemaVersion: 1;
    generatedAt?: string;
    types: readonly DiagramTypeCapability[];
    renderTargets: readonly RenderTargetCapability[];
    exportFormats: readonly ExportFormatCapability[];
    examples: readonly DiagramExampleCapability[];
}
```

跟踪到 Git 的输出必须省略 `generatedAt` 或将其规范化，保证 diff 确定性。读取未知 manifest 版本时应保留原值，禁止猜测成新 schema。

## 分阶段实现计划

### Phase 0：正确性基础

**文件：** `src/main.ts`、`src/diagram/diagramGenerationService.ts`、`src/rendering/renderers/editableHtmlSvgRenderer.ts`、`src/rendering/preview/previewExport.ts`、`scripts/export-diagram-artifact.js`、`src/fileUtils.ts`、`src/llmUtils.ts`。

1. 用一次经过清洗的设置持久化替换双写，并增加回归测试，证明 local-only 密钥不会进入 `data.json`。
2. 让重试后的 `spec`、`target`、MIME、扩展名和 content 作为同一个 `RenderArtifact` 的权威结果。重试失败只能返回原始完整产物或类型化失败，不能混合旧字段。
3. `EditableHtmlSvgRenderer.render()` 使用同一个语义 SVG model 返回 `previewSvg`。增加 renderer、generation、modal/export 与 CLI 的 SVG/PNG/PDF 测试。
4. 引入 target descriptor，删除重复的扩展名/MIME/preview switch。用矩阵测试确保每个 target 只有一份 descriptor，且每个宣称的导出格式都有生产者。
5. 用版本化、规范化请求指纹替换 cache key，加入 provider ID、transport、endpoint、model、prompt/content hash、temperature、top-p、推理参数、max tokens 和配置版本，不包含明文密钥。增加容量与 TTL 淘汰。

**门禁：** 每个修复先有预期失败的 focused test，再实现最小修改；之后执行 `npm run build` 和完整 Jest。

### Phase 1：三轴可执行目录

**文件：** `src/diagram/diagramTypeCatalog.ts`、`src/diagram/types.ts`、新增 `src/rendering/renderTargetCatalog.ts`、`src/diagram/examples/diagramExampleCatalog.ts`。

1. 给每种类型加入 `defaultTarget` 与 `compatibleTargets`，在 planner 边界拒绝不兼容组合。
2. 为当前 8 个 target 建立 descriptor：`mermaid`、`json-canvas`、`vega-lite`、`html`、`editable-html-svg`、`drawio`、`drawnix`、`circuitikz`。
3. 保留 10 个已发布语义类型：Mermaid mindmap、Drawnix knowledge map、flowchart、sequence、state、class、entity-relationship、canvas map、data chart、circuit。
4. 要求每个已发布类型拥有 fixture 和生产渲染器预览。

**门禁：** 目录不变量、兼容矩阵、fixture 覆盖率和稳定 ID 测试。

### Phase 2：运行时契约与 manifest

**文件：** `src/operations/registry.ts`、新增 `src/operations/contractSchemas.ts`、新增 `src/operations/capabilityManifest.ts`、`scripts/invoke-maintainer-cli-operation.js`、`scripts/export-diagram-artifact.js`。

第一层契约硬化已经交付：`src/operations/contractSchemas.ts` 对 JSON-compatible schema 形状做准入，`src/cliContracts.ts` 在导出前拒绝非法 registry schema，`src/maintainerCliBridge.ts` 在宿主边界校验输入，同时为向前兼容保留未知旧字段。`diagram.generate` 的 host-neutral 核心继续以 `sourceMarkdown` 为输入；`sourcePath` 仍是显式 host adapter 输入，不能静默变成同一契约。`local-knowledge.inspect` 仍保持 maintainer 宿主操作，只有在存在宿主无关实现和安全元数据后才进入公共 registry。

Phase 2 的剩余工作被刻意收窄为两项：在运行时边界校验 operation 结果值；仅在不抹平人工可读示例和兼容性说明的前提下，从同一 schema 派生 maintainer help 元数据。`OperationSchema` 暂时仍是结构化 TypeScript Record；可执行准入/校验层才是运行时权威。

**门禁：** 非法参数必须在 provider 调用前失败；registry、CLI 和生成 manifest 的名称与 required fields 必须一致。

### Phase 3：确定性预览 gallery

**文件：** `src/ui/diagramExampleGallery.ts`、新增 `scripts/generate-diagram-gallery.js`、新增 `scripts/lib/diagram-gallery-runtime.js`、`docs/assets/diagrams/`（生成物）、`docs/maintainer/diagram-capability-catalog.*`。

复用现有 executable fixture 和生产渲染器。生成器应：

1. 在 `.cache/diagram-gallery/` 构建临时 browser bundle。
2. 通过与 Obsidian 相同的 preview 路径渲染每个 fixture。
3. 按 fixture ID 生成稳定文件名的 SVG/PNG 缩略图。
4. 生成带版本的 capability manifest，并删除过期生成物。
5. 若已发布类型缺预览、文件名意外变化或生成 manifest 与受控目录不一致，则失败。

应用内 gallery 应增加 inline 缩略图、target/export badges 和“使用此类型”动作；原有 eye-button 作为键盘可访问的回退入口保留。

**门禁：** Playwright 在桌面和窄屏下 smoke；生成预览不得发出网络请求；每个 SVG 必须有 `role="img"`、`<title>`、`<desc>` 和稳定 ID。

### Phase 4：双语文档与发现入口

**文件：** `README.md`、`README_zh.md`、`docs/README*`、`docs/index*`、`docs/.vitepress/config.mts`、`docs/maintainer/diagram-capability-catalog.*`。

从 manifest 生成支持矩阵。明确区分“已发布”“部分支持”和“参考/计划中”。每个已发布类型链接到预览图与 fixture ID。没有对应外部 consumer gate 时，不要宣称 Draw.io、Drawnix 或 Circuitikz 的互操作已完成。

### Phase 5：从 `diagram-design` 引入候选

参考候选包括 timeline、swimlane、quadrant、radar、loop、nested、tree、org chart、layer stack、Venn、pyramid/funnel、Gantt、scatter、high-level、process、medallion、data flow、DP integration 和 DP security matrix。它们当前不是运行时类型。

候选只有满足以下条件才能进入 shipped catalog：

- 有语义 intent 和受限输入 schema；
- 有 renderer 或明确 target 映射；
- 有确定性 fixture 与预览；
- 有持久化和升级行为；
- 有双语文档与生成式支持行；
- 有自动化渲染/导出测试；
- target 依赖外部应用时，有真实 consumer 证据。

收敛工作完成后，优先考虑 `timeline`、`swimlane`、`quadrant`；Radar 在 Vega-Lite 增加支持前保持阻塞，不能用只改标签的别名冒充实现。

### Phase 6：收敛与发布门禁

完成 Phase 0 和目录契约后，再执行 active Mermaid normalization 计划。随后消除 Drawnix 几何重复，实现或删除未接入的 Circuitikz repair loop，并将 CI 门禁收紧为 build、Jest、render-host audit、gallery freshness 和 `git diff --check`。

外部门禁必须独立存在：

- Draw.io：在 diagrams.net 打开生成 XML。
- Drawnix：打开/导入真实 `.drawnix`，检查文件名根节点树。
- Circuitikz：用固定工具链编译原生 TeX。

## 权衡与明确拒绝

- **现在照抄 27 类参考类型：** 拒绝。会产生没有 renderer 或持久化契约的选择项。
- **用一个 `DiagramKind` 同时表示类型、target 和 export：** 拒绝。会产生非法组合，迁移语义也不明确。
- **另写一套手工 docs gallery：** 拒绝。必然与 executable fixture 和 renderer 漂移。
- **导出时从 HTML 字符串解析 SVG：** 拒绝。脆弱且改变 artifact 边界；应由 renderer 显式返回 companion SVG。
- **把“任意布局选择”交给 LLM prompt：** 拒绝。语义和 target 兼容性必须由 typed planning 约束。
- **把外部 consumer 检查全部当作 CI mock：** 拒绝。真实 Draw.io/Drawnix/TeX 才能提供互操作证据。

## 完成定义

只有当目录、运行时 manifest、应用内选择器、生成式文档 gallery 和 README 矩阵全部来自同一份定义；未支持的参考类型显式标记为计划中；旧 ID 和旧产物仍可读取；每个宣称的导出都有测试生产者；build、Jest、browser、外部 consumer 和 clean-worktree 门禁均有最新证据时，才算完成。
