# Slidev 导出目录

该目录用于存放 NotEMD 插件生成的 Slidev 演示导出结果。

## 导出模式

### Standalone 模式（默认）

输出为单个 HTML 文件：

```text
export/presentation-slides/
└── index-standalone.html
```

适用场景：

- 需要双击直接查看；
- 需要离线归档；
- 需要把演示作为单文件发送；
- 接收方不熟悉命令行或本地服务。

### Server-Script 模式（高级）

输出为多文件结构和本地启动脚本：

```text
export/presentation-slides/
├── index.html
├── assets/
├── start-server.sh
├── start-server.bat
└── README.md
```

适用场景：

- 需要继续检查或修改构建资源；
- 需要通过 localhost 查看；
- 计划把产物部署到 Web 服务器；
- standalone sanity check 失败后需要兼容 fallback。

启动方式：

```bash
cd export/presentation-slides/
./start-server.sh
```

Windows 下运行：

```cmd
start-server.bat
```

然后访问：

```text
http://localhost:8765
```

## UI 配置

导出格式可在侧边栏“导出”区快速选择，也可在 Obsidian 设置中的 Slide Export 配置项里调整。

当前侧边栏行为：

- 默认只显示“一次性导出”。
- 打开“导出前先输出大纲”后，显示“先输出大纲”和“基于大纲继续导出”两个顺序动作。
- 环境检测结果以内联面板展示，包含安装命令和官网链接。
- 导出进度写入现有进度区、API 活动和日志输出，不使用阻塞弹窗。

## 文件结构

```text
docs/export/
├── presentation-1-slides/
│   └── index-standalone.html
├── presentation-2-slides/
│   ├── index.html
│   ├── assets/
│   ├── start-server.sh
│   ├── start-server.bat
│   └── README.md
└── README.md
```

## 故障排查

### Standalone 模式打开后空白

1. 确认文件是 `index-standalone.html`。
2. 用 Chrome、Firefox 或 Edge 再试一次。
3. 打开浏览器开发者工具检查 console。
4. 使用严格 verifier 重新导出：

```bash
npm run verify:slidev-export -- --format html --html-mode standalone --require-native-standalone --source architecture.zh-CN.md --json
```

### Server-Script 模式无法启动

1. 检查 Python 或 Node.js 是否可用：

```bash
python3 --version
node --version
```

2. Linux/macOS 下确认脚本可执行：

```bash
chmod +x start-server.sh
```

3. 如果端口 `8765` 被占用，修改脚本或用手动方式启动其他端口。

### localhost 页面空白

1. 确认服务仍在运行。
2. 确认访问的是 `http://localhost:8765`。
3. 清理浏览器缓存或换浏览器。
4. 查看 console 中是否有资源路径或 ES module 错误。

## 安全说明

Standalone 模式是静态文件，不需要网络或本地服务。

Server-script 模式只绑定本地机器，用户手动启动和停止。完成查看后可以用 `Ctrl+C` 关闭服务。

## 相关文档

- [STANDALONE_BUNDLE_FIX.md](../STANDALONE_BUNDLE_FIX.md)
- [SINGLE_FILE_BUNDLER.md](../SINGLE_FILE_BUNDLER.md)
- [SLIDEV_SOLUTION.md](../SLIDEV_SOLUTION.md)
- [SLIDEV_HTML_FIX.md](../SLIDEV_HTML_FIX.md)

## 提交策略

该目录中的导出产物主要用于本地检查。除非任务明确要求提交生成结果，不要把一次性测试导出文件提交到 main。
