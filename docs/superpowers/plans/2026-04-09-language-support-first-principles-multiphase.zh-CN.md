# Notemd 语言支持第一性原理多阶段执行计划

> **给代理执行者：** 必须使用 `superpowers:subagent-driven-development`（推荐）或 `superpowers:executing-plans`，按任务逐步执行本计划。步骤继续使用复选框 `- [ ]` 语法跟踪。

**目标：** 在不破坏现有功能鲁棒性的前提下，分阶段把 Notemd 从“任务输出语言配置”升级为“UI i18n + 统一语言策略 + 可回归验证”的完整语言支持体系。

**架构：** 采用“语言域建模 -> i18n 基础设施 -> UI 文案迁移 -> 任务语言策略收敛 -> 回归门禁”五层架构。`UI Locale` 与 `Task Output Language` 明确分离，所有任务语言决策统一收口到策略层，所有改动按阶段执行并强制执行前后同口径比对。

**技术栈：** TypeScript、Obsidian Plugin API、Jest、ESLint、npm scripts、Obsidian CLI（`obsidian` / `obsidian-cli`）

---

## 执行状态（2026-04-09）

本计划已经在 `main` 上落地，对应提交为 `88202c5`。

### 证据索引

- 基线与阶段日志：
  - `docs/superpowers/baselines/2026-04-09-language-support/`
- 最终验证产物：
  - `task9-build-after-docs.txt`
  - `task9-targeted-matrix.txt`
  - `task9-full-runInBand.txt`
  - `task9-regression-baseline.txt`
  - `task9-regression-compare.txt`
  - `task9-git-diff-check.txt`
  - `task9-obsidian-help.txt`
  - `task9-obsidian-cli-help.txt`

### 最终门禁结果

- `npm run build`: PASS
- 定向回归矩阵：PASS
- Full `npm test -- --runInBand`: PASS
- `npm run regression:language-compare`: PASS
- `git diff --check`: PASS
- `obsidian help`：已执行，相关桌面端或本地配置限制已记录在日志中
- `obsidian-cli help`：当前环境不可用（`command not found`），已记录在日志中

## 阶段边界与鲁棒性规则（必须遵守）

- 每个阶段都必须执行：`修改前基线 -> 最小改动 -> 修改后回归 -> 基线对比 -> 提交`。
- 每个阶段至少保留两份日志：`*-before.txt` 与 `*-after.txt`，放到 `docs/superpowers/baselines/<date>-language-support/`。
- 如果阶段回归失败，禁止进入下一阶段；先在当前阶段内修复并重新比对。
- 对同一功能使用同一测试入口做前后对比，避免“换口径通过”。

---

### 任务 0：冻结基线快照（当前现实）

**文件：**
- 创建/更新：`docs/superpowers/baselines/2026-04-09-language-support/environment-before.txt`
- 创建/更新：`docs/superpowers/baselines/2026-04-09-language-support/build-before.txt`
- 创建/更新：`docs/superpowers/baselines/2026-04-09-language-support/targeted-tests-before.txt`

- [ ] **步骤 1：采集环境基线**
执行：
```bash
cd /home/jacob/obsidian-NotEMD
obsidian help
obsidian-cli help
node -v
npm -v
```
预期：命令可执行（允许 Obsidian CLI 输出本地配置告警）。

- [ ] **步骤 2：采集构建基线**
执行：
```bash
cd /home/jacob/obsidian-NotEMD
npm run build
```
预期：当前基线允许失败，但必须记录失败原因（当前已知：`ref/notebook-navigator` 被 `tsconfig` include 扫入导致 `TS6059`）。

- [ ] **步骤 3：采集定向功能基线**
执行：
```bash
cd /home/jacob/obsidian-NotEMD
npm test -- --runInBand src/tests/workflowButtons.test.ts src/tests/sidebarDomButtonClicks.test.ts src/tests/llmUtilsProviderSupport.test.ts src/tests/providerDiagnostics.test.ts
```
预期：PASS；作为语言支持改造期间的关键行为基线。

---

### 任务 1：引入语言域模型（单一事实源）

**文件：**
- 创建：`src/i18n/languageContext.ts`
- 创建：`src/i18n/taskLanguagePolicy.ts`
- 修改：`src/types.ts`
- 修改：`src/constants.ts`
- 测试：`src/tests/languagePolicy.test.ts`

- [ ] **步骤 1：编写失败测试，覆盖策略规则**
覆盖：全局语言、按任务语言、禁用自动翻译、Translate 任务例外、Mermaid 特殊策略。

- [ ] **步骤 2：运行测试并确认失败**
执行：
```bash
npm test -- --runInBand src/tests/languagePolicy.test.ts
```
预期：FAIL（策略层尚未实现）。

- [ ] **步骤 3：实现最小策略层**
实现统一入口：`resolveTaskLanguage(taskKey, settings)` 与 `resolveUiLocale(settings, obsidianLocale)`。

- [ ] **步骤 4：重新运行测试**
执行：
```bash
npm test -- --runInBand src/tests/languagePolicy.test.ts
```
预期：PASS。

- [ ] **步骤 5：执行前后对比**
执行：
```bash
npm test -- --runInBand src/tests/languagePolicy.test.ts > docs/superpowers/baselines/2026-04-09-language-support/task1-after.txt 2>&1
```
对比：
```bash
grep -E "PASS|FAIL" docs/superpowers/baselines/2026-04-09-language-support/task1-after.txt
```

---

### 任务 2：构建界面 i18n 基础设施（语言目录 + 回退）

**文件：**
- 创建：`src/i18n/index.ts`
- 创建：`src/i18n/locales/en.ts`
- 创建：`src/i18n/locales/zh_cn.ts`
- 创建：`src/i18n/locales/zh_tw.ts`
- 修改：`src/main.ts`
- 测试：`src/tests/i18nFallback.test.ts`

- [ ] **步骤 1：编写失败测试，覆盖回退链**
覆盖：`zh-CN -> zh -> en`、缺失 key 回退、变量插值、缓存稳定性。

- [ ] **步骤 2：确认失败**
执行：
```bash
npm test -- --runInBand src/tests/i18nFallback.test.ts
```
预期：FAIL。

- [ ] **步骤 3：实现 i18n 核心**
参考：`ref/notebook-navigator/src/i18n/index.ts` 的 `LANGUAGE_MAP + deep-merge fallback` 模式，但保持 Notemd 自身简洁边界。

- [ ] **步骤 4：重新运行测试**
执行：
```bash
npm test -- --runInBand src/tests/i18nFallback.test.ts
```
预期：PASS。

- [ ] **步骤 5：与变更前基线对比**
保存并对比本任务前后日志，确认 i18n 引入没有影响既有 provider/mermaid/workflow 测试。

---

### 任务 3：将设置页界面文案迁移到 i18n（高影响表面）

**文件：**
- 修改：`src/ui/NotemdSettingTab.ts`
- 修改：`src/i18n/locales/en.ts`
- 修改：`src/i18n/locales/zh_cn.ts`
- 测试：`src/tests/providerDiagnostics.test.ts`
- 测试：`src/tests/sidebarDomButtonClicks.test.ts`

- [ ] **步骤 1：采集变更前快照（设置页相关测试）**
执行：
```bash
npm test -- --runInBand src/tests/providerDiagnostics.test.ts src/tests/sidebarDomButtonClicks.test.ts > docs/superpowers/baselines/2026-04-09-language-support/task3-before.txt 2>&1
```

- [ ] **步骤 2：用 `strings` 访问替换硬编码界面标签**
范围：语言设置、开发者诊断、工作流构建器、Provider 配置提示。

- [ ] **步骤 3：变更后运行同一组测试**
执行：
```bash
npm test -- --runInBand src/tests/providerDiagnostics.test.ts src/tests/sidebarDomButtonClicks.test.ts > docs/superpowers/baselines/2026-04-09-language-support/task3-after.txt 2>&1
```
预期：PASS。

- [ ] **步骤 4：执行 `diff` 对比**
执行：
```bash
diff -u docs/superpowers/baselines/2026-04-09-language-support/task3-before.txt docs/superpowers/baselines/2026-04-09-language-support/task3-after.txt | sed -n '1,200p'
```
预期：只接受文案相关差异，不接受行为失败差异。

---

### 任务 4：迁移侧边栏与提示文案（运行时体验表面）

**文件：**
- 修改：`src/ui/NotemdSidebarView.ts`
- 修改：`src/ui/ErrorModal.ts`
- 修改：`src/main.ts`
- 修改：`src/i18n/locales/en.ts`
- 修改：`src/i18n/locales/zh_cn.ts`
- 测试：`src/tests/sidebarDomButtonClicks.test.ts`
- 测试：`src/tests/sidebarButtonTriggerChains.test.ts`

- [ ] **步骤 1：记录运行时界面基线测试**
执行：
```bash
npm test -- --runInBand src/tests/sidebarDomButtonClicks.test.ts src/tests/sidebarButtonTriggerChains.test.ts > docs/superpowers/baselines/2026-04-09-language-support/task4-before.txt 2>&1
```

- [ ] **步骤 2：迁移运行时可见文案**
包括：主标题、按钮文本、取消提示、日志操作提示、错误模态按钮文案。

- [ ] **步骤 3：重新运行同一组测试**
执行：
```bash
npm test -- --runInBand src/tests/sidebarDomButtonClicks.test.ts src/tests/sidebarButtonTriggerChains.test.ts > docs/superpowers/baselines/2026-04-09-language-support/task4-after.txt 2>&1
```
预期：PASS。

- [ ] **步骤 4：对比并设门禁**
只要出现 FAIL 或 open-handle 恶化，必须回滚到本阶段内修复。

---

### 任务 5：统一提示词与处理链路中的任务语言决策

**文件：**
- 修改：`src/promptUtils.ts`
- 修改：`src/fileUtils.ts`
- 修改：`src/searchUtils.ts`
- 修改：`src/main.ts`
- 修改：`src/i18n/taskLanguagePolicy.ts`
- 测试：`src/tests/languagePolicy.test.ts`
- 测试：`src/tests/processFile.test.ts`
- 测试：`src/tests/workflowButtons.test.ts`

- [ ] **步骤 1：采集变更前行为测试**
执行：
```bash
npm test -- --runInBand src/tests/languagePolicy.test.ts src/tests/processFile.test.ts src/tests/workflowButtons.test.ts > docs/superpowers/baselines/2026-04-09-language-support/task5-before.txt 2>&1
```

- [ ] **步骤 2：移除分散的语言决策**
将 `fileUtils/searchUtils/promptUtils` 内分散逻辑收敛到 `taskLanguagePolicy`。

- [ ] **步骤 3：为原本隐含的行为补充显式断言**
确保 `disableAutoTranslation`、task-specific language、translate task 例外逻辑可测。

- [ ] **步骤 4：变更后运行同一组测试**
执行：
```bash
npm test -- --runInBand src/tests/languagePolicy.test.ts src/tests/processFile.test.ts src/tests/workflowButtons.test.ts > docs/superpowers/baselines/2026-04-09-language-support/task5-after.txt 2>&1
```
预期：PASS。

- [ ] **步骤 5：对比变更前后**
仅允许预期日志文本差异；禁止功能路径变化导致断言减少。

---

### 任务 6：增加本地化格式化与 RTL 安全保护

**文件：**
- 修改：`styles.css`
- 创建：`src/i18n/localeFormat.ts`
- 修改：`src/ui/NotemdSidebarView.ts`
- 测试：`src/tests/sidebarDomButtonClicks.test.ts`

- [ ] **步骤 1：增加 RTL 与文本方向安全规则**
引入最小必要规则，避免破坏现有 panel 布局。

- [ ] **步骤 2：为格式化 helper 增加测试**
新增日期/时间格式 fallback 基础测试。

- [ ] **步骤 3：验证侧边栏布局测试**
执行：
```bash
npm test -- --runInBand src/tests/sidebarDomButtonClicks.test.ts
```
预期：PASS（尤其是 docked footer / log 区域可见性相关断言）。

---

### 任务 7：构建用于前后对比的回归脚手架

**文件：**
- 创建：`scripts/regression/language-support-baseline.sh`
- 创建：`scripts/regression/language-support-compare.sh`
- 修改：`package.json`
- 创建：`docs/superpowers/baselines/README.md`
- 测试：`src/tests/llmUtilsProviderSupport.test.ts`

- [ ] **步骤 1：脚本化基线采集命令**
把关键命令统一封装，确保团队可重复执行。

- [ ] **步骤 2：脚本化对比门禁**
自动检查 PASS/FAIL 统计和关键错误关键字（`TS6059`, `ERR_CONNECTION_CLOSED`, `socket hang up` 仅允许在 mock 日志中出现）。

- [ ] **步骤 3：在本地验证脚本**
执行：
```bash
npm run test -- --runInBand src/tests/llmUtilsProviderSupport.test.ts
bash scripts/regression/language-support-baseline.sh
bash scripts/regression/language-support-compare.sh
```
预期：compare script 返回 0 才允许继续。

---

### 任务 8：同步文档与发布流程

**文件：**
- 修改：`README.md`
- 修改：`README_zh.md`
- 修改：`docs/superpowers/plans/2026-04-09-language-support-first-principles-multiphase.en.md`
- 修改：`docs/superpowers/plans/2026-04-09-language-support-first-principles-multiphase.zh-CN.md`

- [ ] **步骤 1：记录语言支持架构**
包含 `UI Locale` 与 `Task Output Language` 的定义与使用方式。

- [ ] **步骤 2：记录回归工作流**
明确每个阶段必须保存 before/after logs。

- [ ] **步骤 3：同步发布说明要求**
确保发布说明继续保持中英双语独立段落要求。

---

### 任务 9：最终验证门禁（禁止半途交付）

**文件：**
- 验证：`src/`、`styles.css`、`README.md`、`README_zh.md`、`scripts/regression/`、`docs/superpowers/` 中的已修改文件

- [ ] **步骤 1：恢复克隆 `ref/` 目录后的构建稳定性**
若保留 `ref/notebook-navigator` 在仓库中，需在 `tsconfig.json` 排除 `ref/**`，确保构建不受参考仓库影响。

- [ ] **步骤 2：运行构建**
执行：
```bash
npm run build
```
预期：PASS。

- [ ] **步骤 3：运行定向回归矩阵**
执行：
```bash
npm test -- --runInBand src/tests/workflowButtons.test.ts src/tests/sidebarDomButtonClicks.test.ts src/tests/llmUtilsProviderSupport.test.ts src/tests/providerDiagnostics.test.ts src/tests/languagePolicy.test.ts src/tests/i18nFallback.test.ts
```
预期：PASS。

- [ ] **步骤 4：运行完整测试**
执行：
```bash
npm test -- --runInBand
```
预期：PASS（若存在已知 open-handle warning，需记录并确保未恶化）。

- [ ] **步骤 5：执行 Obsidian CLI 健康检查**
执行：
```bash
obsidian help
obsidian-cli help
```
预期：命令可执行。

- [ ] **步骤 6：执行 `diff` 质量检查**
执行：
```bash
git diff --check
```
预期：PASS。

- [ ] **步骤 7：按阶段提交**
每个阶段独立提交，禁止跨阶段混杂提交。

- [ ] **步骤 8：发布交接**
版本发布前必须附带：测试摘要、before/after 对比结论、风险余项。

---

## 面向工程师的执行说明

- 参考实现：`/home/jacob/obsidian-NotEMD/ref/notebook-navigator/src/i18n/index.ts`。
- 但 Notemd 不做全量照抄；只迁移“可维护的最小核心”（map + fallback + centralized strings + tests）。
- 每个阶段都要先跑“阶段前”测试并保存日志，任何“先改再补日志”的流程视为不合规。
