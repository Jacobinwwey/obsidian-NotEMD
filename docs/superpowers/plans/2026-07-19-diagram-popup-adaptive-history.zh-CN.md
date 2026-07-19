# 图形弹窗与自适应历史实施计划

> **面向执行者：** 必须使用 `superpowers:executing-plans` 按任务执行。本计划使用复选框跟踪步骤。

**目标：** 以共享自适应历史视图重构图形预览和 Vault 历史弹窗，增加始终可用的命令面板/侧边栏入口，在不改变渲染和历史数据语义的前提下提升真实弹窗 UX 门禁。

**架构：** 抽出不依赖宿主的 `DiagramHistoryView`，接收历史仓库、语言和宿主回调。预览内使用右侧抽屉，命令面板和侧边栏使用轻量独立 `DiagramHistoryModal`；由 `NotemdPlugin.openDiagramHistory()` 统一创建仓库和完整回调。预览改为画布优先的顶部工具栏，并使用 Obsidian 原生导出菜单。

**技术栈：** TypeScript、Obsidian `Modal`/`Menu`/`setIcon`、现有 Jest mock、CSS 变量与 media query、现有图形历史仓库和渲染/导出函数。

## 全局约束

- 保持 Vault 历史排序、查询字段、保留上限、只删索引、产物删除边界和导出路径持久化不变。
- 保持 SVG/PNG/PDF 渲染和 PPI 行为；UI 只调用现有导出函数。
- 所有关键控件命中区不低于 44px，并提供本地化无障碍名称。
- 默认可见选择保持不超过 7 个；高级筛选渐进展开。
- 使用现有 Obsidian 原语和项目样式，不添加 UI 框架或运行时依赖。
- 英文和简体中文文案必须在独立 locale 区域维护；行为变化需要时同步 README/进度文档。
- 实机测试前必须构建并部署 `main.js`、`manifest.json`、`styles.css` 到 Study Vault，再通过 `Obsidian.com` 重载。
- 最终必须通过生产构建、完整 Jest、i18n/render 审计、Frontend Law Auditor 严格门禁，保持 `main` 和工作区同步 clean。

---

### 任务 1：定义共享历史视图合同

**文件：**
- 新建：`src/ui/DiagramHistoryView.ts`
- 修改：`src/ui/DiagramHistoryModal.ts`
- 测试：`src/tests/diagramHistoryView.test.ts`
- 修改：`src/tests/diagramHistoryModal.test.ts`

**接口：**
- 使用现有 `DiagramHistoryEntry`、`DiagramHistoryQuery`，以及包含 `loadPage`、`removeEntry`、可选 `deleteArtifacts`、可选 `reopenArtifact` 的仓库。
- 产出 `DiagramHistoryViewOptions` 和 `mountDiagramHistoryView(parent, options): DiagramHistoryViewController`。控制器提供 `destroy()`、`focusSearch()`、`refresh()`，由宿主负责生命周期和焦点。

- [x] **步骤 1：先写共享视图失败测试。**

  使用现有 Obsidian mock，断言初始只显示搜索/数量/筛选按钮，筛选默认隐藏；覆盖筛选展开、回到第一页、本地化、加载/空/无结果/错误、重试、操作回调和 `destroy()` 移除监听器。

- [x] **步骤 2：运行目标测试确认 RED。**

  ```text
  rtk cmd /c npm test -- --runInBand src/tests/diagramHistoryView.test.ts
  ```

  预期：因共享视图模块和宿主无关控制器不存在而失败。

- [x] **步骤 3：实现明确分区的共享视图。**

  根节点包含 `data-notemd-history-view`，内部依次为搜索/数量/筛选头部、默认隐藏的筛选区、列表区和分页 footer。每次状态变化都使用 `loadPage({ ...query })`。每条记录固定包含标题/来源、时间元数据、产物状态和操作区。图标控件必须设置 `aria-label` 与 `title`；视图不能直接删除 Vault 文件。

- [x] **步骤 4：运行聚焦测试并更新 Modal 测试。**

  ```text
  rtk cmd /c npm test -- --runInBand src/tests/diagramHistoryView.test.ts src/tests/diagramHistoryModal.test.ts
  ```

- [x] **步骤 5：提交共享视图。**

  ```text
  rtk git add src/ui/DiagramHistoryView.ts src/ui/DiagramHistoryModal.ts src/tests/diagramHistoryView.test.ts src/tests/diagramHistoryModal.test.ts
  rtk git commit -m "refactor(ui): share adaptive diagram history view"
  ```

### 任务 2：集中历史仓库与直达宿主

**文件：** 修改 `src/main.ts` 的预览/命令注册、`src/ui/DiagramHistoryModal.ts`、`src/ui/NotemdSidebarView.ts`、中英文 locale；新建 `src/tests/diagramHistoryEntryPoints.test.ts`。

**接口：** 使用任务 1 的共享视图；产出 `NotemdPlugin` 的 `public openDiagramHistory(host?: DiagramHistoryHostOptions): void`、始终可用的 `notemd-open-diagram-history` 命令，以及不要求活动文件的侧边栏入口。

- [x] **步骤 1：编写直达入口失败测试。** 断言命令无条件注册、插件只创建一套仓库回调、侧边栏调用 `plugin.openDiagramHistory()`、独立宿主渲染共享视图，并覆盖中英文标签。
- [x] **步骤 2：运行 RED。**

  ```text
  rtk cmd /c npm test -- --runInBand src/tests/diagramHistoryEntryPoints.test.ts
  ```

- [x] **步骤 3：抽取仓库创建。** 在 `openDiagramPreviewModal()` 旁增加 `createDiagramHistoryStore()`，集中返回现有加载、索引删除、产物记录、导出记录、产物删除和重新打开回调；增加 `public openDiagramHistory()` 创建独立宿主。预览改用同一工厂，并注册不带 `checkCallback` 的命令。
- [x] **步骤 4：增加侧边栏入口。** 在 generation 区域增加历史图标和本地化文字按钮，回调为 `this.plugin.openDiagramHistory()`；它不是要求活动文件的 workflow action，因此不加入 `SIDEBAR_ACTION_DEFINITIONS`。
- [x] **步骤 5：运行入口与回归测试。**

  ```text
  rtk cmd /c npm test -- --runInBand src/tests/diagramHistoryEntryPoints.test.ts src/tests/diagramPreviewModal.test.ts src/tests/workflowButtons.test.ts
  ```

- [x] **步骤 6：提交直达入口。**

  ```text
  rtk git add src/main.ts src/ui/DiagramHistoryModal.ts src/ui/NotemdSidebarView.ts src/i18n/locales/en.ts src/i18n/locales/zh_cn.ts src/tests/diagramHistoryEntryPoints.test.ts
  rtk git commit -m "feat(diagrams): add direct history entry points"
  ```

### 任务 3：重构画布优先的预览与抽屉

**文件：** 修改 `src/ui/DiagramPreviewModal.ts`、`src/main.ts`；新建 `src/ui/DiagramHistoryDrawer.ts`；增加 `diagramPreviewModal.test.ts` 和 `diagramHistoryDrawer.test.ts` 合同。

**接口：** 使用任务 1-2 的共享控制器和仓库；产出只有一个导出菜单的顶部工具栏，以及可恢复触发器焦点的抽屉宿主。

- [x] **步骤 1：先写预览/抽屉失败测试。** 断言一个 Export 按钮、没有旧六按钮 rail、图标控件 44px 且有无障碍名称、SVG/PNG/PDF 仍调用原函数、历史按钮打开内部抽屉而不是第二个 Modal、Escape 先关抽屉并恢复焦点。
- [x] **步骤 2：运行 RED。**

  ```text
  rtk cmd /c npm test -- --runInBand src/tests/diagramPreviewModal.test.ts src/tests/diagramHistoryDrawer.test.ts
  ```

- [x] **步骤 3：实现顶部工具栏和导出菜单。** 用顶部 toolbar 代替 rail，把既有导出函数注册到 Obsidian `Menu`；保留忙碌/禁用文案、Notice 和源码路径/诊断区。
- [x] **步骤 4：实现抽屉宿主。** 增加 `DiagramHistoryDrawer` 的 `open()`、`close()`、`toggle()`、`destroy()`；将共享视图挂到 `aside`，添加内部遮罩和关闭按钮，设置 `role="dialog"`、`aria-modal="true"` 和本地化 label；监听作用域内的 keydown，不创建 `new Modal()`。
- [x] **步骤 5：运行预览、导出、抽屉测试。**

  ```text
  rtk cmd /c npm test -- --runInBand src/tests/diagramPreviewModal.test.ts src/tests/diagramHistoryDrawer.test.ts src/tests/diagramPreview.test.ts src/tests/previewExport.test.ts
  ```

- [x] **步骤 6：提交画布优先预览。**

  ```text
  rtk git add src/ui/DiagramPreviewModal.ts src/ui/DiagramHistoryDrawer.ts src/main.ts src/tests/diagramPreviewModal.test.ts src/tests/diagramHistoryDrawer.test.ts
  rtk git commit -m "refactor(ui): make diagram preview canvas first"
  ```

### 任务 4：应用响应式弹窗视觉系统

**文件：** 修改 `styles.css` 预览/历史区、中英文 locale；测试 `providerSettingsStyles.test.ts`、新建 `diagramPopupAccessibility.test.ts`。

- [x] **步骤 1：写失败 CSS/无障碍测试。** 检查预览 toolbar、导出菜单、抽屉、遮罩、记录分区、focus-visible、reduced-motion 和窄屏全宽行为；所有关键 selector 必须有 `min-height: 44px`，抽屉在 media query 中宽度变为 `100%`。
- [x] **步骤 2：运行 RED。**

  ```text
  rtk cmd /c npm test -- --runInBand src/tests/providerSettingsStyles.test.ts src/tests/diagramPopupAccessibility.test.ts
  ```

- [x] **步骤 3：实现视觉 token。** 使用现有 `--notemd-*` 和 Obsidian 表面，删除旧 rail 规则，定义 toolbar/canvas/drawer，使用一个强调色，补充 focus-visible，避免渐变、嵌套卡片和会截断翻译文字的固定高度。
- [x] **步骤 4：实现响应式与 reduced-motion。** 桌面抽屉固定宽度，`max-width:760px` 时 `inset:0;width:100%`，toolbar 换行；reduced-motion 禁用抽屉/遮罩过渡。
- [x] **步骤 5：运行样式和 i18n 审计。**

  ```text
  rtk cmd /c npm test -- --runInBand src/tests/providerSettingsStyles.test.ts src/tests/diagramPopupAccessibility.test.ts
  rtk cmd /c npm run audit:i18n-ui
  ```

- [x] **步骤 6：提交视觉系统。**

  ```text
  rtk git add styles.css src/i18n/locales/en.ts src/i18n/locales/zh_cn.ts src/tests/providerSettingsStyles.test.ts src/tests/diagramPopupAccessibility.test.ts
  rtk git commit -m "style(ui): refine diagram popup hierarchy"
  ```

### 任务 5：文档与合同

**文件：** 修改 `README.md`、`README_zh.md`、必要的根目录语言 README、双语维护进度文档；测试 `diagramDocsContract.test.ts`、`docsBilingualSupport.test.ts`。

- [x] **步骤 1：写失败文档合同。** 要求各支持的 README 语言说明“打开图形历史”命令、侧边栏入口、右侧抽屉和导出菜单，不暴露仅供实现者阅读的细节。
- [x] **步骤 2：运行 RED。**

  ```text
  rtk cmd /c npm test -- --runInBand src/tests/diagramDocsContract.test.ts src/tests/docsBilingualSupport.test.ts
  ```

- [x] **步骤 3：更新简洁的英/中用户指南和进度证据。** README 只说明任务路径；架构细节放维护进度文档；不批量同步无关 MDX 发布文件。
- [x] **步骤 4：重跑合同并提交。**

  ```text
  rtk cmd /c npm test -- --runInBand src/tests/diagramDocsContract.test.ts src/tests/docsBilingualSupport.test.ts
  rtk git add README.md README_zh.md docs/maintainer/vault-history-settings-navigation-progress-2026-07-11.md docs/maintainer/vault-history-settings-navigation-progress-2026-07-11.zh-CN.md src/tests/diagramDocsContract.test.ts
  rtk git commit -m "docs(diagrams): explain direct history access"
  ```

### 任务 6：全量验证、视觉审计与 main 交付

**文件：** 只修改验证发现问题所需的文件；本地证据使用被忽略的 `.cache/popup-frontend-evidence.json`、`.cache/popup-frontend-audit.md`。

- [x] **步骤 1：构建并运行聚焦回归。**

  ```text
  rtk cmd /c npm run build
  rtk cmd /c npm test -- --runInBand src/tests/diagramHistoryView.test.ts src/tests/diagramHistoryDrawer.test.ts src/tests/diagramHistoryEntryPoints.test.ts src/tests/diagramPreviewModal.test.ts src/tests/diagramHistoryModal.test.ts src/tests/diagramPopupAccessibility.test.ts src/tests/diagramDocsContract.test.ts
  ```

- [x] **步骤 2：实机前部署。**

  ```text
  rtk cmd /c powershell -NoProfile -Command "Copy-Item -LiteralPath 'main.js','manifest.json','styles.css' -Destination 'E:\Knowledge\Study\.obsidian\plugins\notemd' -Force"
  rtk "C:\Program Files\Obsidian\Obsidian.com" plugin:reload id=notemd vault=Study
  ```

  交互前比较源/部署 SHA-256。

- [x] **步骤 3：实测直达入口和预览抽屉。** 使用官方 CLI `eval`/DOM 检查打开侧边栏、执行 `notemd-open-diagram-history`、打开有效预览、切换抽屉、展开筛选、搜索、重新打开记录并执行 SVG/PNG/PDF 导出，捕获 `1500x855` 桌面和 `<=760px` 窄屏截图。
- [x] **步骤 4：运行严格 Frontend Law Auditor。** 更新真实目标尺寸、可见选择数量、抽屉可达性、焦点返回、反馈时间和结束状态证据：快速门禁 0、得分 >=85、P0/P1 无未知。
- [x] **步骤 5：运行全量门禁与错误检查。**

  ```text
  rtk cmd /c npm test -- --runInBand
  rtk cmd /c npm run audit:i18n-ui
  rtk cmd /c npm run audit:render-host
  rtk git diff --check
  rtk "C:\Program Files\Obsidian\Obsidian.com" dev:errors vault=Study
  rtk "C:\Program Files\Obsidian\Obsidian.com" dev:console level=error limit=50 vault=Study
  ```

- [x] **步骤 6：清理临时状态并交付 main。** 删除临时 Vault 笔记/历史/导出，确认收藏及无关设置未变化，审阅完整 diff，提交验证修复，推送 `main`，fetch `origin/main`，确认 `HEAD == origin/main` 且工作区 clean。
