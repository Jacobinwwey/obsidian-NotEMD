---
date: 2026-08-16
last_updated: 2026-08-16
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

平台已经跨过最重要的架构门槛：生成采用 spec-first，渲染器由 registry 管理，示例是可执行 fixture。剩余问题是收敛和契约真实化，不是盲目增加更多图形类型。

`ref/diagram-design` 应影响选择器体验和文档治理，而不能被当成待完成的功能清单。它定义 27 类视觉布局；Notemd 当前真实交付面是 10 个语义类型、8 个渲染目标和 3 个导出格式。

## 状态矩阵

| 领域 | 状态 | 证据 / 缺口 |
|---|---|---|
| `DiagramSpec` / spec-first 域 | 已交付 | `src/diagram/types.ts`、planner、parser；重试身份缺陷仍开放 |
| 10 类可执行目录 | 已交付 | `src/diagram/diagramTypeCatalog.ts` |
| 可执行示例 | 设置页已交付 | `src/diagram/examples/diagramExampleCatalog.ts`，设置页预览动作 |
| 生成流程可发现性 | 部分完成 | 没有 inline 缩略图和“使用此类型”路径 |
| 静态文档 gallery | 未实现 | 没有生成式预览资产和 manifest |
| 8 个渲染器 registry | 已交付 | `RendererRegistry` 与 target renderer |
| 单一 target descriptor | 未实现 | MIME、扩展名、预览、导出 switch 仍分散 |
| 导出管线 | 基本完成 | Editable 生产产物缺 `previewSvg`，却被 README 宣称支持 |
| Drawnix 单根契约 | 已交付 | 文件名根原生树、`.drawnix` + SVG companion + Markdown wrapper |
| Circuitikz 受限模板 | 已交付 | 原生 source/template；真实编译仍需外部门禁 |
| Mermaid 规范化 | active 计划，未实施 | 渲染和预览仍使用不同规范化面 |
| Operation 可执行契约 | 部分/漂移 | registry 元数据不是运行时校验；CLI 与 registry 字段不一致 |
| 设置 schema 与密钥 | 部分完成，P0 开放 | 连续写入可能破坏 local-only 隔离 |
| LLM gateway 与缓存 | 部分完成，P0/P1 开放 | cache fingerprint 不完整且无上限 |
| PR CI / lint 门禁 | 不完整 | build/Jest 已有；lint 基线噪声仍需 ratchet |
| 文档发现入口 | 陈旧 | 当前架构和 active plan 没有成为 VitePress 顶层入口 |

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
5. **契约漂移：** registry schema 只是描述性 Record，不是可执行 validator；CLI help 与运行时可能不一致。

这些都是跨持久化、兼容性或安全边界的 P0/P1 问题，应该先解决，再扩展类型。

## 有序推进方向

1. 修复设置持久化、重试产物身份、Editable 预览/导出、target descriptor 和缓存策略。
2. 固化三轴目录和稳定 ID。
3. 建立可执行 operation contract 与版本化 capability manifest。
4. 生成确定性的 SVG/PNG 预览，并把缩略图接入生成选择器。
5. 由 manifest 生成双语 README/docs 矩阵并更新发现导航。
6. 执行 Mermaid 规范化收敛；然后消除 Drawnix 布局重复并解决 Circuitikz repair-loop 边界。
7. 只有满足完整证据清单后，才接纳参考候选类型。

## 已废弃文档的纠偏

- 2026-08-15 Mermaid 方案保持 active，但 Drawnix 对比必须写当前单根原生契约，删除已不存在的 presentation 模块引用。
- `docs/maintainer/drawnix-export-spike.*` 应写一个文件名根，而不是一个或多个根。
- 2026-07-22 Drawnix brainstorm 的 full-board/presentation 与 replay 增量已被 2026-08-14 implementation record 覆盖。
- 2026-08-03 Drawnix routing 计划是历史记录，inline-default / `.assets` opt-in 以后的纠偏应明确标注。
- `docs/README*`、`docs/index*` 和 VitePress 导航应指向本审计、架构双语文档、2026-08-14 Drawnix 记录和 active 2026-08-15 Mermaid 计划。

## 验收标准

只要状态表仍能链接到可执行证据，并明确区分已交付与计划中，本审计就是当前真值。Phase 0 开始后必须逐段更新本文件：只修改对应状态行并加入 test/build 证据，同时保持英文和中文同步。
