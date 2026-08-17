---
date: 2026-08-16
last_updated: 2026-08-17
topic: mainline-diagram-architecture-progress-and-next-direction
status: active
canonical_for:
  - current-diagram-progress
  - diagram-architecture-audit
supersedes: ./2026-05-28-mainline-progress-audit-and-next-level-direction.zh-CN.md
superseded_by: null
---

# Mainline 图形架构：当前进度审计与后续方向

本文件是当前图形平台的进度真值，替代 2026-05-28 审计作为发现入口；旧文件保留为历史材料，不再作为当前状态依据。

## 总体判断

平台已经跨过最重要的架构门槛：生成采用 spec-first，渲染器由 registry 管理，示例可执行，选择器和文档 gallery 都来自生产 renderer。剩余问题是契约收敛、Mermaid 规范化与外部 consumer 证据，不是盲目增加更多图形类型。

`ref/diagram-design` 应影响选择器体验和文档治理，而不能被当成待完成的功能清单。它定义 27 类视觉布局；Notemd 当前真实交付面是 10 个语义类型、8 个渲染目标和 3 个导出格式。

## 状态矩阵

| 领域 | 状态 | 证据 / 缺口 |
|---|---|---|
| `DiagramSpec` / spec-first 域 | 已交付 | `src/diagram/types.ts`、planner/parser、重试后的权威 artifact；`diagramGenerationFallbacks.test.ts` |
| 10 类可执行目录 | 已交付 | `src/diagram/diagramTypeCatalog.ts` |
| 可执行示例 | 已交付 | `src/diagram/examples/diagramExampleCatalog.ts`，设置页通过生产 renderer 预览 |
| 生成流程可发现性 | 已交付 | inline renderer 缩略图与“使用此类型”动作；`diagramExamplePreview.test.ts` 与 provider settings 覆盖 |
| 静态文档 gallery | 已交付 | `scripts/generate-diagram-gallery.js`、10 组 SVG/PNG、`docs/assets/diagrams/manifest.json`、响应式 smoke 与 freshness check |
| 8 个渲染器 registry | 已交付 | `RendererRegistry` 与 target renderer |
| 单一 target descriptor | 已交付 | `src/rendering/renderTargetCatalog.ts`；预览/文件落盘消费同一描述器；有矩阵测试 |
| 导出管线 | 已交付（当前 target） | Editable HTML/SVG 携带 `previewSvg`；CLI 与预览导出使用生产 renderer；外部 consumer gate 仍显式保留 |
| Drawnix 单根契约 | 已交付 | 文件名根原生树、`.drawnix` + SVG companion + Markdown wrapper |
| Circuitikz 受限模板 | 已交付 | 原生 source/template；真实编译仍需外部门禁 |
| Mermaid 规范化 | active 计划，未实施 | 渲染和预览仍使用不同规范化面 |
| Operation 可执行契约 | 部分/收敛中 | `src/operations/contractSchemas.ts` 已在契约导出时校验 schema 形状，并在 maintainer CLI 宿主边界校验输入；结果值校验与 schema 派生 help 元数据仍未完成 |
| 设置 schema 与密钥 | 当前持久化边界已交付 | `saveSettings()` 只执行一次清洗写入；local-only 凭证回归测试覆盖不变量；迁移策略另行处理 |
| LLM gateway 与缓存 | 有边界的优化已交付 | 版本化、无凭证 fingerprint，5 分钟 TTL，128 条 LRU；按 profile revision 的显式失效仍是后续加固 |
| PR CI / lint 门禁 | 等待本轮 release run | gallery/docs/build/Jest/lint 门禁已接线；本轮必须记录新鲜输出 |
| 文档发现入口 | 已交付 | README、docs hub、index、VitePress nav/sidebar 与双语 gallery 均已链接 |

## 验证快照（2026-08-17）

- `npm run diagram:gallery:check`：通过；10 个条目，无过期生成物。
- `npm run docs:build`：通过；VitePress client/server 构建和页面渲染均完成。
- `npm run build`：通过；根 TypeScript include 已收窄到 `src/**/*.ts`，browser gallery entry 继续由 esbuild 独立打包。
- `npm test -- --runInBand`：通过；255 个 suite、2,228 个通过、1 个 skipped。Phase 2 定向集合也通过：3 个 suite、18 个测试。
- `npm run lint`：仍被仓库既有基线阻断（231 errors、1,329 warnings）；新增 gallery entry 与 contract/cache/catalog 文件无 lint error，仍被报告的是已存在的 legacy 文件基线问题。
- `git diff --check`：通过；Windows 下只剩 Git 的 LF-to-CRLF 规范化警告。

## 与 `diagram-design` 的三轴对比

| 轴 | 参考项目 | Notemd 当前真值 | 决策 |
|---|---|---|---|
| 语义选择 | semantic pattern 路由到 visual type | `DiagramIntent` + type catalog | 保留 intent-first |
| 视觉类型 | 27 种布局语法 | 10 个可执行语义类型 | 通过准入门禁增量加入 |
| 产物/导出 | 自包含 HTML/SVG/PNG | 8 个 render target，SVG/PNG/PDF 按 target 不同 | target 与 export 分离 |
| 预览 | 示例 HTML 资产 | 设置页中由生产 renderer 执行 fixture | 用同一 fixture 生成文档缩略图 |
| 治理 | type references + complexity budget | registry/tests/docs 分散 | 生成带版本 manifest 与契约矩阵 |

参考 taxonomy 包含 architecture、IT current-state、timeline、swimlane、quadrant、radar、loop、nested、tree、org chart、layers、Venn、pyramid、bar、line、Gantt、scatter、medallion、process、data flow、DP integration、DP security matrix 等。Notemd 必须将它们标成 reference-only/planned，直到实现证据齐全。OAuth sequence、动画示例、imports、high-level vertical 等 gallery 变体是工作流或变体，不是新的语义类型。

## 阻塞扩展的缺陷

1. **产物身份漂移：** 重试可能返回旧 `spec` 元数据和新 content/target，导致下游导出不可复现。
2. **Target 映射漂移：** `editable-html-svg` 有 HTML content 却没有明确 SVG companion，扩展名逻辑也未集中。
3. **凭证持久化漂移：** 设置双写会让清洗后的 local-only 视图被完整 settings 覆盖。
4. **缓存隔离漂移：** provider endpoint 与运行参数未进入 cache key，语义不同的请求可能碰撞。
5. **契约漂移：** registry schema、maintainer CLI help 与结果语义仍可能不一致；schema 准入和输入边界已可执行，但结果值校验尚未普遍落地。

第 1–4 项已在工作区解决，并由聚焦回归测试覆盖。第 5 项已缩小但仍是 P1：schema 形状准入、maintainer 输入校验和未知旧字段兼容已交付；结果校验与 help/schema 派生仍需收敛。

## 有序推进方向

1. 已完成正确性基础：设置持久化、重试 artifact 身份、Editable 预览/导出、target descriptor、缓存策略与 Vega 图表尺寸。
2. 已完成三轴目录和稳定 ID，包括带 `shipped`/`reference-only` 生命周期的版本化 manifest。
3. 已完成确定性 SVG/PNG 预览、生成选择器缩略图和直接类型选择。
4. 已完成双语 gallery/docs 发现入口，并与固定 revision 的 `diagram-design` 做显式对比。
5. 已交付第一层契约硬化：共享 schema 形状校验、registry 导出准入、maintainer 输入校验和向前兼容的未知字段处理；保持 `diagram.generate` 的 sourcePath host adapter 与 sourceMarkdown core 契约分离。
6. 增加运行时结果值校验；仅在不削弱人工可读示例的前提下，才从同一 schema 派生 maintainer help 元数据。
7. 执行 Mermaid 规范化收敛；随后消除 Drawnix 几何重复并解决 Circuitikz repair-loop 边界。
8. 只有满足完整证据清单后，才接纳参考候选类型。

## 已废弃文档的纠偏

- 2026-08-15 Mermaid 方案保持 active，但 Drawnix 对比必须写当前单根原生契约，删除已不存在的 presentation 模块引用。
- `docs/maintainer/drawnix-export-spike.*` 应写一个文件名根，而不是一个或多个根。
- 2026-07-22 Drawnix brainstorm 的 full-board/presentation 与 replay 增量已被 2026-08-14 implementation record 覆盖。
- 2026-08-03 Drawnix routing 计划是历史记录，inline-default / `.assets` opt-in 以后的纠偏应明确标注。
- `docs/README*`、`docs/index*` 和 VitePress 导航应指向本审计、架构双语文档、2026-08-14 Drawnix 记录和 active 2026-08-15 Mermaid 计划。

## 验收标准

只要状态表仍能链接到可执行证据，并明确区分已交付与计划中，本审计就是当前真值。每个实现增量都必须逐段更新相关状态、加入新鲜 test/build 证据，并保持中英文同步。Schema 准入与 maintainer 输入校验已经交付；统一结果值校验、help/schema 派生和 Mermaid 规范化仍明确开放。
