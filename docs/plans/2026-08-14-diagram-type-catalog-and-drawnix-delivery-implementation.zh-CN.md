# 图表类型目录与 Drawnix 实施记录

> 更新：2026-08-15
> 状态：旧交付设计已废弃；文件名根节点的原生树已落地。

## 决策

原先的 `document-tree`、`full-board`、`presentation` 三种交付方式已移除。它们增加了第二条语义与持久化链路：board 写入前还要经过 replay metadata 校验。真实的 `E:\1Knowledge` 运行正是在这一步失败，artifact 尚未落盘。

现在 Drawnix 只有一条契约。`DiagramSpec` 仍是语义边界，source coverage 负责生成唯一的文档根节点，原生 projection 负责几何，`DrawnixRenderer` 写出 board 与 SVG companion。没有 replay record、交付选择器、预览转换或 presentation bundle。

## 当前契约

- `drawnixMindmap` 保持为持久化 intent，`drawnix-knowledge-map` 保持为类型目录 ID。
- 根标签来自去掉扩展名后的源文件名。`architecture.zh-CN.md` 会生成 `architecture.zh-CN` 根节点。
- Markdown 标题会形成嵌套分支。模型生成但未匹配到源文档结构的分支会进入 `Additional concepts`，不会被丢弃。
- 渲染器输出 `.drawnix`、`<source>_diagram.drawnix.svg`，以及供 Obsidian 预览的 Markdown wrapper。
- 跨分支关系保留为原生 `arrow-line`。布局根据实测标签尺寸预留外侧通道，先尝试确定性的水平接入，再使用避障 grid route。若所有水平端口组合都被封住，grid retry 才加入顶部和底部端口，原生标签仍留在已预留的通道中。grid 会保留有限端点坐标的精确值，不会把亚像素节点边界量化后从路由图中移除。
- 分配器不限制层级、节点数或关系数。测试只检查几何不变量，不规定唯一的走线路径。
- Mermaid `mindmap` 继续由 `MermaidRenderer` 处理，prompt、fallback、repair、cache 和命令行为均未改变。

## 兼容性

`loadSettings()` 会移除已持久化的废弃字段 `drawnixKnowledgeMapDelivery`，并在首次读取旧字段时保存清理后的记录。artifact CLI 仍接受 `--drawnix-delivery`，避免旧脚本在参数解析阶段失败，但该值不会影响输出。新 artifact 不再带 `metadata.notemd.knowledgeMap`。

这对依赖旧 full-board 或 presentation artifact 的用户是有意的行为变化。继续保留开关会留下易出错的第二套契约，也会让默认行为不明确。已有 `.drawnix` 文件仍是普通的 Drawnix 数据，不会被改写或尝试重建。

## 根因与修复

vault 日志中的错误为 `Drawnix knowledge-map replay record failed validation before export`。它来自已废弃的 replay validator，发生在文件写入之前；与 `E:\1Knowledge` 路径、vault 权限或 Obsidian 渲染器无关。

新的生成链路已移除该校验。后续真实 vault 运行又暴露了两个独立的预留通道路由问题。fallback grid 在查找源端点与通道端点时对坐标做了取整，合法的浮点边界会被误判为不存在。随后一次含 387 个障碍物的运行表明：两侧水平端口都可能被封住，但外侧仍有可用出口。现在 grid 保留有限坐标的精确值，并且仅在水平接入失败后从顶部和底部端口重试。回归套件覆盖亚像素路由、331 节点同侧父节点关系、383 节点且有 35 条同侧关系的树，以及最小化的垂直端口接入反例。`DiagramSpec` 校验之后，Drawnix 只保留 source coverage 与原生导出两个专属阶段。这样恢复了以文件名为根的复杂树结构，同时没有引入层级、节点或关系数量配额。

`E:\1Knowledge` 中看似没有写入源笔记目录还有独立的配置原因：已持久化的 Mermaid 自定义输出目录仍指向先前的 runtime 测试文件夹。图表 artifact 有意复用该旧设置。重置后，`.drawnix`、SVG 与 wrapper 会重新写在源笔记同目录；这不是 vault 权限或前端路径问题。

最后一次真实 vault 复现还暴露了独立的存活性问题：provider 请求停滞后，bridge 客户端超时，但插件内部 Promise 没有取消，diagram command 的 `isBusy` guard 会保持为真。`runDiagramGenerateOperation()` 现在持有一个五分钟、绑定 reporter 的 abort controller，并把 signal 传入所有图表 LLM 调用，包括结构化重试和旧 Mermaid fallback。它会在 `finally` 清理 controller，并在取消后阻止 fallback 再次发起请求。该 deadline 约束的是外部 provider，不是拓扑限制。

## 验证

- `src/tests/drawnixSourceCoverage.test.ts` 覆盖文件名根节点、标题覆盖、未匹配分支和关系重映射。
- `src/tests/drawnixMindMapRenderer.test.ts`、`src/tests/drawnixRelationLaneLayout.test.ts` 与 `src/tests/drawnixMindMapRouting.test.ts` 覆盖原生层级、标签、确定性路由、外侧通道和复杂跨分支关系。
- `src/tests/diagramGenerateOperation.test.ts` 覆盖停滞图表调用的 deadline 取消与 reporter controller 释放。
- `src/tests/diagramExampleCatalog.test.ts` 要求出货的 Drawnix 示例只有一个 `architecture.zh-CN` 根节点，且没有废弃 metadata。
- `src/tests/diagramArtifactExportCli.test.ts` 覆盖离线 artifact CLI，也检查旧交付参数的兼容 no-op。
- 发版前仍需重新执行 build、全量 Jest、Vault bundle 校验、插件 reload，并针对 `docs/architecture.zh-CN.md` 运行一次 `diagram.generate`。2026-08-15 最终在 `E:\1Knowledge` 的实机运行生成一个 `architecture.zh-CN` 根节点、332 个原生树节点和 9 条 `arrow-line` 关系，并写出 Drawnix SVG companion 与 Markdown wrapper。模型输出的拓扑会随输入变化；稳定约束是单一文件名根节点与所有已接受关系都被保留。

## 后续边界

剩余的集成证据是用真实 Drawnix consumer 打开原生 JSON，不是再增加一种布局模式。该检查应留在生产 bundle 之外。未来若要增加交付功能，必须先定义独立的用户契约，不能再次把 replay metadata 变成主 artifact 写入的前置条件。
