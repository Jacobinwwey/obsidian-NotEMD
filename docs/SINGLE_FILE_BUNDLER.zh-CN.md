# 单文件 HTML 打包器实现说明

## 摘要

Slidev HTML 导出支持两种模式，并以 `standalone` 作为默认值：

1. `standalone`：生成单个 `index-standalone.html`，JS 与 CSS 都内联到 HTML 中，目标是直接双击即可查看。
2. `server-script`：保留 Slidev 默认多文件产物，并生成 `start-server.sh` 与 `start-server.bat`，适合需要本地 HTTP 服务或继续调试资源文件的场景。

默认模式面向普通用户，核心目标是减少解释成本；高级模式保留给明确需要更小拆分资源、HTTP 访问或 Web 托管的人。

## 技术模型

`standalone` 模式的关键问题是：浏览器在 `file://` 协议下会限制 ES module 动态导入。打包器通过构造一个受控的 CommonJS 风格模块系统规避这一点：

```javascript
const __moduleCode = {
  './assets/index.js': '/* transformed module */'
};

function __require(modulePath) {
  const module = { exports: {} };
  const fn = new Function('__require', 'module', 'exports', 'require', __moduleCode[modulePath]);
  fn(__require, module, module.exports, __require);
  return module.exports;
}
```

主要转换规则：

- `import('./chunk.js')` 转换为 `Promise.resolve(__require('./chunk.js'))`
- `import.meta.url` 转换为稳定的静态路径
- `export { X as default }` 同时写入 `module.exports.default` 与 `module.exports`
- CSS、运行时入口与 Slidev 生成的 deck 模块一起内联到最终 HTML

这套方案的用户价值不是“更像构建工具”，而是让导出结果脱离本地服务也能被检查、发送和归档。

## 代码表面

核心相关文件：

- `src/slideExport/singleFileBundler.ts`：单文件打包主逻辑
- `src/slideExport/slidevExporter.ts`：根据 HTML 模式选择 standalone 或 server-script 路径
- `src/slideExport/serverScripts.ts`：server-script 模式的启动脚本与说明文件生成
- `src/slideExport/types.ts`：`htmlMode` 与 HTML 导出结果类型
- `src/ui/NotemdSettingTab.ts`：设置页中的 HTML 模式选择
- `src/main.ts`：把当前设置传入导出流程

## 用户流程

`standalone` 模式：

```text
选择 Markdown 文件 -> 导出为演示 -> 构建 Slidev -> 生成 index-standalone.html -> 双击查看
```

`server-script` 模式：

```text
选择 Markdown 文件 -> 导出为演示 -> 构建 Slidev -> 生成 index.html/assets/start-server.* -> 运行本地服务 -> 浏览器打开 localhost
```

## 当前 UI 行为

侧边栏的“导出”区现在提供格式选择与演示导出控制：

- 默认只显示“一次性导出”。
- “导出前先输出大纲”默认关闭。
- 打开该开关后，导出动作切换为“先输出大纲”和“基于大纲继续导出”两步。
- 环境检测结果以内联面板显示，并给出缺失工具的命令与官网链接。
- 导出进度写入现有进度区、API 活动与日志输出，不再依赖阻塞式弹窗。

## 验证重点

维护者验收不应只看 Slidev CLI 是否构建成功，还要确认：

1. 最终 HTML 的实际模式是 `standalone`，而不是兼容 fallback。
2. `index-standalone.html` 可以被浏览器打开并渲染内容。
3. Deck 生成前加载了完整 Slidev skill 目录，而不是只读取 `SKILL.md`。
4. 真实 `architecture.zh-CN.md` 导出没有可见溢出、空白 slide 或旧资源污染。
5. 生成产物留在本地可检查，但除非任务明确要求，不提交一次性导出文件。

推荐命令：

```bash
npm run verify:slidev-export -- --format html --html-mode standalone --require-native-standalone --source architecture.zh-CN.md --json
```

## 取舍

`standalone` 牺牲了部分资源拆分与缓存收益，换来最强的分发与检查便利。`server-script` 更接近传统前端构建输出，但要求用户理解本地服务。对 Obsidian 插件里的“导出为演示”来说，默认值应优先服务非命令行用户；需要 HTTP 服务的人仍可在设置中切换。
