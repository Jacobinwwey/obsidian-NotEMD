# Slidev HTML 导出验证说明

本文记录 NoteMD Slidev 工作流中 HTML 导出的当前行为与验收方式。

## 当前事实

HTML 导出支持两个模式：

1. `standalone`：生成 `index-standalone.html`。这是默认路径，也是维护者检查本地可分发 HTML 时的首选路径。
2. `server-script`：生成普通 Slidev SPA、`assets/` 目录和本地启动脚本。该模式用于兼容需要 HTTP 服务的浏览器环境。

默认维护者烟测命令为：

```bash
npm run verify:slidev-export
```

当验收目标明确是原生 standalone HTML 时，应使用严格门禁：

```bash
npm run verify:slidev-export -- --format html --html-mode standalone --require-native-standalone --source architecture.zh-CN.md --json
```

严格 standalone 门禁要求 `htmlExport.actualMode = "standalone"` 且 `standaloneGate.passed = true`。兼容 HTML 验证通过并不等于 standalone 一定通过，因为它可能走了 `server-script-fallback`。

## 验证覆盖

维护者命令覆盖以下内容：

1. 从 `docs/architecture.zh-CN.md` 准备 Slidev source deck。
2. 加载完整 Slidev skill 目录，包括 `references/*.md`。
3. 本地 Slidev fork 存在时优先使用该 fork。
4. 构建前重建 HTML 输出目录，避免旧资源污染结果。
5. 生成 deck 不包含历史产物中的过期文本。
6. 生成 deck 不选择未安装主题。
7. Playwright 打开最终 HTML，并默认审计全 deck。
8. 严格 standalone 模式会在 fallback 时失败，而不是把兼容通过当作 standalone 通过。
9. 生成的检查产物不会被 `.gitignore` 隐藏到无法人工检查。

## 手动验证

运行：

```bash
npm run verify:slidev-export
```

典型报告字段应类似：

```json
{
  "ok": true,
  "htmlExport": {
    "actualMode": "standalone",
    "requiresLocalServer": false
  },
  "standaloneGate": {
    "passed": true
  },
  "slideSource": {
    "skillReferenceCount": 52
  },
  "ignoredOutputs": []
}
```

`skillReferenceCount` 会随本地 Slidev skill 更新而变化，但在 skill 目录存在时不应降为 `0`。

## Server-Script 兼容路径

验证 server-script 模式：

```bash
npm run verify:slidev-export -- --html-mode server-script --no-playwright
```

预期输出包含：

```text
index.html
assets/
start-server.sh
start-server.bat
README.md
```

人工测试浏览器行为时，应进入输出目录并运行生成的启动脚本。

## UI 与用户反馈

侧边栏中的“检测演示导出环境”不应弹出阻塞窗口。检测结果以内联面板显示：

- 已安装工具显示版本或可用状态。
- 缺失工具显示错误、安装命令和官网链接。
- `Slidev CLI` 与 `Playwright Chromium` 可从面板触发自动安装。
- `Node.js` 与 `ffmpeg` 给出手动安装指引。

导出任务进度写入侧边栏底部的进度区、API 活动和日志输出，让用户在任务运行时仍能继续查看上下文。

## 输出策略

`docs/export/` 下的生成文件是本地检查产物。它们应在测试期间保留给维护者检查，但除非任务明确要求提交生成内容，不应把一次性导出产物加入 main。
