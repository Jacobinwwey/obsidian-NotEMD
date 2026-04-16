# 中国区 Provider 扩展第二轮执行计划

> **给代理执行者：** 必须使用 `superpowers:subagent-driven-development`（推荐）或 `superpowers:executing-plans`，按任务逐步执行本计划。步骤继续使用复选框 `- [ ]` 语法跟踪。

**目标：** 将 `Qwen Code`、`Z AI` 与 `Huawei Cloud MaaS` 作为 Notemd 的完整 provider 预设交付，包括运行时覆盖、连接测试覆盖、文档更新与补丁版本发布。

**架构：** 三个 provider 全部继续复用现有 `openai-compatible` transport，使实现保持 metadata-driven。先扩展 provider registry，再用定向 routing 与 connection-test 覆盖锁定行为，最后更新文档并带着必需资产发布双语版本。

**技术栈：** TypeScript、Jest、Obsidian Plugin API、现有 Notemd provider registry/runtime、GitHub Releases

---

## 文件结构

### 核心 Provider 元数据
- 修改：`src/llmProviders.ts`
- 职责：新增 provider 预设、描述、setup hint、排序、默认 model 以及 API-test 元数据。

### 运行时与连接测试覆盖
- 修改：`src/tests/llmProviders.test.ts`
- 修改：`src/tests/llmUtilsProviderSupport.test.ts`
- 职责：锁定这些新 provider 的 registry 暴露、transport 路由、probe endpoint 与 transient-failure fallback 行为。

### 文档与发布材料
- 修改：`README.md`
- 修改：`README_zh.md`
- 修改：`change.md`
- 修改：`package.json`
- 修改：`package-lock.json`
- 修改：`manifest.json`
- 修改：`versions.json`
- 职责：为 `1.7.6` 同步 provider 文档、changelog 与发布元数据。

### 验证与发布
- 重新构建产物：`main.js`
- 发布资产：`main.js`、`manifest.json`、`styles.css`、`README.md`
- 职责：产出一个干净的 patch release，并附带双语 release notes 与必需资产。

---

### 任务 1：为新 Provider 增加 Registry 覆盖

**文件：**
- 修改：`src/tests/llmProviders.test.ts`
- 修改：`src/llmProviders.ts`
- 验证：`src/tests/llmProviders.test.ts`

- [ ] **步骤 1：编写失败的注册表断言**

新增测试期望，检查：
- provider 存在性：`Qwen Code`、`Z AI`、`Huawei Cloud MaaS`
- transport：`openai-compatible`
- API test mode：`chat-only`
- openai-compatible 分类

这些新增断言应出现在：
- 扩展后的 provider-set 断言中
- transport 元数据断言中
- China-focused / openai-compatible 元数据断言块中

- [ ] **步骤 2：运行聚焦的注册表测试并确认失败**

执行：

```bash
npx jest src/tests/llmProviders.test.ts --runInBand
```

预期：
- 失败，因为三项 provider 还没有进入 `src/llmProviders.ts`

- [ ] **步骤 3：实现最小注册表条目**

更新 `src/llmProviders.ts`，新增：
- `Qwen Code`
- `Z AI`
- `Huawei Cloud MaaS`

除非实现阶段查阅官方文档后证明存在更安全的默认值，否则使用以下默认配置：
- `Qwen Code`
  - base URL: `https://dashscope.aliyuncs.com/compatible-mode/v1`
  - model: `qwen3-coder-plus`
- `Z AI`
  - base URL: `https://api.z.ai/api/paas/v4`
  - model: `glm-5`
- `Huawei Cloud MaaS`
  - base URL: `https://api.modelarts-maas.com/v1`
  - model: `DeepSeek-V3`

三个 provider 都应使用：
- category: `cloud`
- transport: `openai-compatible`
- apiKeyMode: `required`
- apiTestMode: `chat-only`

- [ ] **步骤 4：重新运行聚焦的注册表测试并确认通过**

执行：

```bash
npx jest src/tests/llmProviders.test.ts --runInBand
```

预期：
- PASS

- [ ] **步骤 5：提交注册表切片**

```bash
git add src/llmProviders.ts src/tests/llmProviders.test.ts
git commit -m "feat: add round 2 china provider presets"
```

---

### 任务 2：为新 Provider 增加运行时路由测试

**文件：**
- 修改：`src/tests/llmUtilsProviderSupport.test.ts`
- 验证：`src/tests/llmUtilsProviderSupport.test.ts`

- [ ] **步骤 1：编写失败的 `callLLM()` 测试**

新增聚焦测试，断言 `callLLM()` 会将：
- `Qwen Code` 路由到 DashScope compatible `chat/completions`
- `Z AI` 路由到 `https://api.z.ai/api/paas/v4/chat/completions`
- `Huawei Cloud MaaS` 路由到 `https://api.modelarts-maas.com/v1/chat/completions`

每条测试都应断言：
- URL
- `Authorization` header
- model 透传
- 现有 OpenAI-compatible 响应解析器成功提取结果

- [ ] **步骤 2：运行聚焦的 provider-support 测试并确认失败**

执行：

```bash
npx jest src/tests/llmUtilsProviderSupport.test.ts --runInBand
```

预期：
- 失败，因为新 provider 尚未被 routing 断言覆盖，或测试依赖的元数据路径还无法识别这些 provider 名称

- [ ] **步骤 3：以最小改动补齐运行时覆盖**

只更新那些让新 provider 名称流经现有 `openai-compatible` 路径所必需的代码。

重要约束：
- 不要新增 transport
- 除非实现证明共享路径完全不可行，否则不要新增基于 provider-name 的 runtime 分支

- [ ] **步骤 4：重新运行聚焦的 provider-support 测试并确认新路由测试通过**

执行：

```bash
npx jest src/tests/llmUtilsProviderSupport.test.ts --runInBand
```

预期：
- 新增的 `callLLM()` 用例 PASS

- [ ] **步骤 5：提交运行时路由切片**

```bash
git add src/tests/llmUtilsProviderSupport.test.ts src/llmProviders.ts src/llmUtils.ts
git commit -m "test: cover runtime routing for new china providers"
```

---

### 任务 3：增加连接测试与瞬时回退覆盖

**文件：**
- 修改：`src/tests/llmUtilsProviderSupport.test.ts`
- 验证：`src/tests/llmUtilsProviderSupport.test.ts`

- [ ] **步骤 1：编写失败的 `testAPI()` 测试**

新增以下测试：
- `Qwen Code` 的 `testAPI()` 成功探测
- `Z AI` 的 `testAPI()` 成功探测
- `Huawei Cloud MaaS` 的 `testAPI()` 成功探测
- 每个新 provider 在 `testAPI()` 阶段发生瞬时 `ERR_CONNECTION_CLOSED` 时的 fallback

每条测试都应断言：
- `chat/completions` probe 路径
- fallback 后的预期调用次数
- 恢复重试后的 `success: true`

- [ ] **步骤 2：运行聚焦的 provider-support 测试并确认新连接用例失败**

执行：

```bash
npx jest src/tests/llmUtilsProviderSupport.test.ts --runInBand
```

预期：
- 失败，直到 registry 元数据与测试夹具补齐这些新 connection 用例

- [ ] **步骤 3：实现最小连接测试支持**

保持实现继续 metadata-driven：
- `apiTestMode: chat-only`
- 复用现有 `requestUrlForConnectionTest()` fallback 路径

除非证明确实存在 provider 专属不兼容，否则不要单独为这些 provider 新增连接测试函数。

- [ ] **步骤 4：重新运行聚焦的 provider-support 测试并确认通过**

执行：

```bash
npx jest src/tests/llmUtilsProviderSupport.test.ts --runInBand
```

预期：
- PASS

- [ ] **步骤 5：提交连接测试切片**

```bash
git add src/tests/llmUtilsProviderSupport.test.ts src/llmProviders.ts src/llmUtils.ts
git commit -m "test: cover connection probes for new china providers"
```

---

### 任务 4：更新 Provider 扩展文档

**文件：**
- 修改：`README.md`
- 修改：`README_zh.md`
- 修改：`change.md`

- [ ] **步骤 1：编辑前先写文档检查清单**

确认每份文档都会提到：
- `Qwen Code` 作为 coding-focused preset
- `Z AI` 作为 `GLM` 的国际补充入口
- `Huawei Cloud MaaS` 作为托管式 OpenAI-compatible preset
- 更新后的 provider 覆盖列表

- [ ] **步骤 2：更新英文 README**

编辑 `README.md`，更新：
- feature / preset 覆盖 bullet
- provider 配置章节
- supported provider table/list

- [ ] **步骤 3：更新中文 README**

编辑 `README_zh.md`，以中文表达与英文 README 同样的含义。

- [ ] **步骤 4：更新变更日志**

在 `change.md` 中新增 `1.7.6` 小节，说明：
- 新增的 preset
- provider 测试覆盖
- 本次发布涉及的 runtime 行为说明

- [ ] **步骤 5：提交文档切片**

```bash
git add README.md README_zh.md change.md
git commit -m "docs: add round 2 provider coverage"
```

---

### 任务 5：准备并验证 1.7.6 发布

**文件：**
- 修改：`package.json`
- 修改：`package-lock.json`
- 修改：`manifest.json`
- 修改：`versions.json`
- 构建：`main.js`

- [ ] **步骤 1：将版本元数据同步到 `1.7.6`**

同步：
- `package.json`
- `package-lock.json`
- `manifest.json`
- `versions.json`
- `README.md` 与 `README_zh.md` 中任何可见版本字符串

- [ ] **步骤 2：运行完整仓库验证**

执行：

```bash
npm test -- --runInBand
npm run build
git diff --check
obsidian help
obsidian-cli help
```

预期：
- Jest 通过
- build 退出 `0`
- `git diff --check` 干净
- Obsidian CLI 结果必须如实记录，包括当前机器环境中仍可能失败的限制

- [ ] **步骤 3：提交发布准备切片**

```bash
git add package.json package-lock.json manifest.json versions.json README.md README_zh.md change.md main.js
git commit -m "chore: release 1.7.6"
```

- [ ] **步骤 4：推送、打标签并创建 GitHub 发布**

使用非交互式 git 与 GitHub CLI 命令：

```bash
git push origin main
git tag -a 1.7.6 -m "Release 1.7.6"
git push origin 1.7.6
gh release create 1.7.6 main.js manifest.json styles.css README.md --title 1.7.6 --notes-file /tmp/notemd-release-1.7.6.md --verify-tag
```

Release notes 要求：
- 完整英文段
- 完整中文段
- 两部分都可独立阅读

- [ ] **步骤 5：验证已发布的 GitHub 发布**

执行：

```bash
git status --short --branch
gh release view 1.7.6 --json tagName,name,url,body,assets
```

预期：
- worktree 干净
- tag/name 正确
- 四项必需资产已上传
- 双语 release body 存在

---

## 评审说明

本计划刻意保持 metadata-driven 实现。如果目标 provider 里有任何一个最终被证明确实需要非标准 auth header、签名或协议流，必须停止并将该 provider 单独拆到另一份设计中，而不是强行塞进共享 transport 路径。

当前会话没有用户明确授权进行子代理委派，因此未使用专门的 plan-review 子代理。本计划已根据已批准的 spec `docs/superpowers/specs/2026-03-26-china-provider-expansion-round2-design.md`、当前测试布局以及仓库已经固化的发布规则完成自审。
