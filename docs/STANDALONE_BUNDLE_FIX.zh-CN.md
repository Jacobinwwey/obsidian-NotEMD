# Standalone HTML Bundle 导出修复说明

## 已解决的问题

早期 standalone HTML bundle 会显示空 slide，只看到 Vue comment 节点 `<!---->`，而不是实际的 Slidev 内容。

根因是 ES module 到 CommonJS 的转换没有正确处理 Vue 组件模块里的默认导出：

```javascript
export { S as default }
```

旧转换只生成：

```javascript
module.exports.default = S;
```

但 Vue 的异步组件加载在该场景下还需要 `module.exports` 本身指向默认导出。

## 修复方案

默认导出现在同时写入两个位置：

```javascript
module.exports.default = module.exports = S;
```

这样既保留 `default` 访问，又兼容 CommonJS loader 直接读取 `module.exports` 的路径。

## 转换规则

| 原始 ES Module | 转换后的 CommonJS |
| --- | --- |
| `export default X` | `module.exports.default = module.exports = X` |
| `export { X as default }` | `module.exports.default = module.exports = X` |
| `export { X as Y }` | `module.exports.Y = X` |
| `export { X }` | `module.exports.X = X` |
| `export const X = ...` | `const X = module.exports.X = ...` |

同时仍保留：

- `import()` 到 `Promise.resolve(__require())` 的转换
- `import.meta.url` 的静态路径替换
- 自定义 `__require()` 模块缓存
- 所有 JS/CSS 内联到最终 HTML

## 验证方式

维护者验证应优先使用真实 workflow：

```bash
npm run verify:slidev-export -- --format html --html-mode standalone --require-native-standalone --source architecture.zh-CN.md --json
```

如果只验证单文件打包器的历史 POC，可运行对应的 bundle 脚本并用浏览器检查：

```bash
node test-bundle-FIXED.js
```

真实验收应确认：

1. slide DOM 存在；
2. slide 文本可见；
3. Vue 组件不再退化成空 comment；
4. 浏览器控制台没有 loader binding 错误；
5. 输出为 `index-standalone.html`，而不是仅靠 server-script fallback 通过。

## 用户影响

修复后的 standalone HTML 可以：

- 直接双击打开；
- 离线查看；
- 作为单文件发送；
- 不要求用户启动本地 HTTP 服务。

如果未来 Slidev 生成的 bundle 形态再次变化，strict standalone gate 应先失败并保留 rejected attempt，而不是把坏的 `index-standalone.html` 当作成功产物。

## 安全与性能

Standalone bundle 是静态 HTML，不启动本地服务，也不需要外部网络。它使用受控构建产物生成 `Function` loader；这不是运行时加载远程代码，但仍应把输入边界限定在本地构建出的 Slidev 资源内。

性能目标与普通 Slidev SPA 一致：现代浏览器应在短时间内加载完成，渲染质量由后续 Playwright 全 deck 审计确认。
